import { and, count, eq, gt } from "drizzle-orm";
import type { Tx } from "../../db/client";
import { activityEvents } from "../../db/schema";
import { newId } from "../../lib/ids";
import type { SpaceScope } from "../../lib/scope";

/**
 * The shared-activity log: what happened in a space and who did it. It is the source for
 * daily bond caps and, later, recaps. Private vibes are never recorded here (ADR 0004).
 */
export const activityRepo = {
  async record(tx: Tx, scope: SpaceScope, kind: string, subjectId: string | undefined, bondDelta: number) {
    await tx.insert(activityEvents).values({
      id: newId(),
      spaceId: scope.spaceId,
      actorId: scope.userId,
      kind,
      subjectId: subjectId ?? null,
      bondDelta,
    });
  },

  /** How many times the caller already earned bond from `kind` since `since`. */
  async countBondedSince(tx: Tx, scope: SpaceScope, kind: string, since: Date): Promise<number> {
    const [c] = await tx
      .select({ n: count() })
      .from(activityEvents)
      .where(
        and(
          eq(activityEvents.spaceId, scope.spaceId),
          eq(activityEvents.actorId, scope.userId),
          eq(activityEvents.kind, kind),
          gt(activityEvents.bondDelta, 0),
          gt(activityEvents.createdAt, since),
        ),
      );
    return c?.n ?? 0;
  },
};
