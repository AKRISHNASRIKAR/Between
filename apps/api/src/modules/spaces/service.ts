import {
  type CreateSpaceInput,
  formatInviteCode,
  type Invite,
  type InvitePreview,
  LIMITS,
  type Space,
  type UpdateSpaceInput,
} from "@lovenotes/contracts";
import { and, count, eq, isNull } from "drizzle-orm";
import type { Tx } from "../../db/client";
import { pets, spaceInvites, spaceMembers, spaces, users } from "../../db/schema";
import { env } from "../../env";
import { AppError, conflict, forbidden } from "../../lib/errors";
import { newId } from "../../lib/ids";
import type { SpaceScope } from "../../lib/scope";
import { DAY_MS } from "../../lib/time";
import { withTx } from "../../lib/tx";
import type { AuthedUser } from "../../types";
import { activity } from "../activity/service";
import { loadSpaceDto } from "./dto";
import { generateInviteCode, hashInviteCode } from "./invite-code";

export async function activeSpaceIdFor(tx: Tx, userId: string): Promise<string | null> {
  const [row] = await tx
    .select({ spaceId: spaceMembers.spaceId })
    .from(spaceMembers)
    .where(and(eq(spaceMembers.userId, userId), isNull(spaceMembers.leftAt)));
  return row?.spaceId ?? null;
}

export async function createSpace(user: AuthedUser, input: CreateSpaceInput): Promise<Space> {
  return withTx(async (tx) => {
    if (await activeSpaceIdFor(tx, user.id)) throw conflict("ALREADY_IN_SPACE");
    const spaceId = newId();
    await tx.insert(spaces).values({
      id: spaceId,
      name: input.name,
      togetherSince: input.togetherSince ?? null,
      timezone: input.timezone,
      createdBy: user.id,
    });
    await tx.insert(spaceMembers).values({ spaceId, userId: user.id, role: "owner" });
    await tx.insert(pets).values({ id: newId(), spaceId });
    return loadSpaceDto(tx, spaceId, user.timezone);
  });
}

export async function getSpace(scope: SpaceScope, tx?: Tx): Promise<Space> {
  if (tx) return loadSpaceDto(tx, scope.spaceId, scope.timezone);
  return withTx((t) => loadSpaceDto(t, scope.spaceId, scope.timezone));
}

export function assertWritable(scope: SpaceScope) {
  if (!scope.writable) throw forbidden("SPACE_CLOSED", "This space is closed.");
}

export async function updateSpace(scope: SpaceScope, input: UpdateSpaceInput): Promise<Space> {
  assertWritable(scope);
  return withTx(async (tx, after) => {
    await tx
      .update(spaces)
      .set({
        ...(input.name !== undefined && { name: input.name }),
        ...(input.togetherSince !== undefined && { togetherSince: input.togetherSince }),
        ...(input.timezone !== undefined && { timezone: input.timezone }),
      })
      .where(eq(spaces.id, scope.spaceId));
    after(() => activity.broadcast(scope.spaceId, { t: "space.updated" }));
    return loadSpaceDto(tx, scope.spaceId, scope.timezone);
  });
}

/** Creates a fresh invite, revoking any previous open one. */
export async function createInvite(scope: SpaceScope): Promise<Invite> {
  assertWritable(scope);
  if (scope.partnerId) throw conflict("SPACE_FULL");
  return withTx(async (tx) => {
    const now = new Date();
    await tx
      .update(spaceInvites)
      .set({ revokedAt: now })
      .where(
        and(eq(spaceInvites.spaceId, scope.spaceId), isNull(spaceInvites.acceptedAt), isNull(spaceInvites.revokedAt)),
      );
    const code = generateInviteCode();
    const expiresAt = new Date(now.getTime() + LIMITS.inviteTtlDays * DAY_MS);
    await tx.insert(spaceInvites).values({
      id: newId(),
      spaceId: scope.spaceId,
      codeHash: hashInviteCode(code),
      createdBy: scope.userId,
      expiresAt,
    });
    return {
      code: formatInviteCode(code),
      url: `${env.APP_SCHEME}://invite/${code}`,
      expiresAt: expiresAt.toISOString(),
    };
  });
}

export async function revokeInvites(scope: SpaceScope): Promise<void> {
  assertWritable(scope);
  await withTx((tx) =>
    tx
      .update(spaceInvites)
      .set({ revokedAt: new Date() })
      .where(
        and(eq(spaceInvites.spaceId, scope.spaceId), isNull(spaceInvites.acceptedAt), isNull(spaceInvites.revokedAt)),
      ),
  );
}

async function findUsableInvite(tx: Tx, code: string, lock: boolean) {
  const q = tx
    .select()
    .from(spaceInvites)
    .where(eq(spaceInvites.codeHash, hashInviteCode(code)));
  const [invite] = lock ? await q.for("update") : await q;
  if (!invite || invite.acceptedAt || invite.revokedAt) throw new AppError("INVITE_INVALID", 404);
  if (invite.expiresAt.getTime() < Date.now()) throw new AppError("INVITE_EXPIRED", 410);
  return invite;
}

export async function previewInvite(user: AuthedUser, code: string): Promise<InvitePreview> {
  return withTx(async (tx) => {
    const invite = await findUsableInvite(tx, code, false);
    if ((await activeSpaceIdFor(tx, user.id)) === invite.spaceId) throw conflict("INVITE_OWN_SPACE");
    const [row] = await tx
      .select({ spaceName: spaces.name, status: spaces.status, name: users.name, image: users.image })
      .from(spaces)
      .innerJoin(users, eq(users.id, invite.createdBy))
      .where(eq(spaces.id, invite.spaceId));
    if (row?.status !== "active") throw new AppError("INVITE_INVALID", 404);
    return { spaceName: row.spaceName, inviter: { displayName: row.name, avatarUrl: row.image } };
  });
}

/** Joins the space and hatches the egg — the pairing moment. */
export async function acceptInvite(user: AuthedUser, code: string): Promise<Space> {
  return withTx(async (tx, after) => {
    const invite = await findUsableInvite(tx, code, true);
    const current = await activeSpaceIdFor(tx, user.id);
    if (current === invite.spaceId) throw conflict("INVITE_OWN_SPACE");
    if (current) throw conflict("ALREADY_IN_SPACE");

    // Serialize joins on this space, then enforce the member limit.
    const [space] = await tx.select().from(spaces).where(eq(spaces.id, invite.spaceId)).for("update");
    if (space?.status !== "active") throw new AppError("INVITE_INVALID", 404);
    const [c] = await tx
      .select({ n: count() })
      .from(spaceMembers)
      .where(and(eq(spaceMembers.spaceId, space.id), isNull(spaceMembers.leftAt)));
    if ((c?.n ?? 0) >= LIMITS.membersPerSpace) throw conflict("SPACE_FULL");

    const now = new Date();
    await tx.insert(spaceMembers).values({ spaceId: space.id, userId: user.id, role: "member" });
    await tx.update(spaceInvites).set({ acceptedBy: user.id, acceptedAt: now }).where(eq(spaceInvites.id, invite.id));
    await tx
      .update(pets)
      .set({ stage: "baby", hatchedAt: now, lastSharedActivityAt: now })
      .where(and(eq(pets.spaceId, space.id), eq(pets.stage, "egg")));
    await activity.record(tx, { spaceId: space.id, actorId: user.id, kind: "space.member_joined" });

    const dto = await loadSpaceDto(tx, space.id, user.timezone);
    after(() => {
      activity.broadcast(space.id, { t: "space.member_joined", userId: user.id });
      activity.broadcast(space.id, { t: "pet.updated", pet: dto.pet });
    });
    return dto;
  });
}

/** Leaving closes the space for both members: 30 days read-only + export, then purge (SPEC D6). */
export async function leaveSpace(scope: SpaceScope): Promise<void> {
  assertWritable(scope);
  await withTx(async (tx, after) => {
    const now = new Date();
    await tx
      .update(spaces)
      .set({
        status: "closed",
        closedAt: now,
        purgeAfter: new Date(now.getTime() + LIMITS.closedSpaceRetentionDays * DAY_MS),
      })
      .where(eq(spaces.id, scope.spaceId));
    await tx
      .update(spaceMembers)
      .set({ leftAt: now })
      .where(and(eq(spaceMembers.spaceId, scope.spaceId), isNull(spaceMembers.leftAt)));
    await tx
      .update(spaceInvites)
      .set({ revokedAt: now })
      .where(
        and(eq(spaceInvites.spaceId, scope.spaceId), isNull(spaceInvites.acceptedAt), isNull(spaceInvites.revokedAt)),
      );
    after(() => activity.broadcast(scope.spaceId, { t: "space.closed" }));
  });
}
