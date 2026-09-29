import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import { kv } from "@/lib/kv";
import { activeThemeName, applyTheme } from "../tokens";
import { SYSTEM_THEME, THEMES, type ThemeName } from "./themes";

/** What the person chose in Settings → Appearance. "system" follows the phone. */
export type ThemePreference = "system" | ThemeName;

const KEY = "appearance";
const isPreference = (v: string | null): v is ThemePreference => v === "system" || (!!v && v in THEMES);

type ThemeState = {
  /** the theme on screen right now */
  name: ThemeName;
  mode: "light" | "dark";
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
  /** every theme, for the Appearance picker */
  options: Array<{ value: ThemePreference; label: string }>;
};

const Ctx = createContext<ThemeState | null>(null);

/** The active theme and the Appearance preference. Use inside <ThemeProvider>. */
export function useTheme(): ThemeState {
  const t = useContext(Ctx);
  if (!t) throw new Error("useTheme must be used inside <ThemeProvider>");
  return t;
}

/**
 * Applies the theme app-wide (docs/architecture/07-mobile.md → Theme). The preference is read
 * synchronously, so the first frame is already in the right theme. Children are keyed by theme
 * name so every screen re-renders with the new palette when it changes.
 */
export function ThemeProvider({ children }: { children: (name: ThemeName) => ReactNode }) {
  const system = useColorScheme();
  const [preference, setPref] = useState<ThemePreference>(() => {
    try {
      const saved = kv.getSync(KEY);
      return isPreference(saved) ? saved : "system";
    } catch {
      return "system";
    }
  });

  const name: ThemeName = preference === "system" ? SYSTEM_THEME[system === "dark" ? "dark" : "light"] : preference;
  // Apply before anything below renders, so every palette read in this pass sees the new theme.
  if (activeThemeName() !== name) applyTheme(name);

  const setPreference = useCallback((p: ThemePreference) => {
    setPref(p);
    try {
      kv.setSync(KEY, p);
    } catch {}
  }, []);

  const value = useMemo<ThemeState>(
    () => ({
      name,
      mode: THEMES[name].mode,
      preference,
      setPreference,
      options: [
        { value: "system", label: "System" },
        ...(Object.keys(THEMES) as ThemeName[]).map((k) => ({ value: k, label: THEMES[k].label })),
      ],
    }),
    [name, preference, setPreference],
  );

  return <Ctx.Provider value={value}>{children(name)}</Ctx.Provider>;
}
