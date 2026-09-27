/** Web (dev preview only): localStorage. SQLite on web is alpha and needs COOP/COEP headers. */
const safe = <T>(fn: () => T, fallback: T): T => {
  try {
    return fn();
  } catch {
    return fallback;
  }
};

export const kv = {
  getItem: async (k: string) => safe(() => globalThis.localStorage.getItem(k), null),
  setItem: async (k: string, v: string) => safe(() => globalThis.localStorage.setItem(k, v), undefined),
  removeItem: async (k: string) => safe(() => globalThis.localStorage.removeItem(k), undefined),
};
