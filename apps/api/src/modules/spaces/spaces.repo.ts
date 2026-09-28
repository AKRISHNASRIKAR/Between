import type { CreateSpaceInput, UpdateSpaceInput } from "@lovenotes/contracts";
import { and, count, eq, isNull, lt } from "drizzle-orm";
import type { Tx } from "../../db/client";
import { spaceInvites, spaceMembers, spaces, users } from "../../db/schema";
import { newId } from "../../lib/ids";
import type { SpaceScope } from "../../lib/scope";

/** Spaces, memberships and invites. Reads for names/access live in the members module. */
export const spacesRepo = {
  async create(tx: Tx, ownerId: string, input: CreateSpaceInput): Promise<string> {
    const spaceId = newId();
    await tx.insert(spaces).values({
      id: spaceId,
      name: input.name,
      togetherSince: input.togetherSince ?? null,
      timezone: input.timezone,
      createdBy: ownerId,
    });
    await tx.insert(spaceMembers).values({ spaceId, userId: ownerId, role: "owner" });
    return spaceId;
  },

  async get(tx: Tx, scope: SpaceScope) {
    const [row] = await tx.select().from(spaces).where(eq(spaces.id, scope.spaceId));
    return row ?? null;
  },

  async update(tx: Tx, scope: SpaceScope, input: UpdateSpaceInput) {
    await tx
      .update(spaces)
      .set({
        ...(input.name !== undefined && { name: input.name }),
        ...(input.togetherSince !== undefined && { togetherSince: input.togetherSince }),
        ...(input.timezone !== undefined && { timezone: input.timezone }),
      })
      .where(eq(spaces.id, scope.spaceId));
  },

  /** Lock the space row so concurrent joins are serialized. */
  async lockForJoin(tx: Tx, spaceId: string) {
    const [row] = await tx.select().from(spaces).where(eq(spaces.id, spaceId)).for("update");
    return row ?? null;
  },

  async activeMemberCount(tx: Tx, spaceId: string) {
    const [c] = await tx
      .select({ n: count() })
      .from(spaceMembers)
      .where(and(eq(spaceMembers.spaceId, spaceId), isNull(spaceMembers.leftAt)));
    return c?.n ?? 0;
  },

  async addMember(tx: Tx, spaceId: string, userId: string) {
    await tx.insert(spaceMembers).values({ spaceId, userId, role: "member" });
  },

  /** Close for both (ADR/CONTEXT "Closed space"): read-only, purged after `purgeAfter`. */
  async close(tx: Tx, scope: SpaceScope, now: Date, purgeAfter: Date) {
    await tx.update(spaces).set({ status: "closed", closedAt: now, purgeAfter }).where(eq(spaces.id, scope.spaceId));
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
  },

  // ── Housekeeping (system-wide, not scoped) ──

  /** Closed spaces whose read-only window has passed. */
  async expired(tx: Tx, now: Date) {
    return tx
      .select({ id: spaces.id })
      .from(spaces)
      .where(and(eq(spaces.status, "closed"), lt(spaces.purgeAfter, now)));
  },
  /** Permanently delete a space; every space-owned row cascades. */
  async purge(tx: Tx, spaceId: string) {
    await tx.delete(spaces).where(eq(spaces.id, spaceId));
  },

  invites: {
    async revokeOpen(tx: Tx, scope: SpaceScope, now: Date) {
      await tx
        .update(spaceInvites)
        .set({ revokedAt: now })
        .where(
          and(eq(spaceInvites.spaceId, scope.spaceId), isNull(spaceInvites.acceptedAt), isNull(spaceInvites.revokedAt)),
        );
    },
    async create(tx: Tx, scope: SpaceScope, codeHash: Buffer, expiresAt: Date) {
      await tx
        .insert(spaceInvites)
        .values({ id: newId(), spaceId: scope.spaceId, codeHash, createdBy: scope.userId, expiresAt });
    },
    async findByHash(tx: Tx, codeHash: Buffer, opts: { lock?: boolean } = {}) {
      const q = tx.select().from(spaceInvites).where(eq(spaceInvites.codeHash, codeHash));
      const [row] = opts.lock ? await q.for("update") : await q;
      return row ?? null;
    },
    async accept(tx: Tx, inviteId: string, userId: string, now: Date) {
      await tx.update(spaceInvites).set({ acceptedBy: userId, acceptedAt: now }).where(eq(spaceInvites.id, inviteId));
    },
    /** Name/avatar of whoever sent an invite, and the space name — for the join preview. */
    async preview(tx: Tx, spaceId: string, inviterId: string) {
      const [row] = await tx
        .select({ spaceName: spaces.name, status: spaces.status, name: users.name, image: users.image })
        .from(spaces)
        .innerJoin(users, eq(users.id, inviterId))
        .where(eq(spaces.id, spaceId));
      return row ?? null;
    },
  },
};
