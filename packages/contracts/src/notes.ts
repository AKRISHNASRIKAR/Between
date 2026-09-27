import { z } from "zod";
import { LIMITS } from "./limits";

export const PAPERS = ["cream", "blush", "kraft", "sky"] as const;
export const Paper = z.enum(PAPERS);
export type Paper = z.infer<typeof Paper>;

export const Note = z.object({
  id: z.uuid(),
  authorId: z.uuid(),
  recipientId: z.uuid(),
  body: z.string(),
  paper: Paper,
  openedAt: z.string().nullable(),
  reactedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Note = z.infer<typeof Note>;

export const CreateNoteInput = z.object({
  id: z.uuid(),
  body: z.string().trim().min(LIMITS.noteBody.min).max(LIMITS.noteBody.max),
  paper: Paper.default("cream"),
});
export type CreateNoteInput = z.infer<typeof CreateNoteInput>;

export const UpdateNoteInput = z.object({
  body: z.string().trim().min(LIMITS.noteBody.min).max(LIMITS.noteBody.max).optional(),
  paper: Paper.optional(),
});
export type UpdateNoteInput = z.infer<typeof UpdateNoteInput>;

export const NoteBox = z.enum(["all", "inbox", "sent"]);
export type NoteBox = z.infer<typeof NoteBox>;

export const NotePage = z.object({ items: z.array(Note), nextCursor: z.string().nullable() });
export type NotePage = z.infer<typeof NotePage>;
