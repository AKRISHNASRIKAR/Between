import { createContext, type ReactNode, useCallback, useContext, useMemo, useRef, useState } from "react";
import { useColorScheme } from "react-native";
import { kv } from "@/lib/kv";
import { activeThemeName, applyTheme } from "../tokens";
import {
  type AppearanceChoice,
  decodeAppearance,
  encodeAppearance,
  resolveAppearance,
  type ThemePreference,
} from "./theme-preference";
import { type ColorThemeId, THEMES, type ThemeName } from "./themes";

export type { ThemePreference } from "./theme-preference";

const KEY = "appearance";

type ThemeState = {
  /** the theme on screen right now */
  name: ThemeName;
  mode: "light" | "dark";
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
  colorTheme: ColorThemeId;
  setColorTheme: (id: ColorThemeId) => void;
  /** Brightness choices remain independent from the color palette. */
  options: Array<{ value: ThemePreference; label: string }>;
};

const Ctx = createContext<ThemeState | null>(null);

/** Subscribe a render boundary to palette changes without resetting its local state.
 * Optional outside the app provider, where standalone artwork uses the default palette.
 */
export function useThemeSubscription() {
  return useContext(Ctx)?.name;
}

/** The active theme and the Appearance preference. Use inside <ThemeProvider>. */
export function useTheme(): ThemeState {
  const t = useContext(Ctx);
  if (!t) throw new Error("useTheme must be used inside <ThemeProvider>");
  return t;
}

/**
 * Applies the theme app-wide (docs/architecture/07-mobile.md → Theme). The preference is read
 * synchronously, so the first frame is already in the right theme. Components reading the
 * mutable palette subscribe with useThemeSubscription; appearance changes preserve drafts.
 */
export function ThemeProvider({ children }: { children: (name: ThemeName) => ReactNode }) {
  const system = useColorScheme();
  const [choice, setChoice] = useState<AppearanceChoice>(() => {
    try {
      return decodeAppearance(kv.getSync(KEY));
    } catch {
      return decodeAppearance(null);
    }
  });
  const latestChoice = useRef(choice);
  const name = resolveAppearance(choice, system);
  // Apply before descendants read tokens; the provider never keys or remounts its children.
  if (activeThemeName() !== name) applyTheme(name);

  const update = useCallback((patch: Partial<AppearanceChoice>) => {
    const next = { ...latestChoice.current, ...patch };
    latestChoice.current = next;
    setChoice(next);
    try {
      kv.setSync(KEY, encodeAppearance(next));
    } catch {}
  }, []);
  const setPreference = useCallback((appearance: ThemePreference) => update({ appearance }), [update]);
  const setColorTheme = useCallback((colorTheme: ColorThemeId) => update({ colorTheme }), [update]);

  const value = useMemo<ThemeState>(
    () => ({
      name,
      mode: THEMES[name].mode,
      preference: choice.appearance,
      colorTheme: choice.colorTheme,
      setColorTheme,
      setPreference,
      options: [
        { value: "system", label: "System" },
        { value: "light", label: "Light" },
        { value: "dark", label: "Dark" },
      ],
    }),
    [name, choice.appearance, choice.colorTheme, setPreference, setColorTheme],
  );

  return <Ctx.Provider value={value}>{children(name)}</Ctx.Provider>;
}
