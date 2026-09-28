import { PET_MOOD_WORD, type WidgetSnapshot, widgetFocus } from "@lovenotes/contracts";
import { palette } from "@/design-system/tokens";
import type { UsWidgetProps } from "./ios/UsWidget";

/** Which picture of the pet to show. Widgets can't draw the app's animated SVG pet. */
export type PetArt = "awake" | "sleepy" | "egg";
export const petArtFor = (s: WidgetSnapshot | null): PetArt =>
  !s || s.pet.stage === "egg" ? "egg" : s.pet.mood === "sleepy" ? "sleepy" : "awake";

/** The widget palette, from design tokens (widget code itself can't import them). */
export const widgetColors = {
  bg: palette["pink-soft"],
  ink: palette.ink,
  muted: palette["ink-tertiary"],
  accent: palette["pink-deep"],
  you: palette["teal-base"],
  partner: palette["tomato-base"],
};

const SCHEME = "lovenotes://";

/** Snapshot → the "Us" widget's props. `null` = signed out: a quiet invitation, no data. */
export function toUsWidgetProps(s: WidgetSnapshot | null, petImage: string): UsWidgetProps {
  if (!s) {
    return {
      petName: "Love Notes",
      petImage,
      petLine: "A little world for two",
      focusLine: "Sign in to see your space",
      url: `${SCHEME}today`,
      youVibe: null,
      partnerName: null,
      partnerVibe: null,
      colors: widgetColors,
    };
  }
  const focus = widgetFocus(s);
  return {
    petName: s.pet.name,
    petImage,
    petLine: s.pet.stage === "egg" ? "Waiting to hatch" : `${s.pet.name} is ${PET_MOOD_WORD[s.pet.mood]}`,
    focusLine: focus.line,
    url: `${SCHEME}${focus.url.slice(1)}`,
    youVibe: s.you.vibe?.label ?? null,
    partnerName: s.partner?.name ?? null,
    partnerVibe: s.partner?.vibe?.label ?? null,
    colors: widgetColors,
  };
}
