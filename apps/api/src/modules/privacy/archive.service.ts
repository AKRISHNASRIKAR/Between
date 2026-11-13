import { AppError } from "../../lib/errors";
import type { SpaceScope } from "../../lib/scope";
import { storage } from "../../lib/storage";
import { archiveMedia } from "../journal";
import { exportSpace } from "./privacy.service";
import { tarFile } from "./tar";

const extension: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
};

/** Metadata is authorized through the same read functions as the app; only its attached photos are included. */
export async function exportArchive(scope: SpaceScope) {
  const data = await exportSpace(scope);
  const ids = [
    ...new Set(data.journal.flatMap((page) => page.blocks.flatMap((block) => block.media.map((item) => item.id)))),
  ];
  const photos = await archiveMedia(scope, ids);
  if (photos.length !== ids.length)
    throw new AppError("VALIDATION_FAILED", 409, "Some memories changed during export. Please try again.");
  const byId = new Map(photos.map((photo) => [photo.id, photo]));
  const relative = (id: string, kind: "main" | "thumb") => {
    const photo = byId.get(id);
    if (!photo) throw new Error("Missing authorized photo");
    return `media/${id}/${kind}.${extension[photo.mime] ?? "jpg"}`;
  };
  const metadata = {
    ...data,
    format: "between-export/2",
    note: "This archive contains the actual photo files. Extract it and keep this JSON beside the media folder; media paths are relative to this file.",
    journal: data.journal.map((page) => ({
      ...page,
      blocks: page.blocks.map((block) => ({
        ...block,
        media: block.media.map((photo) => ({
          ...photo,
          url: relative(photo.id, "main"),
          thumbUrl: relative(photo.id, "thumb"),
        })),
      })),
    })),
  };
  async function* contents() {
    yield* tarFile("between.json", new TextEncoder().encode(JSON.stringify(metadata, null, 2)));
    yield* tarFile(
      "README.txt",
      new TextEncoder().encode(
        "Between export\n\nExtract this TAR archive with Files, Archive Utility, or tar -xf.\nYour notes, journal, future plans, visible moods and quiz history are in between.json.\nThe media folder contains the actual photos and thumbnails; no temporary links are required.\nKeep this archive private: it contains your personal shared content.\n",
      ),
    );
    for (const photo of photos) {
      yield* tarFile(relative(photo.id, "main"), await storage.read(photo.storageKey, 10 * 1024 * 1024));
      yield* tarFile(relative(photo.id, "thumb"), await storage.read(photo.thumbKey, 2 * 1024 * 1024));
    }
    yield new Uint8Array(1024);
  }
  const iterator = contents();
  return new ReadableStream<Uint8Array>(
    {
      async pull(controller) {
        try {
          const next = await iterator.next();
          if (next.done) controller.close();
          else controller.enqueue(next.value);
        } catch (error) {
          controller.error(error);
        }
      },
      async cancel() {
        await iterator.return(undefined);
      },
    },
    { highWaterMark: 1 },
  );
}
