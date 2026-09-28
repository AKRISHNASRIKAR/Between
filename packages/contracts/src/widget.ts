import { z } from "zod";
import { MoodId } from "./moods";
import { PetMood, PetStage } from "./pet";

/**
 * What the home-screen widgets show (docs/architecture/10-widgets.md). One small, viewer-specific
 * document, built by the API and pushed to the widget by the app (and, on Android, re-fetched by
 * the widget itself). Widgets sit on the home and lock screen where anyone can glance at them, so
 * this deliberately carries **no note text** and only a Vibe the partner chose to share.
 */
export const WidgetVibe = z.object({ mood: MoodId, label: z.string() }).nullable();

export const WidgetSnapshot = z.object({
  v: z.literal(1),
  /** `closed`: the space is read-only; the widget says so gently and stops nudging. */
  state: z.enum(["ready", "closed"]),
  pet: z.object({ name: z.string(), stage: PetStage, mood: PetMood }),
  you: z.object({ name: z.string(), vibe: WidgetVibe }),
  partner: z.object({ name: z.string(), vibe: WidgetVibe }).nullable(),
  notesWaiting: z.number().int().min(0),
  /** The Daily question from the viewer's side. `none` when there isn't one (alone, or closed). */
  daily: z.enum(["yours", "waiting", "ready", "done", "none"]),
  generatedAt: z.iso.datetime(),
});
export type WidgetSnapshot = z.infer<typeof WidgetSnapshot>;

/** The one thing worth tapping into, and where it goes. Shared so both platforms agree. */
export function widgetFocus(s: WidgetSnapshot): { line: string; url: string } {
  const partner = s.partner?.name ?? "your person";
  if (s.state === "closed") return { line: "This space is resting", url: "/today" };
  if (s.notesWaiting > 0)
    return {
      line: s.notesWaiting === 1 ? `A note from ${partner}` : `${s.notesWaiting} notes from ${partner}`,
      url: "/notes",
    };
  if (s.daily === "ready") return { line: "Ready to reveal ✦", url: "/daily" };
  if (s.daily === "yours") return { line: "Today's question", url: "/daily" };
  if (!s.you.vibe) return { line: "How are you today?", url: "/today" };
  return { line: `${s.pet.name} is ${PET_MOOD_WORD[s.pet.mood]}`, url: "/pet" };
}

export const PET_MOOD_WORD: Record<PetMood, string> = {
  sleepy: "sleepy",
  content: "content",
  happy: "happy",
  excited: "excited",
  peckish: "a little peckish",
};

/** A snapshot for demos, previews and tests. */
export const SAMPLE_WIDGET_SNAPSHOT: WidgetSnapshot = {
  v: 1,
  state: "ready",
  pet: { name: "Mochi", stage: "baby", mood: "happy" },
  you: { name: "You", vibe: { mood: "joyful", label: "Joyful" } },
  partner: { name: "Ananya", vibe: { mood: "excited", label: "Excited" } },
  notesWaiting: 2,
  daily: "yours",
  generatedAt: "2026-09-28T09:00:00.000Z",
};
