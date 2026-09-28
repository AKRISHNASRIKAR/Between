import type { NotificationPrefs } from "@lovenotes/contracts";
import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import { notificationPrefs, pushTokens, users } from "../../db/schema";

/** Data access for notification settings and device tokens. Per-member, not space-scoped. */
export const notificationsRepo = {
  async prefs(userId: string) {
    const [row] = await db.select().from(notificationPrefs).where(eq(notificationPrefs.userId, userId));
    return row ?? null;
  },
  async upsertPrefs(userId: string, prefs: NotificationPrefs) {
    await db
      .insert(notificationPrefs)
      .values({ userId, ...prefs })
      .onConflictDoUpdate({ target: notificationPrefs.userId, set: prefs });
  },
  async timezone(userId: string) {
    const [u] = await db.select({ tz: users.timezone }).from(users).where(eq(users.id, userId));
    return u?.tz ?? "UTC";
  },
  async tokens(userId: string) {
    return db.select().from(pushTokens).where(eq(pushTokens.userId, userId));
  },
  async upsertToken(userId: string, token: string, platform: "ios" | "android") {
    await db
      .insert(pushTokens)
      .values({ token, userId, platform })
      .onConflictDoUpdate({ target: pushTokens.token, set: { userId, lastSeenAt: new Date() } });
  },
  async deleteToken(userId: string, token: string) {
    const [row] = await db.select().from(pushTokens).where(eq(pushTokens.token, token));
    if (row?.userId === userId) await db.delete(pushTokens).where(eq(pushTokens.token, token));
  },
};
