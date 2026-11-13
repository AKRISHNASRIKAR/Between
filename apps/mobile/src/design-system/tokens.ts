/**
 * Design tokens (DESIGN.md). Colours come from the active theme in ./theme/themes.ts — edit
 * colours there, never here. Everything else (spacing, type, radius, motion) lives in this file.
 */
import { ART_THEME, type Family, flatten, type Palette, QUIZ_SWATCHES, THEMES, type ThemeName } from "./theme/themes";

export type { Family, ThemeName };

/**
 * Colours of the active theme. The same object is updated in place when the theme changes
 * (`applyTheme`), so `palette.ink` always means "ink in the current theme". Read it while
 * rendering, never into a module-level constant.
 */
export const palette: Palette = { ...flatten(THEMES.light) };

/**
 * Illustration colours (moods, pet, egg, props, widget art). Fixed to the light palette in every
 * theme: they're brand artwork, like stickers, and must look the same on any background.
 */
export const art: Palette = flatten(ART_THEME);

let active: ThemeName = "light";
/** Switch the whole palette; subscribed components redraw without remounting. */
export function applyTheme(name: ThemeName) {
  Object.assign(palette, flatten(THEMES[name]));
  active = name;
}
export const activeThemeName = () => active;
export const activeThemeMode = () => THEMES[active].mode;

export type ColorToken = keyof Palette;
export const color = (t: ColorToken) => palette[t];

const steps = (p: Palette, f: Family) => ({
  base: p[`${f}-base`],
  soft: p[`${f}-soft`],
  deep: p[`${f}-deep`],
  /** text/icons drawn on the base fill (DESIGN §2.2) */
  onBase: f === "teal" ? p["on-teal"] : p["on-accent"],
});
/** An accent family in the active theme. */
export const family = (f: Family) => steps(palette, f);
/** An accent family from the fixed illustration palette. */
export const artFamily = (f: Family) => steps(art, f);

/** Pillar → family (DESIGN §2.3). */
export const pillar = {
  today: "sky",
  know: "purple",
  notes: "pink",
  remember: "butter",
  future: "green",
  pet: "orange",
} as const satisfies Record<string, Family>;

/** Quiz paint-chip swatches (DESIGN §2.6): fixed across themes, defined in theme/themes.ts. */
export const quizTheme = QUIZ_SWATCHES;
export type QuizThemeKey = keyof typeof quizTheme;

/** Identity markers — who wrote something. Never large fills. */
export const identity = {
  get you() {
    return palette["identity-you"];
  },
  get partner() {
    return palette["identity-partner"];
  },
};

/** Spacing scale (px). Tailwind keys: p-1 = 4 … p-20 = 80. */
export const space = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
} as const;

export const layout = {
  gutter: 20,
  sectionGap: 32,
  cardPadding: 20,
  cardPaddingCompact: 16,
  stackGap: 12,
  gridGap: 12,
  photoGridGap: 4,
  maxContentWidth: 560,
  minTouch: 44,
  tabBarHeight: 64,
} as const;

export const radius = {
  none: 0,
  paper: 3,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  pill: 999,
} as const;

export const fonts = {
  display600: "Fraunces_600SemiBold",
  display500: "Fraunces_500Medium",
  displayItalic: "Fraunces_400Regular_Italic",
  ui400: "DMSans_400Regular",
  ui500: "DMSans_500Medium",
  ui600: "DMSans_600SemiBold",
  ui700: "DMSans_700Bold",
  hand500: "Caveat_500Medium",
  hand600: "Caveat_600SemiBold",
} as const;

type TypeStyle = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  maxScale: number;
  uppercase?: boolean;
  tabular?: boolean;
};

/** Type scale (DESIGN §3.1). Use via <Text variant>. */
export const type = {
  "display-xl": { fontFamily: fonts.display600, fontSize: 48, lineHeight: 50, letterSpacing: -1.2, maxScale: 1.2 },
  "display-l": { fontFamily: fonts.display600, fontSize: 36, lineHeight: 40, letterSpacing: -0.8, maxScale: 1.25 },
  "display-m": { fontFamily: fonts.display500, fontSize: 28, lineHeight: 32, letterSpacing: -0.4, maxScale: 1.3 },
  heading: { fontFamily: fonts.ui700, fontSize: 18, lineHeight: 24, letterSpacing: -0.2, maxScale: 1.4 },
  body: { fontFamily: fonts.ui400, fontSize: 16, lineHeight: 24, letterSpacing: 0, maxScale: 1.6 },
  "body-sm": { fontFamily: fonts.ui400, fontSize: 14, lineHeight: 20, letterSpacing: 0, maxScale: 1.6 },
  "body-sm-strong": { fontFamily: fonts.ui600, fontSize: 14, lineHeight: 20, letterSpacing: 0, maxScale: 1.6 },
  caption: { fontFamily: fonts.ui500, fontSize: 12, lineHeight: 16, letterSpacing: 0.2, maxScale: 1.6 },
  button: { fontFamily: fonts.ui600, fontSize: 16, lineHeight: 20, letterSpacing: 0.1, maxScale: 1.4 },
  label: {
    fontFamily: fonts.ui700,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.2,
    maxScale: 1.4,
    uppercase: true,
  },
  "label-sm": {
    fontFamily: fonts.ui700,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.8,
    maxScale: 1.3,
    uppercase: true,
  },
  "hand-l": { fontFamily: fonts.hand600, fontSize: 28, lineHeight: 32, letterSpacing: 0, maxScale: 1.4 },
  "hand-m": { fontFamily: fonts.hand500, fontSize: 22, lineHeight: 26, letterSpacing: 0, maxScale: 1.5 },
  numeral: {
    fontFamily: fonts.display600,
    fontSize: 56,
    lineHeight: 56,
    letterSpacing: -1.5,
    maxScale: 1.1,
    tabular: true,
  },
} as const satisfies Record<string, TypeStyle>;

export type TypeVariant = keyof typeof type;

/**
 * Home-screen widget type (DESIGN §7.5). Widgets render natively with system fonts, so they get
 * their own small scale in points; the iOS widget mirrors these values (it can't import tokens).
 */
export const widgetType = { title: 17, name: 15, body: 13, dot: 10, eyebrow: 11, focus: 14 } as const;

/** Elevation (DESIGN §6). Warm, rare. Spread it (`...lift[1]`) while rendering. */
export const lift = {
  0: { shadowOpacity: 0, elevation: 0 },
  get 1() {
    return {
      shadowColor: palette.shadow,
      shadowOpacity: activeThemeMode() === "dark" ? 0.35 : 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    };
  },
  get 2() {
    return {
      shadowColor: palette.shadow,
      shadowOpacity: activeThemeMode() === "dark" ? 0.45 : 0.12,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    };
  },
};

export const stroke = { hairline: 1, regular: 1.5, illustration: 2 } as const;
export const opacity = { disabled: 0.4, dimmed: 0.6 } as const;

/** Card fill for a mood: contrasts with the creature's own fill (DESIGN §7.3 VibeCard). */
export function moodCardFill(fam: Family | "neutral", tone: "base" | "soft"): string {
  if (fam === "neutral") return palette.sunken;
  return tone === "base" ? palette[`${fam}-soft`] : palette[`${fam}-base`];
}

/** Note paper stocks (DESIGN §7.3 NoteCard), per theme. */
export const paperFill = {
  get cream() {
    return palette["note-cream"];
  },
  get blush() {
    return palette["note-blush"];
  },
  get kraft() {
    return palette["note-kraft"];
  },
  get sky() {
    return palette["note-sky"];
  },
};

/** Stable small tilt (degrees) from an id, so a note always sits at the same angle. */
export function seededTilt(id: string, max = 1.5): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return ((Math.abs(h) % 1000) / 1000) * max * 2 - max;
}
