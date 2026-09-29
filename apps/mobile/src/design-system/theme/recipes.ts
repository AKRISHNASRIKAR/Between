import type { ViewStyle } from "react-native";
import { type ColorToken, type Family, family, layout, lift, palette, radius, stroke } from "../tokens";

/**
 * Component recipes (DESIGN §7): how each component looks, in terms of theme roles. Change a
 * recipe here and every button, chip, card or input follows, in every theme. Components only
 * apply these; they don't decide colours or shapes themselves.
 *
 * Recipes are functions so they read the active theme each time they're called (at render).
 */

export type ButtonVariant = "primary" | "secondary" | "quiet" | "accent" | "destructive";
export type SurfaceKind = "card" | "raised" | "well" | "floating";

export const recipes = {
  /** DESIGN §7.2 Button. Only one `primary` per screen. */
  button(variant: ButtonVariant, accent: Family = "butter", size: "lg" | "md" = "lg") {
    const f = family(accent);
    const base = { height: size === "lg" ? 56 : 48, paddingHorizontal: 24, radius: radius.md };
    const looks: Record<
      ButtonVariant,
      {
        bg: string;
        fg: ColorToken | string;
        border?: string;
        radius: number;
        height: number;
        paddingHorizontal: number;
      }
    > = {
      primary: { ...base, bg: palette.ink, fg: "on-ink" },
      secondary: { ...base, bg: palette.paper, fg: "ink", border: palette["line-strong"] },
      quiet: { ...base, bg: "transparent", fg: "ink", height: 44, paddingHorizontal: 0 },
      accent: { ...base, bg: f.base, fg: accent === "teal" ? "on-teal" : "on-accent", radius: radius.pill, height: 48 },
      destructive: { ...base, bg: palette.paper, fg: "tomato-deep", border: palette["tomato-deep"] },
    };
    return looks[variant];
  },

  /** DESIGN §7.2 Chip: quiet until chosen. */
  chip(selected: boolean, accent: Family = "teal") {
    const f = family(accent);
    return {
      height: 34,
      paddingHorizontal: 14,
      radius: radius.pill,
      bg: selected ? f.soft : "transparent",
      fg: selected ? f.deep : palette["ink-tertiary"],
    };
  },

  /** The round pillar-coloured action in a TabHeader. */
  actionButton(accent: Family) {
    const f = family(accent);
    return { size: 48, radius: 24, bg: f.base, fg: f.onBase };
  },

  /** Text inputs and code boxes. */
  input(state: { focused?: boolean; error?: boolean; editable?: boolean }) {
    return {
      radius: radius.sm,
      borderWidth: stroke.regular,
      border: state.error ? palette["tomato-base"] : state.focused ? palette["teal-base"] : palette["line-strong"],
      bg: state.editable === false ? palette.sunken : palette.paper,
      text: palette.ink,
      placeholder: palette["ink-tertiary"],
    };
  },

  /** Containers. `card` sits on the canvas; `raised` floats a little; `well` is recessed. */
  surface(kind: SurfaceKind): ViewStyle {
    switch (kind) {
      case "card":
        return { backgroundColor: palette.paper, borderRadius: radius.lg, padding: layout.cardPadding };
      case "raised":
        return { backgroundColor: palette.paper, borderRadius: radius.lg, padding: layout.cardPadding, ...lift[1] };
      case "well":
        return { backgroundColor: palette.sunken, borderRadius: radius.md, padding: layout.cardPaddingCompact };
      case "floating":
        return { backgroundColor: palette.paper, borderRadius: radius.md, ...lift[2] };
    }
  },

  /** Segmented control (Pages | Photos, Appearance). */
  segmented(on: boolean) {
    return {
      track: palette.sunken,
      thumb: on ? palette.paper : "transparent",
      fg: (on ? "ink" : "ink-tertiary") as ColorToken,
      radius: radius.pill,
    };
  },

  /** Top toast. */
  toast() {
    return {
      bg: palette.ink,
      fg: "on-ink" as ColorToken,
      radius: radius.md,
      success: palette["green-base"],
      error: palette["tomato-base"],
    };
  },

  /** Bottom tab bar. */
  tabBar(accent: Family, focused: boolean) {
    return {
      bg: palette.canvas,
      border: palette.line,
      fg: focused ? palette[`${accent}-deep`] : palette["ink-tertiary"],
      dot: palette[`${accent}-base`],
    };
  },
};
