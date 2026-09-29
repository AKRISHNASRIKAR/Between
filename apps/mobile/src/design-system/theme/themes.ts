/**
 * THE place to change how Love Notes looks (DESIGN §2). Every colour in the app comes from a
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
    /** text on an `ink` fill (primary buttons, toasts) */
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
  families: Record<Family, FamilySteps>;
  /** Note paper stocks (DESIGN §7.3 NoteCard). */
  notes: { cream: string; blush: string; kraft: string; sky: string };
};

const light: ThemeDefinition = {
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
  // Drawn from the Love Notes swatch board (names in comments).
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
const candlelit: ThemeDefinition = {
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

export const THEMES = { light, candlelit } satisfies Record<string, ThemeDefinition>;
export type ThemeName = keyof typeof THEMES;

/** Which theme "System" means for each OS appearance. */
export const SYSTEM_THEME: Record<"light" | "dark", ThemeName> = { light: "light", dark: "candlelit" };

/**
 * Quiz cards are the loudest thing in the app on purpose (DESIGN §2.6): fixed paint-chip swatches
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
  const out: Record<string, string> = { ...t.foundation, transparent: "transparent" };
  for (const f of FAMILIES) {
    out[`${f}-base`] = t.families[f].base;
    out[`${f}-soft`] = t.families[f].soft;
    out[`${f}-deep`] = t.families[f].deep;
  }
  for (const [k, v] of Object.entries(t.notes)) out[`note-${k}`] = v;
  return out as Palette;
}

export type Palette = ThemeDefinition["foundation"] & {
  transparent: string;
} & Record<`${Family}-${"base" | "soft" | "deep"}`, string> &
  Record<`note-${keyof ThemeDefinition["notes"]}`, string>;
