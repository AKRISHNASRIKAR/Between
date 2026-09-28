import type { NoticePillar } from "@lovenotes/contracts";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";
import { api, unwrap } from "./api";

// In the foreground the app shows its own themed notice instead of the system banner.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: false,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export type ForegroundPush = { title: string; body: string; url: string; pillar: NoticePillar };

const PILLARS = new Set<string>(["today", "know", "notes", "remember", "future", "pet"]);

/** A push that arrived while the app is open, handed to the in-app notice host. */
export function onForegroundPush(fn: (p: ForegroundPush) => void) {
  const sub = Notifications.addNotificationReceivedListener((n) => {
    const { title, body, data } = n.request.content;
    const url = typeof data?.url === "string" ? data.url : "/";
    const pillar =
      typeof data?.pillar === "string" && PILLARS.has(data.pillar) ? (data.pillar as NoticePillar) : "today";
    if (title) fn({ title, body: body ?? "", url, pillar });
  });
  return () => sub.remove();
}

const projectId = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId;

/**
 * Ask for permission and register this device's Expo push token with the API.
 * Needs an EAS projectId (set when the app is linked to EAS). Until then it's a no-op —
 * pushes are logged by the API in development anyway.
 */
export async function registerForPush(): Promise<"registered" | "denied" | "unavailable"> {
  if (Platform.OS === "web") return "unavailable";
  const current = await Notifications.getPermissionsAsync();
  const status = current.granted ? current : await Notifications.requestPermissionsAsync();
  if (!status.granted) return "denied";
  if (!projectId) return "unavailable";
  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await unwrap(
      api.me["push-tokens"][":token"].$put({
        param: { token },
        json: { platform: Platform.OS === "ios" ? "ios" : "android" },
      }),
    );
    return "registered";
  } catch {
    return "unavailable";
  }
}

/** Tapping a notification opens the screen it points at (payload `data.url`, e.g. /notes/123). */
export function useNotificationRouting(ready: boolean) {
  const last = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (!ready || !last || last.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const url = last.notification.request.content.data?.url;
    if (typeof url === "string" && url.startsWith("/")) router.push(url as never);
  }, [ready, last]);

  useEffect(() => {
    if (ready) registerForPush().catch(() => {});
  }, [ready]);
}
