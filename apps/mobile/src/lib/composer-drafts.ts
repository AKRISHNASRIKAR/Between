import { LIMITS, Media } from "@lovenotes/contracts";
import { z } from "zod";
import { localDateString } from "./date";
import { newId } from "./ids";

export const DraftPhoto = z.object({
  key: z.uuid(),
  localUri: z.string(),
  width: z.number().positive(),
  height: z.number().positive(),
  media: Media.optional(),
  failed: z.boolean().optional(),
});
export type DraftPhoto = z.infer<typeof DraftPhoto>;
const JournalDraft = z.object({
  pageDate: z.iso.date(),
  title: z.string().max(LIMITS.journalTitle.max),
  body: z.string().max(LIMITS.journalBlockBody.max),
  photos: z.array(DraftPhoto).max(10),
});
export type JournalDraft = z.infer<typeof JournalDraft>;
export const emptyJournal = (): JournalDraft => ({
  pageDate: localDateString(),
  title: "",
  body: "",
  photos: [],
});
export const validJournal = (value: unknown): value is JournalDraft => JournalDraft.safeParse(value).success;

/** A prior save may already own these media IDs: retained picks must upload as new objects. */
export const rebaseJournalPhotos = (draft: JournalDraft): JournalDraft => ({
  ...draft,
  photos: draft.photos.map((photo) =>
    photo.media
      ? { key: newId(), localUri: photo.localUri, width: photo.width, height: photo.height, failed: true }
      : photo,
  ),
});
