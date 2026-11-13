import type { Media, UploadIntent, UploadIntentInput } from "@lovenotes/contracts";
import type { Tx } from "../../db/client";
import { db } from "../../db/client";
import { decodeCursor, encodeCursor } from "../../lib/cursor";
import { AppError, conflict, forbidden, notFound } from "../../lib/errors";
import { assertWritable, type SpaceScope } from "../../lib/scope";
import { storage } from "../../lib/storage";
import { DAY_MS } from "../../lib/time";
import { withTx } from "../../lib/tx";
import { queueStorageDeletion } from "../storage-jobs";
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
    await mediaRepo.lockSpace(tx, scope);
    const previous = await mediaRepo.find(tx, scope, input.id);
    if (
      previous &&
      (previous.uploadedBy !== scope.userId ||
        previous.mime !== input.mime ||
        previous.width !== input.width ||
        previous.height !== input.height ||
        previous.bytes !== input.bytes ||
        (previous.thumbBytes && previous.thumbBytes !== input.thumbBytes))
    )
      throw conflict("VALIDATION_FAILED", "This upload ID belongs to a different upload.");
    if (!previous) {
      if ((await mediaRepo.bytesUsed(tx, scope)) + input.bytes + input.thumbBytes > MEDIA_QUOTA_BYTES)
        throw new AppError("FORBIDDEN_ACTION", 413, "Your space is out of photo storage.");
      const ext = EXT[input.mime] ?? "jpg";
      const base = mediaPrefix(scope.spaceId, input.id);
      await mediaRepo.reserve(tx, scope, {
        id: input.id,
        storageKey: `${base}/main-upload.${ext}`,
        thumbKey: `${base}/thumb-upload.${ext}`,
        mime: input.mime,
        bytes: input.bytes,
        thumbBytes: input.thumbBytes,
        width: input.width,
        height: input.height,
        caption: input.caption ?? null,
        takenAt: input.takenAt ? new Date(input.takenAt) : null,
      });
    }
    const row = previous ?? (await mediaRepo.find(tx, scope, input.id));
    if (!row) throw notFound();
    // Retrying reservation after completion may upload only to disposable staging keys.
    const staging = (key: string) => key.replace(/\/(main|thumb)(?:-ready)?\./, "/$1-upload.");
    return {
      mediaId: row.id,
      uploadUrl: storage.signedPutUrl(
        row.status === "ready" ? staging(row.storageKey) : row.storageKey,
        row.mime,
        row.bytes,
      ),
      thumbUploadUrl: storage.signedPutUrl(
        row.status === "ready" ? staging(row.thumbKey) : row.thumbKey,
        row.mime,
        row.thumbBytes || input.thumbBytes,
      ),
    };
  });
}

/** Step 2: check both objects really landed in storage, then mark the photo ready. */
export async function completeUpload(scope: SpaceScope, mediaId: string): Promise<Media> {
  assertWritable(scope);
  return withTx(async (tx) => {
    await mediaRepo.lockSpace(tx, scope);
    const row = await mediaRepo.find(tx, scope, mediaId);
    if (!row) throw notFound();
    if (row.uploadedBy !== scope.userId)
      throw forbidden("FORBIDDEN_ACTION", "Only the uploader can finish this photo.");
    if (row.status === "ready") return toMedia(row);
    const [main, thumb] = await Promise.all([storage.exists(row.storageKey), storage.exists(row.thumbKey)]);
    if (!main || !thumb) throw new AppError("VALIDATION_FAILED", 422, "Upload didn't finish — try again.");
    const thumbLimit = row.thumbBytes || 2 * 1024 * 1024;
    if (
      main.bytes <= 0 ||
      main.bytes > row.bytes ||
      main.bytes > 10 * 1024 * 1024 ||
      thumb.bytes <= 0 ||
      thumb.bytes > thumbLimit
    )
      throw new AppError(
        "VALIDATION_FAILED",
        413,
        "The uploaded photo exceeds its reserved size. Remove it and try again.",
      );
    const [mainData, thumbData] = await Promise.all([
      storage.read(row.storageKey, row.bytes),
      storage.read(row.thumbKey, thumbLimit),
    ]);
    if (!imageMatchesMime(mainData, row.mime) || !imageMatchesMime(thumbData, row.mime))
      throw new AppError("VALIDATION_FAILED", 422, "The uploaded files aren't valid images of the selected type.");
    const accounted =
      (await mediaRepo.bytesUsed(tx, scope)) - row.bytes - row.thumbBytes + mainData.byteLength + thumbData.byteLength;
    if (accounted > MEDIA_QUOTA_BYTES)
      throw new AppError("FORBIDDEN_ACTION", 413, "Your space is out of photo storage.");
    const finalKey = (key: string) =>
      key.includes("-upload.") ? key.replace("-upload.", ".") : key.replace(/\/(main|thumb)\./, "/$1-ready.");
    const storageKey = finalKey(row.storageKey);
    const thumbKey = finalKey(row.thumbKey);
    // Only the unguessable staging objects received PUT URLs. Final read objects are immutable to clients.
    await storage.write(storageKey, mainData, row.mime);
    await storage.write(thumbKey, thumbData, row.mime);
    const ready = await mediaRepo.markReady(
      tx,
      scope,
      mediaId,
      mainData.byteLength,
      thumbData.byteLength,
      storageKey,
      thumbKey,
    );
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

/** Image signature validation is independent of client MIME headers and filename extensions. */
export function imageMatchesMime(data: Uint8Array, mime: string) {
  if (mime === "image/jpeg")
    return (
      data.length >= 5 &&
      data[0] === 255 &&
      data[1] === 216 &&
      data[2] === 255 &&
      data.at(-2) === 255 &&
      data.at(-1) === 217
    );
  if (mime === "image/png")
    return data.length >= 33 && Buffer.from(data.subarray(0, 8)).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mime === "image/webp")
    return (
      data.length >= 12 &&
      Buffer.from(data.subarray(0, 4)).toString() === "RIFF" &&
      Buffer.from(data.subarray(8, 12)).toString() === "WEBP"
    );
  if (mime === "image/heic")
    return (
      data.length >= 12 &&
      Buffer.from(data.subarray(4, 8)).toString() === "ftyp" &&
      ["heic", "heix", "hevc", "hevx", "mif1", "msf1"].includes(Buffer.from(data.subarray(8, 12)).toString())
    );
  return false;
}

/** Account deletion: queue before rows cascade; a delayed final pass also catches unexpired staging PUTs. */
export async function removeUploadsBy(userId: string) {
  const mine = await mediaRepo.uploadedBy(db, userId);
  for (const m of mine) {
    const prefix = mediaPrefix(m.spaceId, m.id);
    await queueStorageDeletion(prefix);
    await storage.deletePrefix(prefix).catch(() => {});
  }
}

/** Housekeeping: row cleanup never discards the independent object-deletion retry record. */
export async function purgeStaleUploads(now = new Date()) {
  const stale = await mediaRepo.stale(db, new Date(now.getTime() - DAY_MS), new Date(now.getTime() - 7 * DAY_MS));
  for (const m of stale) {
    const prefix = mediaPrefix(m.spaceId, m.id);
    await queueStorageDeletion(prefix);
    await storage.deletePrefix(prefix).catch(() => {});
  }
  await mediaRepo.deleteMany(
    db,
    stale.map((m) => m.id),
  );
  return stale.length;
}

/** Called only with IDs from the caller's already-authorized journal export. */
export async function archiveMedia(scope: SpaceScope, ids: string[]) {
  return withTx((tx) => mediaRepo.forArchive(tx, scope, ids));
}
