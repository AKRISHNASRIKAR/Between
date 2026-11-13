import { kv } from "@/lib/kv";

const KEY = "between-preview-complete-v1";
export const previewPreference = {
  completed() {
    try {
      return kv.getSync(KEY) === "1";
    } catch {
      return false;
    }
  },
  finish() {
    try {
      kv.setSync(KEY, "1");
    } catch {}
  },
};
