import { MOODS, observation, type UpsertMoodInput, type Vibe, type VibeMonth } from "@lovenotes/contracts";
import type { Tx } from "../../db/client";
import { AppError } from "../../lib/errors";
import { assertWritable, type SpaceScope } from "../../lib/scope";
import { DAY_MS, localDate } from "../../lib/time";
import { withTx } from "../../lib/tx";
import { publish } from "../../realtime/hub";
import { displayName, membersRepo } from "../members";
import { notifyPartner } from "../notifications";
import { announcePet, growPet, petNameFor } from "../pet";
import { toCheckin, vibesRepo } from "./vibes.repo";

/** Vibes are for "today" only: the client's local date must be within a day of server time. */
export function assertAllowedDate(date: string, now = new Date()) {
  const t = Date.parse(`${date}T12:00:00Z`);
  if (Number.isNaN(t) || Math.abs(t - now.getTime()) > 1.6 * DAY_MS) {
    throw new AppError("VALIDATION_FAILED", 422, "You can only check in for today.", { date: "Only today" });
  }
}

async function loadVibe(tx: Tx, scope: SpaceScope, date: string): Promise<Vibe> {
  const members = await membersRepo.of(tx, scope);
  const partnerTz = members.find((m) => m.id === scope.partnerId)?.timezone ?? "UTC";
  const [mine, partner] = await Promise.all([
    vibesRepo.mine(tx, scope, date),
    vibesRepo.partnerShared(tx, scope, localDate(new Date(), partnerTz)),
  ]);
  const me = mine ? toCheckin(mine) : null;
  const theirs = partner ? toCheckin(partner) : null;
  const both = me?.visibility === "shared" && theirs ? observation(me.mood, theirs.mood) : null;
  return { date, me, partner: theirs, observation: both };
}

export async function getVibe(scope: SpaceScope, date: string): Promise<Vibe> {
  assertAllowedDate(date);
  return withTx((tx) => loadVibe(tx, scope, date));
}

/** One vibe per member per local day; can be changed, shared or unshared that day. */
export async function upsertVibe(scope: SpaceScope, date: string, input: UpsertMoodInput): Promise<Vibe> {
  assertWritable(scope);
  assertAllowedDate(date);
  if (!MOODS[input.mood]) throw new AppError("VALIDATION_FAILED", 422, "Unknown mood");

  const result = await withTx(async (tx) => {
    const existing = await vibesRepo.mine(tx, scope, date, { lock: true });
    const wasShared = existing?.visibility === "shared";
    const isShared = input.visibility === "shared";
    const row = await vibesRepo.save(tx, scope, existing, {
      id: input.id,
      date,
      mood: input.mood,
      note: input.note?.trim() || null,
      visibility: input.visibility,
      sharedAt: isShared ? (existing?.sharedAt ?? new Date()) : null,
    });
    if (!row) throw new AppError("INTERNAL", 500);
    // Sharing is shared activity (the pet notices). A private vibe leaves no trace anywhere.
    const pet = isShared && !wasShared ? await growPet(tx, scope, "mood.shared", row.id) : null;
    const me = displayName(await membersRepo.of(tx, scope), scope.userId);
    return {
      vibe: await loadVibe(tx, scope, date),
      row,
      isShared,
      wasShared,
      pet,
      me,
      petName: await petNameFor(tx, scope),
    };
  });

  if (result.isShared) publish(scope.spaceId, { t: "mood.shared", checkin: toCheckin(result.row) });
  else if (result.wasShared) publish(scope.spaceId, { t: "mood.unshared", userId: scope.userId, localDate: date });
  await announcePet(scope, result.pet);
  if (result.isShared && !result.wasShared)
    await notifyPartner(scope, { type: "vibe.shared", from: result.me }, result.petName);
  return result.vibe;
}

/** A month of vibes as a visual memory: all of mine, only the partner's shared ones. */
export async function vibeMonth(scope: SpaceScope, month: string): Promise<VibeMonth> {
  const [y, m] = month.split("-").map(Number);
  const next = new Date(Date.UTC(y ?? 2000, m ?? 1, 1)).toISOString().slice(0, 10);
  const rows = await withTx((tx) => vibesRepo.visibleBetween(tx, scope, `${month}-01`, next));
  return {
    month,
    mine: rows.filter((r) => r.userId === scope.userId).map(toCheckin),
    partner: rows.filter((r) => r.userId !== scope.userId).map(toCheckin),
  };
}

/** Every vibe the caller may see, for export. */
export async function exportVibes(scope: SpaceScope) {
  const rows = await withTx((tx) => vibesRepo.visibleBetween(tx, scope, "1970-01-01", "9999-12-31"));
  return rows.map(toCheckin);
}
