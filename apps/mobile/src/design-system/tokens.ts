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

  "sky-base": "#9CCBF2",
  "sky-soft": "#E3F0FB",
  "sky-deep": "#1D5A8C",
  "butter-base": "#F7D774",
  "butter-soft": "#FBF0C8",
  "butter-deep": "#735400",
  "coral-base": "#F4876E",
  "coral-soft": "#FCE2DA",
  "coral-deep": "#A3371F",
  "pink-base": "#F2A7C3",
  "pink-soft": "#FBE3EC",
  "pink-deep": "#9B2F5C",
  "purple-base": "#B9A2EC",
  "purple-soft": "#ECE4FB",
  "purple-deep": "#5B3FA3",
  "orange-base": "#F7A149",
  "orange-soft": "#FDE6CC",
  "orange-deep": "#8A4700",
  "green-base": "#86C9A0",
  "green-soft": "#DDF1E4",
  "green-deep": "#1F653D",
  "cobalt-base": "#2F4FE0",
  "cobalt-soft": "#DFE4FC",
  "cobalt-deep": "#2A45C4",
} as const;

export type ColorToken = keyof typeof palette;
export const color = (t: ColorToken) => palette[t];

export type Family = "sky" | "butter" | "coral" | "pink" | "purple" | "orange" | "green" | "cobalt";
export const family = (f: Family) => ({
  base: palette[`${f}-base`],
  soft: palette[`${f}-soft`],
  deep: palette[`${f}-deep`],
  /** text/icons drawn on the base fill (DESIGN §2.2) */
  onBase: f === "cobalt" ? palette["on-ink"] : palette.ink,
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

/** Identity markers — who wrote something. Never large fills. */
export const identity = { you: palette["cobalt-base"], partner: palette["coral-base"] } as const;

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
