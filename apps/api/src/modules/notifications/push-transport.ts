import { env } from "../../env";

export type PushMessage = { title: string; body: string; url: string; pillar: string };

/** Console transport keeps the last pushes in memory, so dev tools and tests can see them. */
export const pushOutbox: Array<PushMessage & { userId: string }> = [];

/**
 * Where pushes go. "console" logs them (development, ADR 0006); "expo" sends through the
 * Expo Push Service to APNs/FCM. The themed chime is bundled in the app (see mobile app.json).
 */
export async function deliver(tokens: string[], userId: string, m: PushMessage) {
  if (env.PUSH_TRANSPORT === "console") {
    pushOutbox.push({ ...m, userId });
    if (pushOutbox.length > 100) pushOutbox.shift();
    if (env.NODE_ENV !== "test")
      console.info(`🔔 [push:${m.pillar}] to=${userId.slice(0, 8)} "${m.title}" — ${m.body} → ${m.url}`);
    return;
  }
  if (tokens.length === 0) return;
  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(
      tokens.map((to) => ({
        to,
        title: m.title,
        body: m.body,
        sound: "chime.wav",
        data: { url: m.url, pillar: m.pillar },
      })),
    ),
  });
}
