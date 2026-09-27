import type { Pet, ServerEvent } from "@lovenotes/contracts";
import { and, count, eq, gt, sql } from "drizzle-orm";
import type { Tx } from "../../db/client";
import { activityEvents, pets } from "../../db/schema";
import { newId } from "../../lib/ids";
import type { SpaceScope } from "../../lib/scope";
import { DAY_MS } from "../../lib/time";
import { realtime } from "../../realtime/hub";
import { type BondSource, bondFor } from "../pet/bond";
import { toPetDto } from "../spaces/dto";

type RecordInput = {
  spaceId: string;
  actorId: string;
  kind: string;
  subjectId?: string;
  bondDelta?: number;
};

/**
 * The one place shared activity flows through. Feature services call `record`/`award` inside
 * their transaction and `broadcast` after commit.
 */
export const activity = {
  async record(tx: Tx, input: RecordInput) {
    await tx.insert(activityEvents).values({
      id: newId(),
      spaceId: input.spaceId,
      actorId: input.actorId,
      kind: input.kind,
      subjectId: input.subjectId ?? null,
      bondDelta: input.bondDelta ?? 0,
    });
  },

  /**
   * Record a shared activity and grow the pet's bond (respecting per-user daily caps).
   * Marks the pet as having just seen shared activity (→ "excited"). Returns the updated pet
   * so the caller can broadcast it after commit.
   */
  async award(tx: Tx, scope: SpaceScope, source: BondSource, subjectId?: string): Promise<Pet | null> {
    const [c] = await tx
      .select({ n: count() })
      .from(activityEvents)
      .where(
        and(
          eq(activityEvents.spaceId, scope.spaceId),
          eq(activityEvents.actorId, scope.userId),
          eq(activityEvents.kind, source),
          gt(activityEvents.bondDelta, 0),
          gt(activityEvents.createdAt, new Date(Date.now() - DAY_MS)),
        ),
      );
    const bondDelta = bondFor(source, c?.n ?? 0);
    await activity.record(tx, { spaceId: scope.spaceId, actorId: scope.userId, kind: source, subjectId, bondDelta });
    const [pet] = await tx
      .update(pets)
      .set({
        bond: sql`${pets.bond} + ${bondDelta}`,
        lastSharedActivityAt: new Date(),
        version: sql`${pets.version} + 1`,
      })
      .where(and(eq(pets.spaceId, scope.spaceId), sql`${pets.stage} <> 'egg'`))
      .returning();
    return pet ? toPetDto(pet, scope.timezone) : null;
  },

  broadcast(spaceId: string, event: ServerEvent) {
    realtime.publish(spaceId, event);
  },
};
