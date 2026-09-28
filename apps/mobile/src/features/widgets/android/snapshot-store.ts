import { WidgetSnapshot } from "@lovenotes/contracts";
import { kv } from "@/lib/kv";

/**
 * The last snapshot the app saw, kept on the device so the widget can redraw on its own
 * (resize, reboot, periodic update) even when it can't reach the API.
 */
const KEY = "widget:snapshot";

export async function saveSnapshot(s: WidgetSnapshot | null) {
  if (s) await kv.setItem(KEY, JSON.stringify(s));
  else await kv.removeItem(KEY);
}

export async function loadSnapshot(): Promise<WidgetSnapshot | null> {
  try {
    const raw = await kv.getItem(KEY);
    return raw ? WidgetSnapshot.parse(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}
