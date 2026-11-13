import type {
  Pet,
  PetInteractionInput,
  PetMilestoneKind,
  PetNameInput,
  PetStage,
  PetTimeline,
} from "@lovenotes/contracts";
import type { Tx } from "../../db/client";
import { AppError, conflict, notFound } from "../../lib/errors";
import { newId } from "../../lib/ids";
import { assertWritable, type SpaceScope } from "../../lib/scope";
import { DAY_MS, HOUR_MS } from "../../lib/time";
import { withTx } from "../../lib/tx";
import { publish } from "../../realtime/hub";
import { activityRepo } from "../activity";
import { notify } from "../notifications";
import { type BondSource, bondFor } from "./bond";
import { eligibleMilestones, nextStage } from "./growth";
import { type PetRow, petRepo } from "./pet.repo";
import { ageDays, petName, toPetView } from "./pet.view";

/**
 * What changed about the pet inside a transaction. Callers hand it to `announcePet` after
 * the transaction commits, so realtime events and notifications never describe rolled-back work.
 */
export type PetOutcome = {
  pet: Pet | null;
  name: string;
  milestones: PetMilestoneKind[];
  /** Pet updates are pushed at most once a day; otherwise they're in-app only. */
  pushAllowed: boolean;
  interaction?: { userId: string; kind: PetInteractionInput["kind"] };
};

/** Combine outcomes from several `growPet` calls in one transaction into one announcement. */
export function mergePetOutcomes(a: PetOutcome | null, b: PetOutcome | null): PetOutcome | null {
  if (!a || !b) return b ?? a;
  return { ...b, milestones: [...a.milestones, ...b.milestones], pushAllowed: a.pushAllowed || b.pushAllowed };
}

const RECENT_CARE = 12;

/** The pet with its mood and well-being, derived from recent care. */
export async function petView(tx: Tx, scope: SpaceScope, row: PetRow, at = new Date()): Promise<Pet> {
  return toPetView(row, scope, await petRepo.recentCare(tx, scope, RECENT_CARE), at);
}

/** Stage-ups and milestones earned by the current state of the pet. */
async function evaluate(tx: Tx, scope: SpaceScope, row: PetRow, source?: BondSource) {
  let current = row;
  const stage = current.stage as PetStage;
  const next = nextStage(stage, current.bond, ageDays(current));
  if (next) current = (await petRepo.update(tx, scope, { stage: next })) ?? current;

  const eligible = eligibleMilestones({
    source,
    bond: current.bond,
    ageDays: ageDays(current),
    stage: current.stage as PetStage,
  });
  const fresh = await petRepo.addMilestones(tx, scope, current.id, eligible, source ? scope.userId : null);

  for (const kind of fresh) {
    if (kind === "stage_young" || kind === "stage_grown")
      await petRepo.recordEvent(tx, scope, "pet_evolved", current.id, newId());
  }
  let pushAllowed = false;
  if (fresh.length) {
    const last = current.lastUpdatePushAt?.getTime() ?? 0;
    if (Date.now() - last > 20 * HOUR_MS) {
      pushAllowed = true;
      current = (await petRepo.update(tx, scope, { lastUpdatePushAt: new Date() })) ?? current;
    }
  }
  return { row: current, milestones: fresh, pushAllowed };
}

async function outcome(tx: Tx, scope: SpaceScope, e: Awaited<ReturnType<typeof evaluate>>): Promise<PetOutcome> {
  return {
    pet: await petView(tx, scope, e.row),
    name: petName(e.row),
    milestones: e.milestones,
    pushAllowed: e.pushAllowed,
  };
}

/**
 * Shared activity grows the pet: bond (within daily caps), "excited", stage-ups and
 * milestones. Called by other modules inside their transaction.
 */
export async function growPet(
  tx: Tx,
  scope: SpaceScope,
  source: BondSource,
  subjectId?: string,
): Promise<PetOutcome | null> {
  const current = await petRepo.get(tx, scope, { lock: true });
  if (current?.status !== "ACTIVE") {
    await activityRepo.record(tx, scope, source, subjectId, 0);
    return null;
  }
  const already = await activityRepo.countBondedSince(tx, scope, source, new Date(Date.now() - DAY_MS));
  const repeatedFuture =
    source === "future.completed" && subjectId && (await petRepo.futureAlreadyRewarded(tx, scope, subjectId));
  const reciprocity =
    already === 0 && (await petRepo.partnerContributed(tx, scope, source, new Date(Date.now() - DAY_MS)));
  const delta = repeatedFuture ? 0 : bondFor(source, already) + (reciprocity ? 1 : 0);
  await activityRepo.record(tx, scope, source, subjectId, delta);
  const row = await petRepo.addBond(tx, scope, delta, new Date());
  if (!row) return null; // still an egg
  return outcome(tx, scope, await evaluate(tx, scope, row, source));
}

/** The second member joined: the egg hatches (CONTEXT "Hatching"). */
export async function hatchPet(tx: Tx, scope: SpaceScope): Promise<PetOutcome | null> {
  const row = await petRepo.hatch(tx, scope, new Date());
  if (!row) return null;
  const fresh = await petRepo.addMilestones(tx, scope, row.id, ["hatched"], scope.userId);
  return { pet: await petView(tx, scope, row), name: petName(row), milestones: fresh, pushAllowed: false };
}

/**
 * After commit: tell everyone in the space. The pet update goes live to both; milestone
 * notices go to each member (live in the app, or as a push at most once a day).
 */
export async function announcePet(scope: SpaceScope, o: PetOutcome | null) {
  if (o?.pet?.status !== "ACTIVE") return;
  const current = await withTx((tx) => petRepo.get(tx, scope));
  if (current?.status !== "ACTIVE" || current.version !== o.pet.version) return;
  publish(scope.spaceId, { t: "pet.updated", pet: o.pet, interaction: o.interaction });
  const latest = o.milestones.at(-1);
  if (!latest) return;
  const members = [scope.userId, scope.partnerId].filter((m): m is string => !!m);
  await Promise.all(
    members.map((to) =>
      notify({
        spaceId: scope.spaceId,
        to,
        notice: { type: "pet.milestone", kind: latest },
        petName: o.name,
        allowPush: o.pushAllowed,
      }),
    ),
  );
}

export async function getPet(scope: SpaceScope): Promise<Pet> {
  return withTx(async (tx) => {
    const row = await petRepo.get(tx, scope);
    if (!row) throw notFound();
    return petView(tx, scope, row);
  });
}

/** Feed, pet or play. Idempotent on the client id (ADR 0008). */
export async function care(scope: SpaceScope, input: PetInteractionInput): Promise<Pet> {
  assertWritable(scope);
  const { pet, result } = await withTx(async (tx) => {
    const row = await petRepo.get(tx, scope, { lock: true });
    if (!row) throw notFound();
    const previous = await petRepo.careById(tx, input.id);
    if (previous) {
      if (previous.spaceId !== scope.spaceId || previous.userId !== scope.userId || previous.kind !== input.kind)
        throw conflict("PET_ACTION_ID_CONFLICT");
      return { pet: await petView(tx, scope, row), result: null };
    }
    if (row.status !== "ACTIVE") throw conflict("PET_INACTIVE");
    if (row.stage === "egg") throw conflict("PET_NOT_HATCHED");
    const now = new Date();
    const latest = await petRepo.latestCare(tx, scope, input.kind);
    if (latest && now.getTime() - latest.createdAt.getTime() < 30_000) throw conflict("PET_CARE_COOLDOWN");
    const already = await petRepo.countCareSince(tx, scope, input.kind, new Date(now.getTime() - DAY_MS));
    const updated = await petRepo.insertCare(
      tx,
      scope,
      row,
      input.id,
      input.kind,
      bondFor(`pet.${input.kind}`, already),
      now,
    );
    if (!updated) throw conflict("PET_ACTION_ID_CONFLICT");
    const o = await outcome(tx, scope, await evaluate(tx, scope, updated));
    o.interaction = { userId: scope.userId, kind: input.kind };
    const names = { feed: "pet_fed", play: "pet_played", pet: "pet_petted" } as const;
    await petRepo.recordEvent(tx, scope, names[input.kind], row.id, input.id);
    return { pet: o.pet, result: o };
  });
  await announcePet(scope, result);
  if (!pet) throw notFound();
  return pet;
}

/** Naming together: one proposes, the other accepts. */
export async function nameStep(scope: SpaceScope, input: PetNameInput): Promise<Pet> {
  assertWritable(scope);
  const result = await withTx(async (tx) => {
    const row = await petRepo.get(tx, scope, { lock: true });
    if (!row) throw notFound();
    if (row.status !== "ACTIVE") throw conflict("PET_INACTIVE");
    if (row.stage === "egg") throw conflict("PET_NOT_HATCHED");
    if (input.action === "propose") {
      const updated = await petRepo.update(tx, scope, { proposedName: input.name, proposedBy: scope.userId });
      if (!updated) throw notFound();
      return outcome(tx, scope, { row: updated, milestones: [], pushAllowed: false });
    }
    if (!row.proposedName) throw conflict("PET_NAME_NOT_PROPOSED");
    if (input.name !== row.proposedName) throw conflict("PET_NAME_CHANGED");
    if (row.proposedBy === scope.userId)
      throw new AppError("PET_NAME_OWN_PROPOSAL", 409, "Your partner needs to agree on the name.");
    const updated = await petRepo.update(tx, scope, { name: row.proposedName, proposedName: null, proposedBy: null });
    if (!updated) throw notFound();
    const fresh = await petRepo.addMilestones(tx, scope, updated.id, ["named"], scope.userId);
    return outcome(tx, scope, { row: updated, milestones: fresh, pushAllowed: false });
  });
  await announcePet(scope, result);
  if (!result.pet) throw notFound();
  return result.pet;
}

/** The pet's story: milestones plus recent care (CONTEXT "Pet timeline"). */
export async function timeline(scope: SpaceScope): Promise<PetTimeline> {
  return withTx(async (tx) => {
    const [milestones, care] = await Promise.all([petRepo.milestones(tx, scope), petRepo.recentCare(tx, scope, 40)]);
    const ms = milestones.map((m) => ({
      kind: m.kind as PetMilestoneKind,
      earnedAt: m.earnedAt.toISOString(),
      byUserId: m.byUserId,
    }));
    const items = [
      ...ms.map((m) => ({ type: "milestone" as const, kind: m.kind, at: m.earnedAt, byUserId: m.byUserId })),
      ...care.map((c) => ({ type: "care" as const, kind: c.kind, at: c.at.toISOString(), byUserId: c.byUserId })),
    ].sort((a, b) => b.at.localeCompare(a.at));
    return { milestones: ms, items: items.slice(0, 50) };
  });
}

/** A shared decision: a proposal never changes the currently active pet. */
export async function decidePet(
  scope: SpaceScope,
  input: import("zod").infer<typeof import("@lovenotes/contracts").PetDecisionInput>,
): Promise<Pet> {
  assertWritable(scope);
  const pet = await withTx(async (tx) => {
    let row = await petRepo.get(tx, scope, { lock: true });
    if (!row) throw notFound();
    const now = new Date();
    const previousStatus = row.status;
    if (input.action === "propose") {
      row = await petRepo.update(tx, scope, {
        decisionId: newId(),
        proposedEnabled: input.enabled,
        decisionBy: scope.userId,
        status: row.status === "NONE" ? "PENDING" : row.status,
      });
    } else {
      if (row.proposedEnabled === null) throw conflict("PET_DECISION_MISSING");
      if (input.decisionId !== row.decisionId) throw conflict("PET_DECISION_CHANGED");
      if (input.action === "accept" && (!scope.partnerId || row.decisionBy !== scope.partnerId))
        throw conflict("PARTNER_AGREEMENT_REQUIRED");
      const patch: Partial<typeof row> = { decisionId: null, proposedEnabled: null, decisionBy: null };
      if (input.action === "decline") patch.status = row.status === "PENDING" ? "NONE" : row.status;
      else if (!row.proposedEnabled) {
        patch.status = row.stage === "egg" ? "NONE" : "PAUSED";
        if (!row.pausedAt) patch.pausedAt = row.stage === "egg" ? null : now;
      } else {
        patch.status = "ACTIVE";
        patch.pausedAt = null;
        if (row.pausedAt) {
          const elapsed = Math.max(0, now.getTime() - row.pausedAt.getTime());
          for (const key of ["lastFedAt", "lastPlayedAt", "lastPettedAt", "lastSharedActivityAt", "hatchedAt"] as const)
            if (row[key]) patch[key] = new Date(row[key].getTime() + elapsed);
        }
      }
      row = await petRepo.update(tx, scope, patch);
    }
    if (!row) throw notFound();
    if (row.status === "ACTIVE" && row.stage === "egg") {
      row = (await petRepo.hatch(tx, scope, now)) ?? row;
      await petRepo.addMilestones(tx, scope, row.id, ["hatched"], scope.userId);
    }
    if (input.action === "accept" && row.status !== previousStatus) {
      await petRepo.recordEvent(
        tx,
        scope,
        row.status === "ACTIVE" ? "pet_enabled" : "pet_disabled",
        row.id,
        input.decisionId,
      );
    }
    // Derive the decision response at the same instant used to shift paused care timestamps.
    return petView(tx, scope, row, now);
  });
  publish(scope.spaceId, { t: "space.updated" });
  return pet;
}
