import type { Media } from "@lovenotes/contracts";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { api, unwrap } from "./api";
import { ApiError } from "./errors";
import { newId } from "./ids";

export type PickedPhoto = { uri: string; width: number; height: number };

/** Gallery picker. Returns [] if cancelled. */
export async function pickPhotos(limit = 10): Promise<PickedPhoto[]> {
  const r = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: true,
    selectionLimit: limit,
    quality: 1,
    exif: false, // never ship location metadata
  });
  if (r.canceled) return [];
  return r.assets.map((a) => ({ uri: a.uri, width: a.width, height: a.height }));
}

async function render(uri: string, w: number, h: number, maxEdge: number, compress: number) {
  const scale = Math.min(1, maxEdge / Math.max(w, h));
  const ctx = ImageManipulator.manipulate(uri);
  if (scale < 1) ctx.resize({ width: Math.round(w * scale), height: Math.round(h * scale) });
  const ref = await ctx.renderAsync();
  // Re-encoding also strips EXIF (incl. GPS).
  return ref.saveAsync({ format: SaveFormat.JPEG, compress });
}

async function putFile(url: string, uri: string) {
  const blob = await (await fetch(uri)).blob();
  const res = await fetch(url, { method: "PUT", headers: { "Content-Type": "image/jpeg" }, body: blob });
  if (!res.ok) throw new ApiError("NETWORK", res.status, "upload failed");
  return blob.size;
}

/**
 * Upload pipeline (SPEC §7.7): resize (2048 main / 480 thumb, JPEG, EXIF stripped) →
 * reserve (signed PUT URLs) → upload both directly → server verifies → ready.
 */
export async function uploadPhoto(spaceId: string, photo: PickedPhoto, caption?: string | null): Promise<Media> {
  const main = await render(photo.uri, photo.width, photo.height, 2048, 0.8);
  const thumb = await render(photo.uri, photo.width, photo.height, 480, 0.7);
  const [mainBlob, thumbBlob] = await Promise.all([
    fetch(main.uri).then((r) => r.blob()),
    fetch(thumb.uri).then((r) => r.blob()),
  ]);
  const id = newId();
  const intent = await unwrap(
    api.spaces[":sid"].media.uploads.$post({
      param: { sid: spaceId },
      json: {
        id,
        mime: "image/jpeg",
        bytes: mainBlob.size,
        thumbBytes: thumbBlob.size,
        width: main.width,
        height: main.height,
        caption: caption ?? null,
      },
    }),
  );
  await Promise.all([putFile(intent.uploadUrl, main.uri), putFile(intent.thumbUploadUrl, thumb.uri)]);
  return unwrap(api.spaces[":sid"].media[":mid"].complete.$post({ param: { sid: spaceId, mid: id } }));
}
