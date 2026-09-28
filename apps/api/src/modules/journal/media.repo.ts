import type { Media } from "@lovenotes/contracts";
import { and, asc, desc, eq, inArray, isNull, lt, or, sql } from "drizzle-orm";
import type { Tx } from "../../db/client";
import { journalBlocks, media } from "../../db/schema";
import type { SpaceScope } from "../../lib/scope";
import { storage } from "../../lib/storage";

export type MediaRow = typeof media.$inferSelect;

/** Storage layout: every object for one photo lives under this prefix (so it can be removed in one go). */
export const mediaPrefix = (spaceId: string, mediaId: string) => `spaces/${spaceId}/media/${mediaId}`;

export const toMedia = (r: MediaRow, pageId: string | null = null): Media => ({
  id: r.id,
  url: storage.signedGetUrl(r.storageKey),
  thumbUrl: storage.signedGetUrl(r.thumbKey),
  width: r.width,
  height: r.height,
  caption: r.caption,
  takenAt: r.takenAt?.toISOString() ?? null,
  createdAt: r.createdAt.toISOString(),
  uploadedBy: r.uploadedBy,
  pageId,
});

export const mediaRepo = {
  async bytesUsed(tx: Tx, scope: SpaceScope) {
    const [used] = await tx
      .select({ n: sql<number>`coalesce(sum(${media.bytes}), 0)::bigint` })
      .from(media)
      .where(eq(media.spaceId, scope.spaceId));
    return Number(used?.n ?? 0);
  },
  async reserve(tx: Tx, scope: SpaceScope, v: Omit<typeof media.$inferInsert, "spaceId" | "uploadedBy">) {
    await tx
      .insert(media)
      .values({ ...v, spaceId: scope.spaceId, uploadedBy: scope.userId })
      .onConflictDoNothing();
  },
  async find(tx: Tx, scope: SpaceScope, id: string) {
    const [row] = await tx
      .select()
      .from(media)
      .where(and(eq(media.id, id), eq(media.spaceId, scope.spaceId)));
    return row ?? null;
  },
  async markReady(tx: Tx, scope: SpaceScope, id: string, bytes: number) {
    const [row] = await tx
      .update(media)
      .set({ status: "ready", bytes })
      .where(and(eq(media.id, id), eq(media.spaceId, scope.spaceId)))
      .returning();
    return row ?? null;
  },
  /** Only the caller's own uploads in this space can be attached. */
  async ownUploads(tx: Tx, scope: SpaceScope, ids: string[]) {
    return tx
      .select()
      .from(media)
      .where(and(eq(media.spaceId, scope.spaceId), inArray(media.id, ids), eq(media.uploadedBy, scope.userId)));
  },
  async attach(tx: Tx, scope: SpaceScope, blockId: string, ids: string[]) {
    for (const [position, id] of ids.entries()) {
      await tx
        .update(media)
        .set({ blockId, position })
        .where(and(eq(media.id, id), eq(media.spaceId, scope.spaceId)));
    }
  },
  async readyForBlocks(tx: Tx, blockIds: string[]) {
    if (!blockIds.length) return [];
    return tx
      .select()
      .from(media)
      .where(and(inArray(media.blockId, blockIds), eq(media.status, "ready")))
      .orderBy(asc(media.position));
  },
  /** Memories: every ready, attached photo, newest first (keyset over createdAt, id). */
  async memories(tx: Tx, scope: SpaceScope, after: { createdAt: Date; id: string } | null, limit: number) {
    return tx
      .select({ m: media, pageId: journalBlocks.pageId })
      .from(media)
      .innerJoin(journalBlocks, eq(journalBlocks.id, media.blockId))
      .where(
        and(
          eq(media.spaceId, scope.spaceId),
          eq(media.status, "ready"),
          after
            ? or(
                lt(media.createdAt, after.createdAt),
                and(eq(media.createdAt, after.createdAt), lt(media.id, after.id)),
              )
            : undefined,
        ),
      )
      .orderBy(desc(media.createdAt), desc(media.id))
      .limit(limit);
  },

  // ── Housekeeping (not space-scoped: they run for the whole system or one account) ──

  async uploadedBy(tx: Tx, userId: string) {
    return tx.select({ id: media.id, spaceId: media.spaceId }).from(media).where(eq(media.uploadedBy, userId));
  },
  /** Uploads never completed within a day, or never attached within a week. */
  async stale(tx: Tx, pendingBefore: Date, unattachedBefore: Date) {
    return tx
      .select({ id: media.id, spaceId: media.spaceId })
      .from(media)
      .where(
        or(
          and(eq(media.status, "pending"), lt(media.createdAt, pendingBefore)),
          and(isNull(media.blockId), lt(media.createdAt, unattachedBefore)),
        ),
      );
  },
  async deleteMany(tx: Tx, ids: string[]) {
    if (ids.length) await tx.delete(media).where(inArray(media.id, ids));
  },
};
