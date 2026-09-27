import type { Media, UploadIntent, UploadIntentInput } from "@lovenotes/contracts";
import { and, desc, eq, inArray, lt, or, sql } from "drizzle-orm";
import type { Tx } from "../../db/client";
import { journalBlocks, media } from "../../db/schema";
import { decodeCursor, encodeCursor } from "../../lib/cursor";
import { AppError, notFound } from "../../lib/errors";
import type { SpaceScope } from "../../lib/scope";
import { storage } from "../../lib/storage";
import { withTx } from "../../lib/tx";
import { assertWritable } from "../spaces/service";

export const MEDIA_QUOTA_BYTES = 5 * 1024 * 1024 * 1024;
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
};

type Row = typeof media.$inferSelect;

export const mediaDto = (r: Row, pageId: string | null = null): Media => ({
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

/** Step 1: reserve a media row + get signed upload URLs (client uploads directly). */
export async function createUpload(scope: SpaceScope, input: UploadIntentInput): Promise<UploadIntent> {
  assertWritable(scope);
  return withTx(async (tx) => {
    const [used] = await tx
      .select({ n: sql<number>`coalesce(sum(${media.bytes}), 0)::bigint` })
      .from(media)
      .where(eq(media.spaceId, scope.spaceId));
    if (Number(used?.n ?? 0) + input.bytes > MEDIA_QUOTA_BYTES)
      throw new AppError("FORBIDDEN_ACTION", 413, "Your space is out of photo storage.");
    const ext = EXT[input.mime] ?? "jpg";
    const base = `spaces/${scope.spaceId}/media/${input.id}`;
    await tx
      .insert(media)
      .values({
        id: input.id,
        spaceId: scope.spaceId,
        uploadedBy: scope.userId,
        storageKey: `${base}/main.${ext}`,
        thumbKey: `${base}/thumb.${ext}`,
        mime: input.mime,
        bytes: input.bytes,
        width: input.width,
        height: input.height,
        caption: input.caption ?? null,
        takenAt: input.takenAt ? new Date(input.takenAt) : null,
      })
      .onConflictDoNothing();
    const [row] = await tx
      .select()
      .from(media)
      .where(and(eq(media.id, input.id), eq(media.spaceId, scope.spaceId)));
    if (!row) throw notFound();
    return {
      mediaId: row.id,
      uploadUrl: storage.signedPutUrl(row.storageKey, input.mime, input.bytes + 1024),
      thumbUploadUrl: storage.signedPutUrl(row.thumbKey, input.mime, input.thumbBytes + 1024),
    };
  });
}

/** Step 2: server verifies both objects exist, then marks the media ready. */
export async function completeUpload(scope: SpaceScope, mediaId: string): Promise<Media> {
  return withTx(async (tx) => {
    const [row] = await tx
      .select()
      .from(media)
      .where(and(eq(media.id, mediaId), eq(media.spaceId, scope.spaceId)));
    if (!row) throw notFound();
    if (row.status === "ready") return mediaDto(row);
    const [main, thumb] = await Promise.all([storage.exists(row.storageKey), storage.exists(row.thumbKey)]);
    if (!main || !thumb) throw new AppError("VALIDATION_FAILED", 422, "Upload didn't finish — try again.");
    const [u] = await tx
      .update(media)
      .set({ status: "ready", bytes: main.bytes })
      .where(eq(media.id, mediaId))
      .returning();
    if (!u) throw notFound();
    return mediaDto(u);
  });
}

/** Attach ready media (uploaded by the caller, in this space, unattached) to a block. */
export async function attachMedia(tx: Tx, scope: SpaceScope, blockId: string, ids: string[]) {
  if (!ids.length) return;
  const rows = await tx
    .select()
    .from(media)
    .where(and(eq(media.spaceId, scope.spaceId), inArray(media.id, ids), eq(media.uploadedBy, scope.userId)));
  if (rows.length !== ids.length || rows.some((r) => r.status !== "ready" || (r.blockId && r.blockId !== blockId)))
    throw new AppError("VALIDATION_FAILED", 422, "Some photos aren't ready yet.");
  for (const [i, id] of ids.entries()) {
    await tx.update(media).set({ blockId, position: i }).where(eq(media.id, id));
  }
}

/** Memories grid: every ready, attached photo, newest first. */
export async function listMemories(scope: SpaceScope, cursor?: string, limit = 60) {
  const after = decodeCursor(cursor);
  return withTx(async (tx) => {
    const rows = await tx
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
      .limit(limit + 1);
    const page = rows.slice(0, limit);
    const last = page.at(-1);
    return {
      items: page.map((r) => mediaDto(r.m, r.pageId)),
      nextCursor: rows.length > limit && last ? encodeCursor(last.m.createdAt, last.m.id) : null,
    };
  });
}
