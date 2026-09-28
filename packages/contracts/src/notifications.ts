import { z } from "zod";

export const NotificationKind = z.enum(["notes", "vibes", "quizzes", "journal", "future", "petUpdates"]);
export type NotificationKind = z.infer<typeof NotificationKind>;

const Time = z.string().regex(/^\d{2}:\d{2}$/);

export const NotificationPrefs = z.object({
  notes: z.boolean(),
  vibes: z.boolean(),
  quizzes: z.boolean(),
  journal: z.boolean(),
  future: z.boolean(),
  petUpdates: z.boolean(),
  quietStart: Time.nullable(),
  quietEnd: Time.nullable(),
});
export type NotificationPrefs = z.infer<typeof NotificationPrefs>;

export const UpdateNotificationPrefs = NotificationPrefs.partial();

export const PushTokenInput = z.object({ platform: z.enum(["ios", "android"]) });
