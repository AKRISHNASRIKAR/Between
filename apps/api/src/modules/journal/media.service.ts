import type { Media, UploadIntent, UploadIntentInput } from "@lovenotes/contracts";
import type { Tx } from "../../db/client";
import { db } from "../../db/client";
import { decodeCursor, encodeCursor } from "../../lib/cursor";
import { AppError, notFound } from "../../lib/errors";
import { assertWritable, type SpaceScope } from "../../lib/scope";
import { storage } from "../../lib/storage";
import { DAY_MS } from "../../lib/time";
import { withTx } from "../../lib/tx";
import { mediaPrefix, mediaRepo, toMedia } from "./media.repo";

export const MEDIA_QUOTA_BYTES = 5 * 1024 * 1024 * 1024;
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
};

/** Step 1: reserve a media row and hand back signed upload URLs (the client uploads directly). */
export async function createUpload(scope: SpaceScope, input: UploadIntentInput): Promise<UploadIntent> {
  assertWritable(scope);
  return withTx(async (tx) => {
    if ((await mediaRepo.bytesUsed(tx, scope)) + input.bytes > MEDIA_QUOTA_BYTES)
      throw new AppError("FORBIDDEN_ACTION", 413, "Your space is out of photo storage.");
    const ext = EXT[input.mime] ?? "jpg";
    const base = mediaPrefix(scope.spaceId, input.id);
    await mediaRepo.reserve(tx, scope, {
      id: input.id,
      storageKey: `${base}/main.${ext}`,
      thumbKey: `${base}/thumb.${ext}`,
      mime: input.mime,
      bytes: input.bytes,
      width: input.width,
      height: input.height,
      caption: input.caption ?? null,
      takenAt: input.takenAt ? new Date(input.takenAt) : null,
    });
    const row = await mediaRepo.find(tx, scope, input.id);
    if (!row) throw notFound();
    return {
      mediaId: row.id,
      uploadUrl: storage.signedPutUrl(row.storageKey, input.mime, input.bytes + 1024),
      thumbUploadUrl: storage.signedPutUrl(row.thumbKey, input.mime, input.thumbBytes + 1024),
    };
  });
}

/** Step 2: check both objects really landed in storage, then mark the photo ready. */
export async function completeUpload(scope: SpaceScope, mediaId: string): Promise<Media> {
  return withTx(async (tx) => {
    const row = await mediaRepo.find(tx, scope, mediaId);
    if (!row) throw notFound();
    if (row.status === "ready") return toMedia(row);
    const [main, thumb] = await Promise.all([storage.exists(row.storageKey), storage.exists(row.thumbKey)]);
    if (!main || !thumb) throw new AppError("VALIDATION_FAILED", 422, "Upload didn't finish — try again.");
    const ready = await mediaRepo.markReady(tx, scope, mediaId, main.bytes);
    if (!ready) throw notFound();
    return toMedia(ready);
  });
}

/** Attach the caller's own ready, unattached photos to a block, in the given order. */
export async function attachMedia(tx: Tx, scope: SpaceScope, blockId: string, ids: string[]) {
  if (!ids.length) return;
  const rows = await mediaRepo.ownUploads(tx, scope, ids);
  if (rows.length !== ids.length || rows.some((r) => r.status !== "ready" || (r.blockId && r.blockId !== blockId)))
    throw new AppError("VALIDATION_FAILED", 422, "Some photos aren't ready yet.");
  await mediaRepo.attach(tx, scope, blockId, ids);
}

export async function listMemories(scope: SpaceScope, cursor?: string, limit = 60) {
  const rows = await withTx((tx) => mediaRepo.memories(tx, scope, decodeCursor(cursor), limit + 1));
  const page = rows.slice(0, limit);
  const last = page.at(-1);
  return {
    items: page.map((r) => toMedia(r.m, r.pageId)),
    nextCursor: rows.length > limit && last ? encodeCursor(last.m.createdAt, last.m.id) : null,
  };
}

/** Account deletion: remove every photo this person uploaded from storage (rows cascade with the user). */
export async function removeUploadsBy(userId: string) {
  const mine = await mediaRepo.uploadedBy(db, userId);
  await Promise.all(mine.map((m) => storage.deletePrefix(mediaPrefix(m.spaceId, m.id)).catch(() => {})));
}

/** Housekeeping: drop uploads that never finished (1 day) or were never attached (7 days). */
export async function purgeStaleUploads(now = new Date()) {
  const stale = await mediaRepo.stale(db, new Date(now.getTime() - DAY_MS), new Date(now.getTime() - 7 * DAY_MS));
  for (const m of stale) await storage.deletePrefix(mediaPrefix(m.spaceId, m.id)).catch(() => {});
  await mediaRepo.deleteMany(
    db,
    stale.map((m) => m.id),
  );
  return stale.length;
}
