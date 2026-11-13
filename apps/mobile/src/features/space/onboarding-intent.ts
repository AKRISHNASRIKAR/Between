import { kv } from "@/lib/kv";

type Intent = "create" | "join";
const KEY = "onboarding-intent";
let current: Intent | null = null;

/** Carries a welcome action through sign-in; no account or private content goes in a URL. */
export const onboardingIntent = {
  async set(value: Intent) {
    current = value;
    try {
      await kv.setItem(KEY, value);
    } catch {}
  },
  async take(): Promise<Intent | null> {
    let value: string | null = current;
    try {
      value ??= await kv.getItem(KEY);
      await kv.removeItem(KEY);
    } catch {}
    current = null;
    return value === "join" || value === "create" ? value : null;
  },
};
