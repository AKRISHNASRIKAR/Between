import { COLOR_THEMES, type ColorThemeId, type ThemeName } from "./themes";

export type ThemePreference = "system" | "light" | "dark";
export type AppearanceChoice = { colorTheme: ColorThemeId; appearance: ThemePreference };

export const DEFAULT_APPEARANCE: AppearanceChoice = { colorTheme: "postcard", appearance: "system" };

const isMode = (value: unknown): value is ThemePreference =>
  value === "system" || value === "light" || value === "dark";
const isColorTheme = (value: unknown): value is ColorThemeId => COLOR_THEMES.some((theme) => theme.id === value);

/** Keep the previous Light/Candlelit preference when upgrading to independent color and mode. */
export function decodeAppearance(raw: string | null): AppearanceChoice {
  if (raw === "candlelit") return { colorTheme: "postcard", appearance: "dark" };
  if (isMode(raw)) return { colorTheme: "postcard", appearance: raw };
  if (!raw) return { ...DEFAULT_APPEARANCE };
  try {
    const saved: unknown = JSON.parse(raw);
    if (typeof saved !== "object" || saved === null || !("version" in saved) || saved.version !== 1)
      return { ...DEFAULT_APPEARANCE };
    return {
      colorTheme: "colorTheme" in saved && isColorTheme(saved.colorTheme) ? saved.colorTheme : "postcard",
      appearance: "appearance" in saved && isMode(saved.appearance) ? saved.appearance : "system",
    };
  } catch {
    return { ...DEFAULT_APPEARANCE };
  }
}

export function encodeAppearance(choice: AppearanceChoice): string {
  return JSON.stringify({ version: 1, ...choice });
}

/** System appearance changes the brightness, while keeping the person's selected colors. */
export function resolveAppearance(
  choice: AppearanceChoice,
  systemMode: "light" | "dark" | "unspecified" | null | undefined,
): ThemeName {
  const theme = COLOR_THEMES.find((entry) => entry.id === choice.colorTheme) ?? COLOR_THEMES[0];
  if (!theme) return "light";
  const mode = choice.appearance === "system" ? (systemMode === "dark" ? "dark" : "light") : choice.appearance;
  return theme[mode];
}
