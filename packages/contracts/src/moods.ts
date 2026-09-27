import { z } from "zod";

/** Mood registry — see DESIGN.md §2.4. Adding a mood = one entry here + one creature shape. */
export const MOOD_IDS = [
  "joyful",
  "excited",
  "grateful",
  "connected",
  "calm",
  "tired",
  "sensitive",
  "confused",
  "stressed",
  "insecure",
  "hurt",
  "angry",
] as const;

export const MoodId = z.enum(MOOD_IDS);
export type MoodId = z.infer<typeof MoodId>;

export type AccentFamily = "sky" | "butter" | "coral" | "pink" | "purple" | "orange" | "green" | "cobalt";

export type MoodDef = {
  id: MoodId;
  label: string;
  family: AccentFamily | "neutral";
  tone: "base" | "soft";
  /** Negative moods never get playful observations. */
  valence: "positive" | "neutral" | "negative";
};

export const MOODS: Record<MoodId, MoodDef> = {
  joyful: { id: "joyful", label: "Joyful", family: "butter", tone: "base", valence: "positive" },
  excited: { id: "excited", label: "Excited", family: "orange", tone: "base", valence: "positive" },
  grateful: { id: "grateful", label: "Grateful", family: "pink", tone: "base", valence: "positive" },
  connected: { id: "connected", label: "Connected", family: "coral", tone: "base", valence: "positive" },
  calm: { id: "calm", label: "Calm", family: "sky", tone: "base", valence: "positive" },
  tired: { id: "tired", label: "Tired", family: "neutral", tone: "base", valence: "neutral" },
  sensitive: { id: "sensitive", label: "Sensitive", family: "purple", tone: "base", valence: "neutral" },
  confused: { id: "confused", label: "Confused", family: "purple", tone: "soft", valence: "neutral" },
  stressed: { id: "stressed", label: "Stressed", family: "cobalt", tone: "base", valence: "negative" },
  insecure: { id: "insecure", label: "Insecure", family: "sky", tone: "soft", valence: "negative" },
  hurt: { id: "hurt", label: "Hurt", family: "pink", tone: "soft", valence: "negative" },
  angry: { id: "angry", label: "Angry", family: "coral", tone: "base", valence: "negative" },
};

export const MoodVisibility = z.enum(["private", "shared"]);
export type MoodVisibility = z.infer<typeof MoodVisibility>;

export const MoodCheckin = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  localDate: z.iso.date(),
  mood: MoodId,
  note: z.string().nullable(),
  visibility: MoodVisibility,
  sharedAt: z.string().nullable(),
  updatedAt: z.string(),
});
export type MoodCheckin = z.infer<typeof MoodCheckin>;

export const UpsertMoodInput = z.object({
  /** Client id — used only when this is the day's first check-in. */
  id: z.uuid(),
  mood: MoodId,
  note: z.string().trim().max(140).nullable().optional(),
  visibility: MoodVisibility,
});
export type UpsertMoodInput = z.infer<typeof UpsertMoodInput>;

export const Vibe = z.object({
  date: z.iso.date(),
  me: MoodCheckin.nullable(),
  /** Only ever a *shared* check-in. A private mood is indistinguishable from none (SPEC D11). */
  partner: MoodCheckin.nullable(),
  observation: z.string().nullable(),
});
export type Vibe = z.infer<typeof Vibe>;

export const VibeMonth = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  mine: z.array(MoodCheckin),
  partner: z.array(MoodCheckin),
});
export type VibeMonth = z.infer<typeof VibeMonth>;
