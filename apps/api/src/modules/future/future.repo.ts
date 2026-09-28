import type { FutureCategory, FutureItem } from "@lovenotes/contracts";
import { and, asc, eq, isNull, sql } from "drizzle-orm";
import type { Tx } from "../../db/client";
import { futureItems } from "../../db/schema";
import type { SpaceScope } from "../../lib/scope";

type Row = typeof futureItems.$inferSelect;

export const toFutureItem = (r: Row): FutureItem => ({
  id: r.id,
  title: r.title,
  emoji: r.emoji,
  note: r.note,
  category: r.category,
  position: r.position,
  createdBy: r.createdBy,
  completedAt: r.completedAt?.toISOString() ?? null,
  completedBy: r.completedBy,
  createdAt: r.createdAt.toISOString(),
  version: r.version,
});

const live = (scope: SpaceScope) => and(eq(futureItems.spaceId, scope.spaceId), isNull(futureItems.deletedAt));

export const futureRepo = {
  async list(tx: Tx, scope: SpaceScope) {
    return tx
      .select()
      .from(futureItems)
      .where(live(scope))
      .orderBy(asc(futureItems.position), asc(futureItems.createdAt));
  },
  async find(tx: Tx, scope: SpaceScope, id: string, opts: { lock?: boolean } = {}) {
    const q = tx
      .select()
      .from(futureItems)
      .where(and(live(scope), eq(futureItems.id, id)));
    const [row] = opts.lock ? await q.for("update") : await q;
    return row ?? null;
  },
  async topPosition(tx: Tx, scope: SpaceScope) {
    const [top] = await tx
      .select({ p: futureItems.position })
      .from(futureItems)
      .where(live(scope))
      .orderBy(asc(futureItems.position))
      .limit(1);
    return top?.p ?? null;
  },
  async insert(
    tx: Tx,
    scope: SpaceScope,
    v: {
      id: string;
      title: string;
      emoji: string | null;
      note: string | null;
      category: FutureCategory;
      position: string;
    },
  ) {
    const [row] = await tx
      .insert(futureItems)
      .values({ ...v, spaceId: scope.spaceId, createdBy: scope.userId })
      .onConflictDoNothing()
      .returning();
    return row ?? null;
  },
  /** Every change bumps `version` so stale edits can be detected. */
  async update(tx: Tx, scope: SpaceScope, id: string, patch: Partial<typeof futureItems.$inferInsert>) {
    const [row] = await tx
      .update(futureItems)
      .set({ ...patch, version: sql`${futureItems.version} + 1` })
      .where(and(eq(futureItems.spaceId, scope.spaceId), eq(futureItems.id, id)))
      .returning();
    return row ?? null;
  },
};
