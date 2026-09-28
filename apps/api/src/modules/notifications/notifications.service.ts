import { type Notice, type NotificationPrefs, noticeCopy } from "@lovenotes/contracts";
import { isOnline, publish } from "../../realtime/hub";
import { notificationsRepo } from "./notifications.repo";
import { deliver } from "./push-transport";
import { inQuietHours } from "./quiet-hours";

const DEFAULTS: NotificationPrefs = {
  notes: true,
  vibes: true,
  quizzes: true,
  journal: true,
  future: true,
  petUpdates: false,
  quietStart: null,
  quietEnd: null,
};

export async function getPrefs(userId: string): Promise<NotificationPrefs> {
  const row = await notificationsRepo.prefs(userId);
  if (!row) return DEFAULTS;
  const { userId: _u, ...prefs } = row;
  return { ...prefs, quietStart: prefs.quietStart?.slice(0, 5) ?? null, quietEnd: prefs.quietEnd?.slice(0, 5) ?? null };
}

export async function updatePrefs(userId: string, patch: Partial<NotificationPrefs>): Promise<NotificationPrefs> {
  const next = { ...(await getPrefs(userId)), ...patch };
  await notificationsRepo.upsertPrefs(userId, next);
  return next;
}

export const registerToken = notificationsRepo.upsertToken;
export const removeToken = notificationsRepo.deleteToken;

type NotifyInput = {
  spaceId: string;
  to: string;
  notice: Notice;
  petName: string;
  /** false = in-app notice only (e.g. rate-limited pet updates). */
  allowPush?: boolean;
};

/**
 * Tell one member about something. Call after the transaction commits.
 *  - In the app right now → a live in-app notice (themed banner), no push.
 *  - Away → a push, unless they switched that kind off or it's their quiet hours.
 * Never throws: a failed notification must not fail the action that caused it.
 */
export async function notify({ spaceId, to, notice, petName, allowPush = true }: NotifyInput): Promise<void> {
  try {
    const copy = noticeCopy(notice, petName);
    const prefs = await getPrefs(to);
    if (!prefs[copy.pref]) return;
    if (isOnline(spaceId, to)) {
      publish(spaceId, { t: "notice", to, notice, petName });
      return;
    }
    if (!allowPush) return;
    if (inQuietHours(prefs, await notificationsRepo.timezone(to))) return;
    const tokens = (await notificationsRepo.tokens(to)).map((t) => t.token);
    await deliver(tokens, to, { title: copy.title, body: copy.body, url: copy.url, pillar: copy.pillar });
  } catch (err) {
    console.error("notify failed", err);
  }
}
