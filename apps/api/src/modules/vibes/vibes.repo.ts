import type { MoodCheckin, MoodId, MoodVisibility } from "@lovenotes/contracts";
import { and, asc, eq, gte, lt, or } from "drizzle-orm";
import type { Tx } from "../../db/client";
import { moodCheckins } from "../../db/schema";
import type { SpaceScope } from "../../lib/scope";

type Row = typeof moodCheckins.$inferSelect;

export const toCheckin = (r: Row): MoodCheckin => ({
  id: r.id,
  userId: r.userId,
  localDate: r.localDate,
  mood: r.mood as MoodId,
  note: r.note,
  visibility: r.visibility,
  sharedAt: r.sharedAt?.toISOString() ?? null,
  updatedAt: r.updatedAt.toISOString(),
});

/**
 * Vibe data access. By design there is no function here that can return a partner's
 * private vibe — every partner read filters on visibility = shared (ADR 0004).
 */
export const vibesRepo = {
  async mine(tx: Tx, scope: SpaceScope, date: string, opts: { lock?: boolean } = {}) {
    const q = tx
      .select()
      .from(moodCheckins)
      .where(
        and(
          eq(moodCheckins.spaceId, scope.spaceId),
          eq(moodCheckins.userId, scope.userId),
          eq(moodCheckins.localDate, date),
        ),
      );
    const [row] = opts.lock ? await q.for("update") : await q;
    return row ?? null;
  },

  async partnerShared(tx: Tx, scope: SpaceScope, partnerDate: string) {
    if (!scope.partnerId) return null;
    const [row] = await tx
      .select()
      .from(moodCheckins)
      .where(
        and(
          eq(moodCheckins.spaceId, scope.spaceId),
          eq(moodCheckins.userId, scope.partnerId),
          eq(moodCheckins.localDate, partnerDate),
          eq(moodCheckins.visibility, "shared"),
        ),
      );
    return row ?? null;
  },

  async save(
    tx: Tx,
    scope: SpaceScope,
    existing: Row | null,
    input: {
      id: string;
      date: string;
      mood: MoodId;
      note: string | null;
      visibility: MoodVisibility;
      sharedAt: Date | null;
    },
  ) {
    const values = { mood: input.mood, note: input.note, visibility: input.visibility, sharedAt: input.sharedAt };
    const [row] = existing
      ? await tx.update(moodCheckins).set(values).where(eq(moodCheckins.id, existing.id)).returning()
      : await tx
          .insert(moodCheckins)
          .values({ id: input.id, spaceId: scope.spaceId, userId: scope.userId, localDate: input.date, ...values })
          .returning();
    return row ?? null;
  },

  /** Everything the caller may see in a date range: all of theirs, only the partner's shared ones. */
  async visibleBetween(tx: Tx, scope: SpaceScope, from: string, toExclusive: string) {
    return tx
      .select()
      .from(moodCheckins)
      .where(
        and(
          eq(moodCheckins.spaceId, scope.spaceId),
          gte(moodCheckins.localDate, from),
          lt(moodCheckins.localDate, toExclusive),
          or(eq(moodCheckins.userId, scope.userId), eq(moodCheckins.visibility, "shared")),
        ),
      )
      .orderBy(asc(moodCheckins.localDate));
  },
};
