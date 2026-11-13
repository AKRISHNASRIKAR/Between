import { PET_MOOD_WORD, type WidgetSnapshot, widgetFocus } from "@lovenotes/contracts";
import { art } from "@/design-system/tokens";
import type { UsWidgetProps } from "./ios/UsWidget";

/** Which picture of the pet to show. Widgets can't draw the app's animated SVG pet. */
export type PetArt = "awake" | "sleepy" | "egg";
export const petArtFor = (s: WidgetSnapshot | null): PetArt =>
  !s?.pet || s.pet.stage === "egg" ? "egg" : s.pet.mood === "sleepy" ? "sleepy" : "awake";

/** The widget palette: the fixed light art palette (widgets don't follow the app's theme). */
export const widgetColors = {
  bg: art["pink-soft"],
  ink: art.ink,
  muted: art["ink-tertiary"],
  accent: art["pink-deep"],
  you: art["teal-base"],
  partner: art["tomato-base"],
};

/** Avoid presenting yesterday’s saved state as a live update. */
export const WIDGET_STALE_MS = 6 * 60 * 60 * 1000;

const SCHEME = "lovenotes://";

/** Snapshot → the "Us" widget's props. `null` = signed out: a quiet invitation, no data. */
export function toUsWidgetProps(s: WidgetSnapshot | null, petImage: string, now = Date.now()): UsWidgetProps {
  if (!s) {
    return {
      hasPet: false,
      freshnessLine: "",
      memoryLine: null,
      petName: "Between",
      petImage,
      petLine: "A little world for two",
      focusLine: "Sign in to see your space",
      url: `${SCHEME}today?source=widget`,
      youVibe: null,
      partnerName: null,
      partnerVibe: null,
      colors: widgetColors,
    };
  }
  const stale = now - Date.parse(s.generatedAt) >= WIDGET_STALE_MS;
  const focus = stale ? { line: "Open for the latest from your space", url: "/today" } : widgetFocus(s);
  return {
    hasPet: !!s.pet && !stale,
    freshnessLine: stale ? "Last saved update" : "Updated from your space",
    memoryLine: !stale && s.memoryId ? "A memory from this day last year" : null,
    petName: !stale && s.pet ? s.pet.name : "Between",
    petImage,
    petLine: stale
      ? "Open to refresh your little world"
      : !s.pet
        ? "A little world for two"
        : s.pet.stage === "egg"
          ? "Waiting to hatch"
          : `${s.pet.name} is ${PET_MOOD_WORD[s.pet.mood]}`,
    focusLine: focus.line,
    url: `${SCHEME}${focus.url.slice(1)}?source=widget`,
    youVibe: stale ? null : (s.you.vibe?.label ?? null),
    partnerName: s.partner?.name ?? null,
    partnerVibe: stale ? null : (s.partner?.vibe?.label ?? null),
    colors: widgetColors,
  };
}
