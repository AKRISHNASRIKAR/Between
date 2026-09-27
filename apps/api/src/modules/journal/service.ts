import type { AddBlockInput, CreatePageInput, JournalBlock, JournalPage } from "@lovenotes/contracts";
import { and, asc, desc, eq, inArray, isNull, lt, or, sql } from "drizzle-orm";
import type { Tx } from "../../db/client";
import { journalBlocks, journalPages, journalReactions, media, users } from "../../db/schema";
import { decodeCursor, encodeCursor } from "../../lib/cursor";
import { AppError, forbidden, notFound } from "../../lib/errors";
import type { SpaceScope } from "../../lib/scope";
import { withTx } from "../../lib/tx";
import { activity } from "../activity/service";
import { sendPush } from "../notifications/service";
import { assertWritable } from "../spaces/service";
import { attachMedia, mediaDto } from "./media";

type PageRow = typeof journalPages.$inferSelect;

/** Hydrate pages with blocks, media and reactions in 3 queries. */
async function hydrate(tx: Tx, rows: PageRow[]): Promise<JournalPage[]> {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const blocks = await tx
    .select()
    .from(journalBlocks)
    .where(inArray(journalBlocks.pageId, ids))
    .orderBy(asc(journalBlocks.createdAt));
  const blockIds = blocks.map((b) => b.id);
  const mediaRows = blockIds.length
    ? await tx
        .select()
        .from(media)
        .where(and(inArray(media.blockId, blockIds), eq(media.status, "ready")))
        .orderBy(asc(media.position))
    : [];
  const reactions = await tx.select().from(journalReactions).where(inArray(journalReactions.pageId, ids));

  return rows.map((p) => ({
    id: p.id,
    pageDate: p.pageDate,
    title: p.title,
    createdBy: p.createdBy,
    createdAt: p.createdAt.toISOString(),
    version: p.version,
    lovedBy: reactions.filter((r) => r.pageId === p.id).map((r) => r.userId),
    blocks: blocks
      .filter((b) => b.pageId === p.id)
      .map(
        (b): JournalBlock => ({
          id: b.id,
          authorId: b.authorId,
          kind: b.kind,
          body: b.body,
          media: mediaRows.filter((m) => m.blockId === b.id).map((m) => mediaDto(m, p.id)),
          createdAt: b.createdAt.toISOString(),
          version: b.version,
        }),
      ),
  }));
}

const scoped = (scope: SpaceScope) => and(eq(journalPages.spaceId, scope.spaceId), isNull(journalPages.deletedAt));

async function findPage(tx: Tx, scope: SpaceScope, id: string) {
  const [p] = await tx
    .select()
    .from(journalPages)
    .where(and(scoped(scope), eq(journalPages.id, id)));
  if (!p) throw notFound();
  return p;
}

export async function listPages(scope: SpaceScope, cursor?: string, limit = 20) {
  const after = decodeCursor(cursor);
  return withTx(async (tx) => {
    const rows = await tx
      .select()
      .from(journalPages)
      .where(
        and(
          scoped(scope),
          after
            ? or(
                lt(journalPages.createdAt, after.createdAt),
                and(eq(journalPages.createdAt, after.createdAt), lt(journalPages.id, after.id)),
              )
            : undefined,
        ),
      )
      .orderBy(desc(journalPages.pageDate), desc(journalPages.createdAt), desc(journalPages.id))
      .limit(limit + 1);
    const page = rows.slice(0, limit);
    const last = page.at(-1);
    return {
      items: await hydrate(tx, page),
      nextCursor: rows.length > limit && last ? encodeCursor(last.createdAt, last.id) : null,
    };
  });
}

export async function getPage(scope: SpaceScope, id: string): Promise<JournalPage> {
  return withTx(async (tx) => {
    const [p] = await hydrate(tx, [await findPage(tx, scope, id)]);
    if (!p) throw notFound();
    return p;
  });
}

async function insertBlock(
  tx: Tx,
  scope: SpaceScope,
  pageId: string,
  input: { id: string; body?: string | null; mediaIds: string[] },
) {
  const kind = input.mediaIds.length ? "photos" : "text";
  const inserted = await tx
    .insert(journalBlocks)
    .values({
      id: input.id,
      spaceId: scope.spaceId,
      pageId,
      authorId: scope.userId,
      kind,
      body: input.body?.trim() || null,
    })
    .onConflictDoNothing()
    .returning();
  if (!inserted[0]) return false; // idempotent retry
  await attachMedia(tx, scope, input.id, input.mediaIds);
  return true;
}

async function afterWrite(
  tx: Tx,
  scope: SpaceScope,
  pageId: string,
  photos: number,
  after: (fn: () => void | Promise<void>) => void,
) {
  let pet = await activity.award(tx, scope, "journal.block_added", pageId);
  for (let i = 0; i < photos; i++) pet = (await activity.award(tx, scope, "media.added", pageId)) ?? pet;
  const [me] = await tx.select({ name: users.name }).from(users).where(eq(users.id, scope.userId));
  const partnerId = scope.partnerId;
  after(async () => {
    activity.broadcast(scope.spaceId, { t: "journal.changed", pageId });
    if (pet) activity.broadcast(scope.spaceId, { t: "pet.updated", pet });
    if (partnerId)
      await sendPush(partnerId, {
        kind: "journal",
        title: "Your journal",
        body: photos
          ? `${me?.name || "Your person"} added ${photos} photo${photos > 1 ? "s" : ""}`
          : `${me?.name || "Your person"} wrote in your journal`,
        url: `/journal/${pageId}`,
      });
  });
}

export async function createPage(scope: SpaceScope, input: CreatePageInput): Promise<JournalPage> {
  assertWritable(scope);
  return withTx(async (tx, after) => {
    const inserted = await tx
      .insert(journalPages)
      .values({
        id: input.id,
        spaceId: scope.spaceId,
        pageDate: input.pageDate,
        title: input.title ?? null,
        createdBy: scope.userId,
      })
      .onConflictDoNothing()
      .returning();
    const page = inserted[0] ?? (await findPage(tx, scope, input.id));
    if (inserted[0] && input.block && (input.block.body || input.block.mediaIds.length)) {
      await insertBlock(tx, scope, page.id, { ...input.block, mediaIds: input.block.mediaIds });
      await afterWrite(tx, scope, page.id, input.block.mediaIds.length, after);
    }
    const [p] = await hydrate(tx, [page]);
    if (!p) throw notFound();
    return p;
  });
}

export async function addBlock(scope: SpaceScope, pageId: string, input: AddBlockInput): Promise<JournalPage> {
  assertWritable(scope);
  return withTx(async (tx, after) => {
    const page = await findPage(tx, scope, pageId);
    if (await insertBlock(tx, scope, page.id, { ...input, mediaIds: input.mediaIds })) {
      await afterWrite(tx, scope, page.id, input.mediaIds.length, after);
    }
    const [p] = await hydrate(tx, [page]);
    if (!p) throw notFound();
    return p;
  });
}

/** Blocks belong to their author: only they can edit or delete them. */
export async function editBlock(
  scope: SpaceScope,
  blockId: string,
  body: string,
  version: number,
): Promise<JournalPage> {
  assertWritable(scope);
  return withTx(async (tx, after) => {
    const [b] = await tx
      .select()
      .from(journalBlocks)
      .where(and(eq(journalBlocks.id, blockId), eq(journalBlocks.spaceId, scope.spaceId)))
      .for("update");
    if (!b) throw notFound();
    if (b.authorId !== scope.userId) throw forbidden("FORBIDDEN_ACTION", "You can only edit what you wrote.");
    if (b.version !== version) throw new AppError("VERSION_CONFLICT", 409, "This changed — take another look.");
    await tx
      .update(journalBlocks)
      .set({ body, version: sql`${journalBlocks.version} + 1` })
      .where(eq(journalBlocks.id, blockId));
    after(() => activity.broadcast(scope.spaceId, { t: "journal.changed", pageId: b.pageId }));
    const [p] = await hydrate(tx, [await findPage(tx, scope, b.pageId)]);
    if (!p) throw notFound();
    return p;
  });
}

export async function deleteBlock(scope: SpaceScope, blockId: string): Promise<void> {
  assertWritable(scope);
  await withTx(async (tx, after) => {
    const [b] = await tx
      .select()
      .from(journalBlocks)
      .where(and(eq(journalBlocks.id, blockId), eq(journalBlocks.spaceId, scope.spaceId)));
    if (!b) throw notFound();
    if (b.authorId !== scope.userId) throw forbidden("FORBIDDEN_ACTION", "You can only remove what you wrote.");
    await tx.delete(journalBlocks).where(eq(journalBlocks.id, blockId));
    // Empty page → soft-delete it too.
    const [left] = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(journalBlocks)
      .where(eq(journalBlocks.pageId, b.pageId));
    if (!left?.n) await tx.update(journalPages).set({ deletedAt: new Date() }).where(eq(journalPages.id, b.pageId));
    after(() => activity.broadcast(scope.spaceId, { t: "journal.changed", pageId: b.pageId }));
  });
}

export async function lovePage(scope: SpaceScope, pageId: string, on: boolean): Promise<JournalPage> {
  return withTx(async (tx, after) => {
    const page = await findPage(tx, scope, pageId);
    if (on)
      await tx
        .insert(journalReactions)
        .values({ pageId, spaceId: scope.spaceId, userId: scope.userId })
        .onConflictDoNothing();
    else
      await tx
        .delete(journalReactions)
        .where(and(eq(journalReactions.pageId, pageId), eq(journalReactions.userId, scope.userId)));
    after(() => activity.broadcast(scope.spaceId, { t: "journal.changed", pageId }));
    const [p] = await hydrate(tx, [page]);
    if (!p) throw notFound();
    return p;
  });
}

/** Today's page for "write about today": reuse the newest page dated today, if any. */
export async function findPageByDate(scope: SpaceScope, date: string) {
  return withTx(async (tx) => {
    const [p] = await tx
      .select({ id: journalPages.id })
      .from(journalPages)
      .where(and(scoped(scope), eq(journalPages.pageDate, date)))
      .orderBy(desc(journalPages.createdAt))
      .limit(1);
    return p?.id ?? null;
  });
}
