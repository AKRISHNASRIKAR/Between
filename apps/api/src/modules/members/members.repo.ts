import { and, asc, eq, gt, isNull, ne, or } from "drizzle-orm";
import type { Tx } from "../../db/client";
import { spaceMembers, spaces, users } from "../../db/schema";
import { makeSpaceScope, type SpaceScope } from "../../lib/scope";

export type MemberRow = {
  id: string;
  name: string;
  image: string | null;
  timezone: string;
  role: "owner" | "member";
  joinedAt: Date;
  leftAt: Date | null;
};

/**
 * Read-only member directory: who is in a space and what they're called. Shared by every
 * module that needs names; the spaces module owns joining and leaving.
 */
export const membersRepo = {
  async of(tx: Tx, scope: SpaceScope): Promise<MemberRow[]> {
    return tx
      .select({
        id: users.id,
        name: users.name,
        image: users.image,
        timezone: users.timezone,
        role: spaceMembers.role,
        joinedAt: spaceMembers.joinedAt,
        leftAt: spaceMembers.leftAt,
      })
      .from(spaceMembers)
      .innerJoin(users, eq(users.id, spaceMembers.userId))
      .where(eq(spaceMembers.spaceId, scope.spaceId))
      .orderBy(asc(spaceMembers.joinedAt));
  },

  /**
   * Membership gate (ADR 0002): the caller's access to a space, or null if they're not a
   * member. Members of a closed space keep read-only access until it's purged.
   */
  async access(tx: Tx, spaceId: string, userId: string) {
    const [row] = await tx
      .select({ status: spaces.status, leftAt: spaceMembers.leftAt })
      .from(spaceMembers)
      .innerJoin(spaces, eq(spaces.id, spaceMembers.spaceId))
      .where(
        and(
          eq(spaceMembers.spaceId, spaceId),
          eq(spaceMembers.userId, userId),
          or(isNull(spaceMembers.leftAt), and(eq(spaces.status, "closed"), gt(spaces.purgeAfter, new Date()))),
        ),
      )
      .limit(1);
    if (!row) return null;
    const [partner] = await tx
      .select({ userId: spaceMembers.userId })
      .from(spaceMembers)
      .where(and(eq(spaceMembers.spaceId, spaceId), ne(spaceMembers.userId, userId)))
      .limit(1);
    return { writable: row.status === "active" && row.leftAt === null, partnerId: partner?.userId ?? null };
  },

  /** The space a user is actively in, if any (for building their scope outside a space route). */
  async activeSpaceId(tx: Tx, userId: string): Promise<string | null> {
    const [row] = await tx
      .select({ spaceId: spaceMembers.spaceId })
      .from(spaceMembers)
      .where(and(eq(spaceMembers.userId, userId), isNull(spaceMembers.leftAt)));
    return row?.spaceId ?? null;
  },
};

/** "you" for the viewer, the member's name for everyone else. */
export function nameResolver(members: MemberRow[], viewerId: string) {
  return (userId: string) =>
    userId === viewerId ? "you" : members.find((m) => m.id === userId)?.name || "your person";
}

export const displayName = (members: MemberRow[], userId: string) =>
  members.find((m) => m.id === userId)?.name || "Your person";

/**
 * A trusted scope for a user's active space, for code paths outside a /spaces/:sid route
 * (e.g. /me, the realtime socket, dev tools). Null if they aren't in a space.
 */
export async function activeScope(tx: Tx, user: { id: string; timezone: string }): Promise<SpaceScope | null> {
  const spaceId = await membersRepo.activeSpaceId(tx, user.id);
  if (!spaceId) return null;
  const access = await membersRepo.access(tx, spaceId, user.id);
  if (!access) return null;
  return makeSpaceScope({ spaceId, userId: user.id, timezone: user.timezone, ...access });
}
