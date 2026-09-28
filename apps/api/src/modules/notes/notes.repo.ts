import type { Note, Paper } from "@lovenotes/contracts";
import { and, desc, eq, isNull, lt, or, sql } from "drizzle-orm";
import type { Tx } from "../../db/client";
import { notes } from "../../db/schema";
import { decodeCursor, encodeCursor } from "../../lib/cursor";
import type { SpaceScope } from "../../lib/scope";

type Row = typeof notes.$inferSelect;
export type NoteRow = Row;

export const toNote = (r: Row): Note => ({
  id: r.id,
  authorId: r.authorId,
  recipientId: r.recipientId,
  body: r.body,
  paper: r.paper,
  openedAt: r.openedAt?.toISOString() ?? null,
  reactedAt: r.reactedAt?.toISOString() ?? null,
  createdAt: r.createdAt.toISOString(),
  updatedAt: r.updatedAt.toISOString(),
});

/** Notes the caller wrote or received, in their space, not deleted. */
const visible = (scope: SpaceScope) =>
  and(
    eq(notes.spaceId, scope.spaceId),
    isNull(notes.deletedAt),
    or(eq(notes.authorId, scope.userId), eq(notes.recipientId, scope.userId)),
  );

export const notesRepo = {
  /** Unopened notes addressed to the caller (uses notes_waiting_idx). */
  async waitingCount(tx: Tx, scope: SpaceScope) {
    const [r] = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(notes)
      .where(
        and(
          eq(notes.spaceId, scope.spaceId),
          eq(notes.recipientId, scope.userId),
          isNull(notes.openedAt),
          isNull(notes.deletedAt),
        ),
      );
    return r?.n ?? 0;
  },
  async find(tx: Tx, scope: SpaceScope, id: string, opts: { lock?: boolean } = {}) {
    const q = tx
      .select()
      .from(notes)
      .where(and(visible(scope), eq(notes.id, id)));
    const [row] = opts.lock ? await q.for("update") : await q;
    return row ?? null;
  },

  async page(tx: Tx, scope: SpaceScope, box: "all" | "inbox" | "sent", cursor: string | undefined, limit: number) {
    const after = decodeCursor(cursor);
    const rows = await tx
      .select()
      .from(notes)
      .where(
        and(
          visible(scope),
          box === "inbox" ? eq(notes.recipientId, scope.userId) : undefined,
          box === "sent" ? eq(notes.authorId, scope.userId) : undefined,
          after
            ? or(
                lt(notes.createdAt, after.createdAt),
                and(eq(notes.createdAt, after.createdAt), lt(notes.id, after.id)),
              )
            : undefined,
        ),
      )
      .orderBy(desc(notes.createdAt), desc(notes.id))
      .limit(limit + 1);
    const page = rows.slice(0, limit);
    const last = page.at(-1);
    return { rows: page, nextCursor: rows.length > limit && last ? encodeCursor(last.createdAt, last.id) : null };
  },

  /** Insert (idempotent on id). Returns null if this id already existed. */
  async insert(tx: Tx, scope: SpaceScope, input: { id: string; recipientId: string; body: string; paper: Paper }) {
    const [row] = await tx
      .insert(notes)
      .values({
        id: input.id,
        spaceId: scope.spaceId,
        authorId: scope.userId,
        recipientId: input.recipientId,
        body: input.body,
        paper: input.paper,
      })
      .onConflictDoNothing()
      .returning();
    return row ?? null;
  },

  async update(tx: Tx, scope: SpaceScope, id: string, patch: Partial<typeof notes.$inferInsert>) {
    const [row] = await tx
      .update(notes)
      .set(patch)
      .where(and(eq(notes.spaceId, scope.spaceId), eq(notes.id, id)))
      .returning();
    return row ?? null;
  },
};
