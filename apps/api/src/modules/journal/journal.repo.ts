import type { JournalBlock, JournalPage } from "@lovenotes/contracts";
import { and, asc, desc, eq, inArray, isNull, lt, or, sql } from "drizzle-orm";
import type { Tx } from "../../db/client";
import { journalBlocks, journalPages, journalReactions } from "../../db/schema";
import type { SpaceScope } from "../../lib/scope";
import { mediaRepo, toMedia } from "./media.repo";

export type PageRow = typeof journalPages.$inferSelect;
export type BlockRow = typeof journalBlocks.$inferSelect;

/** Pages are listed by page date, so the cursor carries (pageDate, createdAt, id). */
export type PageCursor = { pageDate: string; createdAt: Date; id: string };

export const encodePageCursor = (p: PageRow) =>
  Buffer.from(`${p.pageDate}|${p.createdAt.toISOString()}|${p.id}`).toString("base64url");

export function decodePageCursor(cursor: string | undefined): PageCursor | null {
  if (!cursor) return null;
  try {
    const [pageDate, iso, id] = Buffer.from(cursor, "base64url").toString().split("|");
    const createdAt = new Date(iso ?? "");
    if (!pageDate || !id || Number.isNaN(createdAt.getTime())) return null;
    return { pageDate, createdAt, id };
  } catch {
    return null;
  }
}

const livePages = (scope: SpaceScope) => and(eq(journalPages.spaceId, scope.spaceId), isNull(journalPages.deletedAt));

/** Strictly after `c` in (pageDate desc, createdAt desc, id desc) order. */
const pageAfter = (c: PageCursor) =>
  or(
    lt(journalPages.pageDate, c.pageDate),
    and(eq(journalPages.pageDate, c.pageDate), lt(journalPages.createdAt, c.createdAt)),
    and(eq(journalPages.pageDate, c.pageDate), eq(journalPages.createdAt, c.createdAt), lt(journalPages.id, c.id)),
  );

export const journalRepo = {
  async findPage(tx: Tx, scope: SpaceScope, id: string) {
    const [p] = await tx
      .select()
      .from(journalPages)
      .where(and(livePages(scope), eq(journalPages.id, id)));
    return p ?? null;
  },
  async pages(tx: Tx, scope: SpaceScope, after: PageCursor | null, limit: number) {
    return tx
      .select()
      .from(journalPages)
      .where(and(livePages(scope), after ? pageAfter(after) : undefined))
      .orderBy(desc(journalPages.pageDate), desc(journalPages.createdAt), desc(journalPages.id))
      .limit(limit);
  },
  async newestPageOn(tx: Tx, scope: SpaceScope, date: string) {
    const [p] = await tx
      .select({ id: journalPages.id })
      .from(journalPages)
      .where(and(livePages(scope), eq(journalPages.pageDate, date)))
      .orderBy(desc(journalPages.createdAt))
      .limit(1);
    return p?.id ?? null;
  },
  async insertPage(tx: Tx, scope: SpaceScope, v: { id: string; pageDate: string; title: string | null }) {
    const [row] = await tx
      .insert(journalPages)
      .values({ ...v, spaceId: scope.spaceId, createdBy: scope.userId })
      .onConflictDoNothing()
      .returning();
    return row ?? null;
  },
  async softDeletePage(tx: Tx, scope: SpaceScope, id: string) {
    await tx
      .update(journalPages)
      .set({ deletedAt: new Date() })
      .where(and(eq(journalPages.spaceId, scope.spaceId), eq(journalPages.id, id)));
  },

  async findBlock(tx: Tx, scope: SpaceScope, id: string, opts: { lock?: boolean } = {}) {
    const q = tx
      .select()
      .from(journalBlocks)
      .where(and(eq(journalBlocks.id, id), eq(journalBlocks.spaceId, scope.spaceId)));
    const [b] = opts.lock ? await q.for("update") : await q;
    return b ?? null;
  },
  /** Returns false when the block already exists (an idempotent retry). */
  async insertBlock(
    tx: Tx,
    scope: SpaceScope,
    v: { id: string; pageId: string; kind: BlockRow["kind"]; body: string | null },
  ) {
    const [row] = await tx
      .insert(journalBlocks)
      .values({ ...v, spaceId: scope.spaceId, authorId: scope.userId })
      .onConflictDoNothing()
      .returning();
    return !!row;
  },
  async updateBlockBody(tx: Tx, scope: SpaceScope, id: string, body: string) {
    await tx
      .update(journalBlocks)
      .set({ body, version: sql`${journalBlocks.version} + 1` })
      .where(and(eq(journalBlocks.id, id), eq(journalBlocks.spaceId, scope.spaceId)));
  },
  async deleteBlock(tx: Tx, scope: SpaceScope, id: string) {
    await tx.delete(journalBlocks).where(and(eq(journalBlocks.id, id), eq(journalBlocks.spaceId, scope.spaceId)));
  },
  async blockCount(tx: Tx, scope: SpaceScope, pageId: string) {
    const [r] = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(journalBlocks)
      .where(and(eq(journalBlocks.spaceId, scope.spaceId), eq(journalBlocks.pageId, pageId)));
    return r?.n ?? 0;
  },

  async setLove(tx: Tx, scope: SpaceScope, pageId: string, on: boolean) {
    if (on)
      await tx
        .insert(journalReactions)
        .values({ pageId, spaceId: scope.spaceId, userId: scope.userId })
        .onConflictDoNothing();
    else
      await tx
        .delete(journalReactions)
        .where(and(eq(journalReactions.pageId, pageId), eq(journalReactions.userId, scope.userId)));
  },

  /** Pages with their blocks, photos and loves, in three queries. */
  async hydrate(tx: Tx, rows: PageRow[]): Promise<JournalPage[]> {
    if (!rows.length) return [];
    const ids = rows.map((r) => r.id);
    const blocks = await tx
      .select()
      .from(journalBlocks)
      .where(inArray(journalBlocks.pageId, ids))
      .orderBy(asc(journalBlocks.createdAt));
    const photos = await mediaRepo.readyForBlocks(
      tx,
      blocks.map((b) => b.id),
    );
    const loves = await tx.select().from(journalReactions).where(inArray(journalReactions.pageId, ids));

    return rows.map((p) => ({
      id: p.id,
      pageDate: p.pageDate,
      title: p.title,
      createdBy: p.createdBy,
      createdAt: p.createdAt.toISOString(),
      version: p.version,
      lovedBy: loves.filter((r) => r.pageId === p.id).map((r) => r.userId),
      blocks: blocks
        .filter((b) => b.pageId === p.id)
        .map(
          (b): JournalBlock => ({
            id: b.id,
            authorId: b.authorId,
            kind: b.kind,
            body: b.body,
            media: photos.filter((m) => m.blockId === b.id).map((m) => toMedia(m, p.id)),
            createdAt: b.createdAt.toISOString(),
            version: b.version,
          }),
        ),
    }));
  },
};
