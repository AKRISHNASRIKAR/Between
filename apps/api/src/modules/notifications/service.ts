import type { NotificationKind, NotificationPrefs } from "@lovenotes/contracts";
import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import { notificationPrefs, pushTokens, users } from "../../db/schema";
import { env } from "../../env";

export type Push = {
  kind: NotificationKind;
  title: string;
  /** Never private content (DESIGN §11) — "Mochi has something for you", not the note. */
  body: string;
  /** Deep link path, e.g. /notes/123 */
  url?: string;
};

const DEFAULTS: NotificationPrefs = {
  notes: true,
  vibes: true,
  quizzes: true,
  journal: true,
  future: true,
  petGreeting: false,
  quietStart: null,
  quietEnd: null,
};

export async function getPrefs(userId: string): Promise<NotificationPrefs> {
  const [row] = await db.select().from(notificationPrefs).where(eq(notificationPrefs.userId, userId));
  if (!row) return DEFAULTS;
  return {
    ...row,
    quietStart: row.quietStart?.slice(0, 5) ?? null,
    quietEnd: row.quietEnd?.slice(0, 5) ?? null,
  };
}

export async function updatePrefs(userId: string, patch: Partial<NotificationPrefs>): Promise<NotificationPrefs> {
  const next = { ...(await getPrefs(userId)), ...patch };
  await db
    .insert(notificationPrefs)
    .values({ userId, ...next })
    .onConflictDoUpdate({ target: notificationPrefs.userId, set: next });
  return next;
}

export async function registerToken(userId: string, token: string, platform: "ios" | "android") {
  await db
    .insert(pushTokens)
    .values({ token, userId, platform })
    .onConflictDoUpdate({ target: pushTokens.token, set: { userId, lastSeenAt: new Date() } });
}

export async function removeToken(userId: string, token: string) {
  const [row] = await db.select().from(pushTokens).where(eq(pushTokens.token, token));
  if (row?.userId === userId) await db.delete(pushTokens).where(eq(pushTokens.token, token));
}

/** Minutes since local midnight for `date` in `tz`. */
function localMinutes(date: Date, tz: string) {
  try {
    const [h, m] = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone: tz,
    })
      .format(date)
      .split(":")
      .map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
  } catch {
    return date.getUTCHours() * 60 + date.getUTCMinutes();
  }
}

export function inQuietHours(prefs: NotificationPrefs, tz: string, now = new Date()): boolean {
  if (!prefs.quietStart || !prefs.quietEnd) return false;
  const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  const s = toMin(prefs.quietStart);
  const e = toMin(prefs.quietEnd);
  const n = localMinutes(now, tz);
  return s <= e ? n >= s && n < e : n >= s || n < e;
}

/** Fire-and-forget. Respects per-kind prefs and quiet hours. Never throws. */
export async function sendPush(userId: string, push: Push): Promise<void> {
  try {
    const prefs = await getPrefs(userId);
    if (!prefs[push.kind]) return;
    const [u] = await db.select({ tz: users.timezone }).from(users).where(eq(users.id, userId));
    if (inQuietHours(prefs, u?.tz ?? "UTC")) return;

    if (env.PUSH_TRANSPORT === "console") {
      if (env.NODE_ENV === "test") return;
      console.info(
        `🔔 [push:${push.kind}] to=${userId.slice(0, 8)} "${push.title}" — ${push.body}${push.url ? ` → ${push.url}` : ""}`,
      );
      return;
    }
    const tokens = await db.select().from(pushTokens).where(eq(pushTokens.userId, userId));
    if (tokens.length === 0) return;
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(
        tokens.map((t) => ({
          to: t.token,
          title: push.title,
          body: push.body,
          data: { url: push.url },
          sound: "default",
        })),
      ),
    });
  } catch (err) {
    console.error("push failed", err);
  }
}
