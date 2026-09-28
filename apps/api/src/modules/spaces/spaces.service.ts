import {
  type CreateSpaceInput,
  formatInviteCode,
  type Invite,
  type InvitePreview,
  LIMITS,
  type Space,
  type UpdateSpaceInput,
} from "@lovenotes/contracts";
import { db, type Tx } from "../../db/client";
import { env } from "../../env";
import { AppError, conflict } from "../../lib/errors";
import { assertWritable, makeSpaceScope, type SpaceScope } from "../../lib/scope";
import { storage } from "../../lib/storage";
import { DAY_MS } from "../../lib/time";
import { withTx } from "../../lib/tx";
import { publish } from "../../realtime/hub";
import type { AuthedUser } from "../../types";
import { activityRepo } from "../activity";
import { membersRepo } from "../members";
import { announcePet, hatchPet, petRepo } from "../pet";
import { generateInviteCode, hashInviteCode } from "./invite-code";
import { spacesRepo } from "./spaces.repo";
import { spaceView } from "./spaces.view";

const ownerScope = (spaceId: string, user: AuthedUser) =>
  makeSpaceScope({ spaceId, userId: user.id, partnerId: null, writable: true, timezone: user.timezone });

export async function createSpace(user: AuthedUser, input: CreateSpaceInput): Promise<Space> {
  return withTx(async (tx) => {
    if (await membersRepo.activeSpaceId(tx, user.id)) throw conflict("ALREADY_IN_SPACE");
    const spaceId = await spacesRepo.create(tx, user.id, input);
    await petRepo.createForSpace(tx, spaceId);
    return spaceView(tx, ownerScope(spaceId, user));
  });
}

export async function getSpace(scope: SpaceScope): Promise<Space> {
  return withTx((tx) => spaceView(tx, scope));
}

export async function updateSpace(scope: SpaceScope, input: UpdateSpaceInput): Promise<Space> {
  assertWritable(scope);
  const space = await withTx(async (tx) => {
    await spacesRepo.update(tx, scope, input);
    return spaceView(tx, scope);
  });
  publish(scope.spaceId, { t: "space.updated" });
  return space;
}

/** A fresh single-use code; any previous open invite stops working. Only the hash is stored. */
export async function createInvite(scope: SpaceScope): Promise<Invite> {
  assertWritable(scope);
  if (scope.partnerId) throw conflict("SPACE_FULL");
  return withTx(async (tx) => {
    const now = new Date();
    await spacesRepo.invites.revokeOpen(tx, scope, now);
    const code = generateInviteCode();
    const expiresAt = new Date(now.getTime() + LIMITS.inviteTtlDays * DAY_MS);
    await spacesRepo.invites.create(tx, scope, hashInviteCode(code), expiresAt);
    return {
      code: formatInviteCode(code),
      url: `${env.APP_SCHEME}://invite/${code}`,
      expiresAt: expiresAt.toISOString(),
    };
  });
}

export async function revokeInvites(scope: SpaceScope): Promise<void> {
  assertWritable(scope);
  await withTx((tx) => spacesRepo.invites.revokeOpen(tx, scope, new Date()));
}

async function usableInvite(tx: Tx, code: string, lock: boolean) {
  const invite = await spacesRepo.invites.findByHash(tx, hashInviteCode(code), { lock });
  if (!invite || invite.acceptedAt || invite.revokedAt) throw new AppError("INVITE_INVALID", 404);
  if (invite.expiresAt.getTime() < Date.now()) throw new AppError("INVITE_EXPIRED", 410);
  return invite;
}

export async function previewInvite(user: AuthedUser, code: string): Promise<InvitePreview> {
  return withTx(async (tx) => {
    const invite = await usableInvite(tx, code, false);
    if ((await membersRepo.activeSpaceId(tx, user.id)) === invite.spaceId) throw conflict("INVITE_OWN_SPACE");
    const row = await spacesRepo.invites.preview(tx, invite.spaceId, invite.createdBy);
    if (row?.status !== "active") throw new AppError("INVITE_INVALID", 404);
    return { spaceName: row.spaceName, inviter: { displayName: row.name, avatarUrl: row.image } };
  });
}

/** Join with a code — the pairing moment: the egg hatches for both (CONTEXT "Hatching"). */
export async function acceptInvite(user: AuthedUser, code: string): Promise<Space> {
  const { space, scope, hatched } = await withTx(async (tx) => {
    const invite = await usableInvite(tx, code, true);
    const current = await membersRepo.activeSpaceId(tx, user.id);
    if (current === invite.spaceId) throw conflict("INVITE_OWN_SPACE");
    if (current) throw conflict("ALREADY_IN_SPACE");

    // Serialize joins on this space, then enforce the two-member limit (a DB trigger backs this up).
    const locked = await spacesRepo.lockForJoin(tx, invite.spaceId);
    if (locked?.status !== "active") throw new AppError("INVITE_INVALID", 404);
    if ((await spacesRepo.activeMemberCount(tx, locked.id)) >= LIMITS.membersPerSpace) throw conflict("SPACE_FULL");

    await spacesRepo.addMember(tx, locked.id, user.id);
    await spacesRepo.invites.accept(tx, invite.id, user.id, new Date());
    const scope = makeSpaceScope({
      spaceId: locked.id,
      userId: user.id,
      partnerId: invite.createdBy,
      writable: true,
      timezone: user.timezone,
    });
    await activityRepo.record(tx, scope, "space.member_joined", undefined, 0);
    const hatched = await hatchPet(tx, scope);
    return { space: await spaceView(tx, scope), scope, hatched };
  });
  publish(scope.spaceId, { t: "space.member_joined", userId: user.id });
  await announcePet(scope, hatched);
  return space;
}

/** Leaving closes the space for both: read-only for 30 days, then purged (CONTEXT "Closed space"). */
export async function leaveSpace(scope: SpaceScope): Promise<void> {
  assertWritable(scope);
  await withTx(async (tx) => {
    const now = new Date();
    await spacesRepo.close(tx, scope, now, new Date(now.getTime() + LIMITS.closedSpaceRetentionDays * DAY_MS));
  });
  publish(scope.spaceId, { t: "space.closed" });
}

/** Housekeeping: permanently remove closed spaces past their retention window, photos first. */
export async function purgeExpiredSpaces(now = new Date()) {
  const expired = await spacesRepo.expired(db, now);
  for (const s of expired) {
    await storage.deletePrefix(`spaces/${s.id}/`).catch((e) => console.error("purge storage failed", s.id, e));
    await spacesRepo.purge(db, s.id);
  }
  return expired.length;
}
