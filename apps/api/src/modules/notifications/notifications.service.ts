import { type Notice, type NotificationPrefs, noticeCopy } from "@lovenotes/contracts";
import { db } from "../../db/client";
import { makeSpaceScope } from "../../lib/scope";
import { isOnline, publish } from "../../realtime/hub";
import { petRepo } from "../pet";
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
    const petScope = makeSpaceScope({ spaceId, userId: to, partnerId: null, writable: true, timezone: "UTC" });
    const currentPet = await petRepo.get(db, petScope);
    if (notice.type === "pet.milestone" && currentPet?.status !== "ACTIVE") return;
    const hasPet = currentPet?.status === "ACTIVE";
    const copy = noticeCopy(notice, hasPet ? petName : "");
    if (!hasPet && notice.type === "note.waiting") copy.title = "Something from your person";
    if (!hasPet && notice.type === "quiz.your_turn")
      copy.body = `${notice.from} has answered. Your turn when you're ready.`;
    const prefs = await getPrefs(to);
    if (!prefs[copy.pref]) return;
    if (isOnline(spaceId, to)) {
      if (notice.type === "pet.milestone" && (await petRepo.get(db, petScope))?.status !== "ACTIVE") return;
      publish(spaceId, { t: "notice", to, notice, petName: hasPet ? petName : "" });
      return;
    }
    if (!allowPush) return;
    if (inQuietHours(prefs, await notificationsRepo.timezone(to))) return;
    const tokens = (await notificationsRepo.tokens(to)).map((t) => t.token);
    // Announcements run after commit. A pause may have happened during preference/token reads.
    if (notice.type === "pet.milestone" && (await petRepo.get(db, petScope))?.status !== "ACTIVE") return;
    await deliver(tokens, to, { title: copy.title, body: copy.body, url: copy.url, pillar: copy.pillar });
  } catch (err) {
    console.error("notify failed", err);
  }
}
