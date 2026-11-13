/**
 * THE place to change how Between looks (DESIGN §2). Every colour in the app comes from a
 * role defined here; components never hold raw colours. To restyle the app, edit a theme; to add
 * one, add an entry to THEMES and it appears in Settings → Appearance.
 *
 * `bun run lint` checks every theme for readable contrast (scripts/check-theme-contrast.ts), so
 * a palette that would make text unreadable fails before it ships.
 *
 * Pure data: no React Native imports, so scripts and tests can load it.
 */

export type Family = "sky" | "butter" | "tomato" | "pink" | "purple" | "orange" | "green" | "teal";
export const FAMILIES: Family[] = ["sky", "butter", "tomato", "pink", "purple", "orange", "green", "teal"];

type FamilySteps = {
  /** fills: cards, chips, illustrations */
  base: string;
  /** tinted backgrounds, selected states */
  soft: string;
  /** text and icons on canvas or on its own soft */
  deep: string;
};

export type ThemeDefinition = {
  label: string;
  mode: "light" | "dark";
  /** Surfaces, lines, text. */
  foundation: {
    canvas: string;
    paper: string;
    sunken: string;
    "paper-kraft": string;
    line: string;
    "line-strong": string;
    ink: string;
    "ink-secondary": string;
    "ink-tertiary": string;
    "ink-disabled": string;
    /** text on an `ink` fill (toasts and inverse content) */
    "on-ink": string;
    /** text on any accent `base` fill; stays dark in dark themes because the fills stay bright */
    "on-accent": string;
    /** text on the one dark accent, teal */
    "on-teal": string;
    /** shadow colour for elevation */
    shadow: string;
    /** behind sheets and modals */
    scrim: string;
  };
  interaction: {
    action: string;
    "on-action": string;
    "action-soft": string;
    "on-action-soft": string;
    highlight: string;
    "highlight-ink": string;
    "identity-you": string;
    "identity-partner": string;
  };
  families: Record<Family, FamilySteps>;
  /** Note paper stocks (DESIGN §7.3 NoteCard). */
  notes: { cream: string; blush: string; kraft: string; sky: string };
};

const artworkLight: ThemeDefinition = {
  label: "Light",
  mode: "light",
  foundation: {
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
    "on-accent": "#1D1A17",
    "on-teal": "#FFFDF8",
    shadow: "#1D1A17",
    scrim: "rgba(29, 26, 23, 0.4)",
  },
  interaction: {
    action: "#1D1A17",
    "on-action": "#FAF6EE",
    "action-soft": "#D6EEE9",
    "on-action-soft": "#006B5C",
    highlight: "#FED57D",
    "highlight-ink": "#1D1A17",
    "identity-you": "#006B5C",
    "identity-partner": "#6D1F42",
  },
  // Fixed illustration swatches retain their established colors.
  families: {
    sky: { base: "#98C1E9", soft: "#E7F5F9", deep: "#1D5A8C" }, // attic window · seafoam
    butter: { base: "#FED57D", soft: "#FDF1D3", deep: "#876029" }, // butter yellow · dry earth
    tomato: { base: "#EF6F3C", soft: "#FCE3D9", deep: "#C62A29" }, // blood orange · cherry
    pink: { base: "#F29CC3", soft: "#FCEDED", deep: "#6D1F42" }, // bubble gum · milkshake · grape juice
    purple: { base: "#D3B6D3", soft: "#E6E3F7", deep: "#5E4394" }, // lilacs · wisteria
    orange: { base: "#F0A351", soft: "#FDE6CC", deep: "#8A4700" }, // apricot jam
    green: { base: "#5BA881", soft: "#E4F1DC", deep: "#25533F" }, // clover · forest
    teal: { base: "#008471", soft: "#D6EEE9", deep: "#006B5C" }, // tropical rain
  },
  notes: { cream: "#FFFDF8", blush: "#FCEDED", kraft: "#E9D8BC", sky: "#E7F5F9" },
};

/** Candlelit (DESIGN §2.5): warm brown-black, like the app by lamplight. Accents stay bright. */
const artworkDark: ThemeDefinition = {
  label: "Candlelit",
  mode: "dark",
  foundation: {
    canvas: "#1A1613",
    paper: "#241F1B",
    sunken: "#2D2722",
    "paper-kraft": "#3B3127",
    line: "#3A322B",
    "line-strong": "#564B40",
    ink: "#F4EDE1",
    "ink-secondary": "#D2C7B8",
    "ink-tertiary": "#AA9E8F",
    "ink-disabled": "#6E655B",
    "on-ink": "#1A1613",
    "on-accent": "#1D1A17",
    "on-teal": "#FFFDF8",
    shadow: "#000000",
    scrim: "rgba(0, 0, 0, 0.55)",
  },
  interaction: {
    action: "#F4EDE1",
    "on-action": "#1A1613",
    "action-soft": "#15312C",
    "on-action-soft": "#5FD1BD",
    highlight: "#FED57D",
    "highlight-ink": "#1D1A17",
    "identity-you": "#5FD1BD",
    "identity-partner": "#F4AECD",
  },
  families: {
    sky: { base: "#98C1E9", soft: "#1F2D39", deep: "#A9CDEF" },
    butter: { base: "#FED57D", soft: "#352B1B", deep: "#FED57D" },
    tomato: { base: "#EF6F3C", soft: "#3B231C", deep: "#F5A58F" },
    pink: { base: "#F29CC3", soft: "#3B2631", deep: "#F4AECD" },
    purple: { base: "#D3B6D3", soft: "#2C2540", deep: "#D8C6F0" },
    orange: { base: "#F0A351", soft: "#3B2B1B", deep: "#F3B26A" },
    green: { base: "#5BA881", soft: "#1D3327", deep: "#8FD1AE" },
    teal: { base: "#008471", soft: "#15312C", deep: "#5FD1BD" },
  },
  notes: { cream: "#2A241F", blush: "#3B2631", kraft: "#3B3127", sky: "#1F2D39" },
};

/** Artwork is stable across personal color choices, like printed stickers. */
export const ART_THEME = artworkLight;

function makeTheme(
  label: string,
  mode: "light" | "dark",
  foundation: Partial<ThemeDefinition["foundation"]>,
  interaction: ThemeDefinition["interaction"],
): ThemeDefinition {
  const base = mode === "dark" ? artworkDark : artworkLight;
  const f = { ...base.foundation, ...foundation };
  return {
    ...base,
    label,
    mode,
    foundation: f,
    interaction,
    notes: mode === "dark" ? base.notes : { ...base.notes, cream: f.paper },
  };
}

const light = makeTheme(
  "Ink & butter",
  "light",
  {
    canvas: "#FCF9F2",
    paper: "#FFFEFA",
    sunken: "#F0EDE5",
    line: "#DDDCD5",
    "line-strong": "#7B8796",
    ink: "#202B3B",
    "ink-secondary": "#465365",
    "ink-tertiary": "#596477",
    "ink-disabled": "#9BA3AD",
    "on-ink": "#FFFEFA",
    "on-accent": "#202B3B",
    shadow: "#202B3B",
    scrim: "rgba(20, 28, 39, 0.4)",
  },
  {
    action: "#244B82",
    "on-action": "#FFFEFA",
    "action-soft": "#E1EAF5",
    "on-action-soft": "#244B82",
    highlight: "#F2CD70",
    "highlight-ink": "#202B3B",
    "identity-you": "#244B82",
    "identity-partner": "#865419",
  },
);
const candlelit = makeTheme(
  "Ink at night",
  "dark",
  {
    canvas: "#141C27",
    paper: "#1D2836",
    sunken: "#263342",
    line: "#394756",
    "line-strong": "#74859A",
    ink: "#F7F5ED",
    "ink-secondary": "#D0D9E3",
    "ink-tertiary": "#B6C2CF",
    "ink-disabled": "#788797",
    "on-ink": "#141C27",
    shadow: "#000000",
    scrim: "rgba(0, 0, 0, 0.55)",
  },
  {
    action: "#A9C8F0",
    "on-action": "#141C27",
    "action-soft": "#263D5B",
    "on-action-soft": "#C4DAF7",
    highlight: "#F2CD70",
    "highlight-ink": "#202B3B",
    "identity-you": "#A9C8F0",
    "identity-partner": "#F2CD70",
  },
);
const rose = makeTheme(
  "Rosewater",
  "light",
  {
    canvas: "#FFF6F5",
    paper: "#FFFCFA",
    sunken: "#F4E7E5",
    line: "#E4CFCE",
    "line-strong": "#986877",
    ink: "#35242B",
    "ink-secondary": "#624A53",
    "ink-tertiary": "#765D67",
    "ink-disabled": "#AF989F",
    "on-ink": "#FFFCFA",
    "on-accent": "#35242B",
    shadow: "#35242B",
    scrim: "rgba(53, 36, 43, 0.4)",
  },
  {
    action: "#A13E64",
    "on-action": "#FFFCFA",
    "action-soft": "#F8E0E8",
    "on-action-soft": "#8C3054",
    highlight: "#F4B8C6",
    "highlight-ink": "#35242B",
    "identity-you": "#8C3054",
    "identity-partner": "#315F76",
  },
);
const roseDark = makeTheme(
  "Rosewater at night",
  "dark",
  {
    canvas: "#25191F",
    paper: "#33232B",
    sunken: "#402E37",
    line: "#56404B",
    "line-strong": "#A17A8D",
    ink: "#FFF0F2",
    "ink-secondary": "#E9CCD4",
    "ink-tertiary": "#D3B1BE",
    "ink-disabled": "#967B86",
    "on-ink": "#25191F",
    shadow: "#000000",
    scrim: "rgba(0, 0, 0, 0.55)",
  },
  {
    action: "#F3B0C9",
    "on-action": "#351725",
    "action-soft": "#542A3C",
    "on-action-soft": "#F8C5D8",
    highlight: "#F4B8C6",
    "highlight-ink": "#35242B",
    "identity-you": "#F3B0C9",
    "identity-partner": "#A9CFDF",
  },
);
const garden = makeTheme(
  "Evergreen",
  "light",
  {
    canvas: "#F7F8F0",
    paper: "#FEFFF8",
    sunken: "#EAEFE3",
    line: "#D6DED1",
    "line-strong": "#72866F",
    ink: "#26342B",
    "ink-secondary": "#455A4B",
    "ink-tertiary": "#5C6C60",
    "ink-disabled": "#97A396",
    "on-ink": "#FEFFF8",
    "on-accent": "#202B25",
    shadow: "#26342B",
    scrim: "rgba(38, 52, 43, 0.4)",
  },
  {
    action: "#235D4F",
    "on-action": "#FEFFF8",
    "action-soft": "#DEEBDD",
    "on-action-soft": "#235D4F",
    highlight: "#DDE79D",
    "highlight-ink": "#26342B",
    "identity-you": "#235D4F",
    "identity-partner": "#865419",
  },
);
const gardenDark = makeTheme(
  "Evergreen at night",
  "dark",
  {
    canvas: "#151F1A",
    paper: "#202E26",
    sunken: "#2A3B30",
    line: "#3C5042",
    "line-strong": "#7E9A85",
    ink: "#F6F5E9",
    "ink-secondary": "#D1DED0",
    "ink-tertiary": "#B6C7BA",
    "ink-disabled": "#7D9584",
    "on-ink": "#151F1A",
    shadow: "#000000",
    scrim: "rgba(0, 0, 0, 0.55)",
  },
  {
    action: "#B6DCC5",
    "on-action": "#151F1A",
    "action-soft": "#2B4939",
    "on-action-soft": "#C9E6D4",
    highlight: "#DDE79D",
    "highlight-ink": "#26342B",
    "identity-you": "#B6DCC5",
    "identity-partner": "#EAD496",
  },
);
const sunroom = makeTheme(
  "Apricot",
  "light",
  {
    canvas: "#FFF7EF",
    paper: "#FFFDFA",
    sunken: "#F5E8DA",
    line: "#E0D3C6",
    "line-strong": "#8E745F",
    ink: "#342921",
    "ink-secondary": "#604A3B",
    "ink-tertiary": "#766356",
    "ink-disabled": "#AE9A89",
    "on-ink": "#FFFDFA",
    "on-accent": "#342921",
    shadow: "#342921",
    scrim: "rgba(52, 41, 33, 0.4)",
  },
  {
    action: "#A4472C",
    "on-action": "#FFFDFA",
    "action-soft": "#F5DFD0",
    "on-action-soft": "#8A3C25",
    highlight: "#F2C784",
    "highlight-ink": "#342921",
    "identity-you": "#8A3C25",
    "identity-partner": "#315F76",
  },
);
const sunroomDark = makeTheme(
  "Apricot at night",
  "dark",
  {
    canvas: "#241B17",
    paper: "#30231C",
    sunken: "#3D2F25",
    line: "#594338",
    "line-strong": "#A88B74",
    ink: "#FFF2E8",
    "ink-secondary": "#E9D1BE",
    "ink-tertiary": "#D3BAA7",
    "ink-disabled": "#9E8570",
    "on-ink": "#241B17",
    shadow: "#000000",
    scrim: "rgba(0, 0, 0, 0.55)",
  },
  {
    action: "#F0AB8B",
    "on-action": "#241B17",
    "action-soft": "#563322",
    "on-action-soft": "#F7C1A8",
    highlight: "#F2C784",
    "highlight-ink": "#342921",
    "identity-you": "#F0AB8B",
    "identity-partner": "#A9CFDF",
  },
);

export const THEMES = { light, candlelit, rose, roseDark, garden, gardenDark, sunroom, sunroomDark } satisfies Record<
  string,
  ThemeDefinition
>;
export type ThemeName = keyof typeof THEMES;
export type ColorThemeId = "postcard" | "rose" | "garden" | "sunroom";
export const COLOR_THEMES: Array<{
  id: ColorThemeId;
  label: string;
  description: string;
  light: ThemeName;
  dark: ThemeName;
}> = [
  { id: "postcard", label: "Ink & butter", description: "Blue ink, warm paper", light: "light", dark: "candlelit" },
  { id: "rose", label: "Rosewater", description: "Rose pink, soft cream", light: "rose", dark: "roseDark" },
  { id: "garden", label: "Evergreen", description: "Deep green, fresh citron", light: "garden", dark: "gardenDark" },
  { id: "sunroom", label: "Apricot", description: "Terracotta, golden light", light: "sunroom", dark: "sunroomDark" },
];
export const SYSTEM_THEME: Record<"light" | "dark", ThemeName> = { light: "light", dark: "candlelit" };

/**
 * Quiz artwork retains its category identity (DESIGN §2.6): fixed paint-chip swatches
 * that look the same in every theme. Every text pair is ≥ 4.5:1.
 */
export const QUIZ_SWATCHES = {
  about_me: { fill: "#008471", text: "#FFFDF8", accent: "#F4D242" }, // tropical rain · paper · pure sun
  favorites: { fill: "#F4D242", text: "#6D1F42", accent: "#EF6F3C" }, // pure sun · grape juice · blood orange
  personality: { fill: "#6D1F42", text: "#D3B6D3", accent: "#FF7BAC" }, // grape juice · lilacs · bubblegum
  relationship: { fill: "#FF7BAC", text: "#6D1F42", accent: "#FFFDF8" }, // bubblegum · grape juice
  chaos: { fill: "#C62A29", text: "#FCEDED", accent: "#F4D242" }, // cherry · milkshake · pure sun
  daily: { fill: "#D6D35F", text: "#25533F", accent: "#008471" }, // limeade · forest · tropical rain
} as const;

/** The flat colour map components read (`palette["sky-soft"]`, `palette.ink`, …). */
export function flatten(t: ThemeDefinition) {
  const out: Record<string, string> = { ...t.foundation, ...t.interaction, transparent: "transparent" };
  for (const f of FAMILIES) {
    out[`${f}-base`] = t.families[f].base;
    out[`${f}-soft`] = t.families[f].soft;
    out[`${f}-deep`] = t.families[f].deep;
  }
  for (const [k, v] of Object.entries(t.notes)) out[`note-${k}`] = v;
  return out as Palette;
}

export type Palette = ThemeDefinition["foundation"] &
  ThemeDefinition["interaction"] & {
    transparent: string;
  } & Record<`${Family}-${"base" | "soft" | "deep"}`, string> &
  Record<`note-${keyof ThemeDefinition["notes"]}`, string>;
