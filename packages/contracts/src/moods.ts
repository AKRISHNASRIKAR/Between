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
