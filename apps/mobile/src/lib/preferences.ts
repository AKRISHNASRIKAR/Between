import { useSyncExternalStore } from "react";
import { useReducedMotion as useSystemReducedMotion } from "react-native-reanimated";
import { kv } from "./kv";

type Preferences = { haptics: boolean; reducedMotion: boolean };
const defaults: Preferences = { haptics: true, reducedMotion: false };
let value = defaults;
try {
  const saved = JSON.parse(kv.getSync("between-personal-preferences") ?? "{}");
  value = {
    haptics: typeof saved?.haptics === "boolean" ? saved.haptics : defaults.haptics,
    reducedMotion: typeof saved?.reducedMotion === "boolean" ? saved.reducedMotion : defaults.reducedMotion,
  };
} catch {}
const listeners = new Set<() => void>();
export function setPreferences(patch: Partial<Preferences>) {
  value = { ...value, ...patch };
  try {
    kv.setSync("between-personal-preferences", JSON.stringify(value));
  } catch {}
  for (const listener of listeners) listener();
}
export const preferences = () => value;
export function usePreferences() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    preferences,
    preferences,
  );
}
export function useReducedMotion() {
  const system = useSystemReducedMotion();
  return usePreferences().reducedMotion || system;
}
