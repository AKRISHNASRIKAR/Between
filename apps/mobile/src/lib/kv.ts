import Storage from "expo-sqlite/kv-store";

/** Persistent key-value store (SQLite-backed). Web variant in kv.web.ts. */
export const kv = {
  getItem: (k: string) => Storage.getItem(k),
  setItem: (k: string, v: string) => Storage.setItem(k, v),
  removeItem: (k: string) => Storage.removeItem(k),
  /** Synchronous read, for values needed before the first frame (e.g. the theme). */
  getSync: (k: string) => Storage.getItemSync(k),
  setSync: (k: string, v: string) => Storage.setItemSync(k, v),
};
