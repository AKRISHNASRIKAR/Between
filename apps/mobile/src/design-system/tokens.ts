/**
 * Design tokens — mirrors DESIGN.md exactly. This is the ONLY file in the app with raw values.
 * Change DESIGN.md and this file in the same commit.
 */

export const palette = {
  canvas: "#FAF6EE",
  paper: "#FFFDF8",
  sunken: "#F2EBDF",
  "paper-kraft": "#E9D8BC",
  line: "#E5DCCC",
  "line-strong": "#CBBFAA",
  ink: "#1D1A17",
  "ink-secondary": "#4D463F",
  "ink-tertiary": "#6F665D",
  "ink-disabled": "#A89E92",
  "on-ink": "#FAF6EE",
  transparent: "transparent",

  // Accents (DESIGN §2.2) — drawn from the Love Notes swatch board
  "sky-base": "#98C1E9", // attic window
  "sky-soft": "#E7F5F9", // seafoam
  "sky-deep": "#1D5A8C",
  "butter-base": "#FED57D", // butter yellow
  "butter-soft": "#FDF1D3",
  "butter-deep": "#876029", // dry earth
  "tomato-base": "#EF6F3C", // blood orange
  "tomato-soft": "#FCE3D9",
  "tomato-deep": "#C62A29", // cherry
  "pink-base": "#F29CC3", // bubble gum
  "pink-soft": "#FCEDED", // milkshake
  "pink-deep": "#6D1F42", // grape juice
  "purple-base": "#D3B6D3", // lilacs
  "purple-soft": "#E6E3F7", // wisteria
  "purple-deep": "#5E4394",
  "orange-base": "#F0A351", // apricot jam
  "orange-soft": "#FDE6CC",
  "orange-deep": "#8A4700",
  "green-base": "#5BA881", // clover
  "green-soft": "#E4F1DC",
  "green-deep": "#25533F", // forest
  "teal-base": "#008471", // tropical rain
  "teal-soft": "#D6EEE9",
  "teal-deep": "#006B5C",
} as const;

export type ColorToken = keyof typeof palette;
export const color = (t: ColorToken) => palette[t];

export type Family = "sky" | "butter" | "tomato" | "pink" | "purple" | "orange" | "green" | "teal";
export const family = (f: Family) => ({
  base: palette[`${f}-base`],
  soft: palette[`${f}-soft`],
  deep: palette[`${f}-deep`],
  /** text/icons drawn on the base fill (DESIGN §2.2) */
  onBase: f === "teal" ? palette.paper : palette.ink,
});

/** Pillar → family (DESIGN §2.3). */
export const pillar = {
  today: "sky",
  know: "purple",
  notes: "pink",
  remember: "butter",
  future: "green",
  pet: "orange",
} as const satisfies Record<string, Family>;

/**
 * Quiz cards are the loudest thing in the app on purpose (DESIGN §2.6): saturated swatches with
 * a contrasting colour for their words, like a paint-chip card. Every text pair is ≥ 4.5:1.
 */
export const quizTheme = {
  about_me: { fill: "#008471", text: "#FFFDF8", accent: "#F4D242" }, // tropical rain · paper · pure sun
  favorites: { fill: "#F4D242", text: "#6D1F42", accent: "#EF6F3C" }, // pure sun · grape juice · blood orange
  personality: { fill: "#6D1F42", text: "#D3B6D3", accent: "#FF7BAC" }, // grape juice · lilacs · bubblegum
  relationship: { fill: "#FF7BAC", text: "#6D1F42", accent: "#FFFDF8" }, // bubblegum · grape juice
  chaos: { fill: "#C62A29", text: "#FCEDED", accent: "#F4D242" }, // cherry · milkshake · pure sun
  daily: { fill: "#D6D35F", text: "#25533F", accent: "#008471" }, // limeade · forest · tropical rain
} as const;
export type QuizThemeKey = keyof typeof quizTheme;

/** Identity markers — who wrote something. Never large fills. */
export const identity = { you: palette["teal-base"], partner: palette["tomato-base"] } as const;

export const scrim = "rgba(29, 26, 23, 0.4)";

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

/** Elevation (DESIGN §6). Warm ink-tinted, rare. */
export const lift = {
  0: { shadowOpacity: 0, elevation: 0 },
  1: {
    shadowColor: palette.ink,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  2: {
    shadowColor: palette.ink,
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
} as const;

export const stroke = { hairline: 1, regular: 1.5, illustration: 2 } as const;
export const opacity = { disabled: 0.4, dimmed: 0.6 } as const;

/** Card fill for a mood: contrasts with the creature's own fill (DESIGN §7.3 VibeCard). */
export function moodCardFill(fam: Family | "neutral", tone: "base" | "soft"): string {
  if (fam === "neutral") return palette.sunken;
  return tone === "base" ? palette[`${fam}-soft`] : palette[`${fam}-base`];
}

/** Note paper stocks (DESIGN §7.3 NoteCard). */
export const paperFill = {
  cream: palette.paper,
  blush: palette["pink-soft"],
  kraft: palette["paper-kraft"],
  sky: palette["sky-soft"],
} as const;

/** Stable small tilt (degrees) from an id, so a note always sits at the same angle. */
export function seededTilt(id: string, max = 1.5): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return ((Math.abs(h) % 1000) / 1000) * max * 2 - max;
}
