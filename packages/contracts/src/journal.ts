import { z } from "zod";
import { LIMITS } from "./limits";

export const Media = z.object({
  id: z.uuid(),
  url: z.string(),
  thumbUrl: z.string(),
  width: z.number(),
  height: z.number(),
  caption: z.string().nullable(),
  takenAt: z.string().nullable(),
  createdAt: z.string(),
  uploadedBy: z.uuid(),
  pageId: z.uuid().nullable(),
});
export type Media = z.infer<typeof Media>;

export const JournalBlock = z.object({
  id: z.uuid(),
  authorId: z.uuid(),
  kind: z.enum(["text", "photos"]),
  body: z.string().nullable(),
  media: z.array(Media),
  createdAt: z.string(),
  version: z.number(),
});
export type JournalBlock = z.infer<typeof JournalBlock>;

export const JournalPage = z.object({
  id: z.uuid(),
  pageDate: z.iso.date(),
  title: z.string().nullable(),
  createdBy: z.uuid(),
  blocks: z.array(JournalBlock),
  lovedBy: z.array(z.uuid()),
  createdAt: z.string(),
  version: z.number(),
});
export type JournalPage = z.infer<typeof JournalPage>;

export const JournalPageList = z.object({ items: z.array(JournalPage), nextCursor: z.string().nullable() });

export const CreatePageInput = z.object({
  id: z.uuid(),
  pageDate: z.iso.date(),
  title: z.string().trim().max(LIMITS.journalTitle.max).nullable().optional(),
  /** Optional first block. */
  block: z
    .object({
      id: z.uuid(),
      body: z.string().trim().max(LIMITS.journalBlockBody.max).nullable().optional(),
      mediaIds: z.array(z.uuid()).max(10).default([]),
    })
    .optional(),
});
export type CreatePageInput = z.infer<typeof CreatePageInput>;

export const AddBlockInput = z
  .object({
    id: z.uuid(),
    body: z.string().trim().max(LIMITS.journalBlockBody.max).nullable().optional(),
    mediaIds: z.array(z.uuid()).max(10).default([]),
  })
  .refine((b) => !!b.body || b.mediaIds.length > 0, "Write something or add a photo.");
export type AddBlockInput = z.infer<typeof AddBlockInput>;

export const UploadIntentInput = z.object({
  id: z.uuid(),
  mime: z.enum(["image/jpeg", "image/png", "image/webp", "image/heic"]),
  bytes: z
    .number()
    .int()
    .positive()
    .max(10 * 1024 * 1024),
  thumbBytes: z
    .number()
    .int()
    .positive()
    .max(2 * 1024 * 1024),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  takenAt: z.string().nullable().optional(),
  caption: z.string().trim().max(LIMITS.mediaCaption.max).nullable().optional(),
});
export type UploadIntentInput = z.infer<typeof UploadIntentInput>;

export const UploadIntent = z.object({
  mediaId: z.uuid(),
  /** PUT the full image here (Content-Type = mime). */
  uploadUrl: z.string(),
  /** PUT the thumbnail here. */
  thumbUploadUrl: z.string(),
});
export type UploadIntent = z.infer<typeof UploadIntent>;

export const MemoryPage = z.object({ items: z.array(Media), nextCursor: z.string().nullable() });
