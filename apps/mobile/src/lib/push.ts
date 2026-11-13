import type { NoticePillar } from "@lovenotes/contracts";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { trackNotificationOpen } from "./analytics";
import { api, unwrap } from "./api";
import { newId } from "./ids";
import { kv } from "./kv";
import { PushRegistration } from "./push-registration";

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

const PUSH_TOKEN_KEY = "between-device-push-token";
const registration = new PushRegistration({
  prepare: async () => {
    if (Platform.OS === "web" || !projectId) return { status: "unavailable" };
    const current = await Notifications.getPermissionsAsync();
    const status = current.granted ? current : await Notifications.requestPermissionsAsync();
    if (!status.granted) return { status: "denied" };
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    return { token };
  },
  load: () => kv.getItem(PUSH_TOKEN_KEY),
  save: (token) => kv.setItem(PUSH_TOKEN_KEY, token),
  clear: () => kv.removeItem(PUSH_TOKEN_KEY),
  put: async (token) => {
    await unwrap(
      api.me["push-tokens"][":token"].$put({
        param: { token },
        json: { platform: Platform.OS === "ios" ? "ios" : "android" },
      }),
    );
  },
  delete: async (token) => {
    await unwrap(api.me["push-tokens"][":token"].$delete({ param: { token } }));
  },
});

export const beginPushSession = () => registration.beginSession();
export const suspendPushRegistration = () => registration.suspend();

/** Revoke while authenticated; keep the stored device token if the network is unavailable. */
export const unregisterPush = () => registration.unregister();

/** Requires an EAS projectId and notification permission. */
export const registerForPush = () => registration.register();

/** Tapping a notification opens the screen it points at (payload `data.url`, e.g. /notes/123). */
export function useNotificationRouting(ready: boolean) {
  const last = Notifications.useLastNotificationResponse();
  const handled = useRef<string | null>(null);
  useEffect(() => {
    if (!ready || !last || last.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const identifier = last.notification.request.identifier;
    if (handled.current === identifier) return;
    handled.current = identifier;
    const url = last.notification.request.content.data?.url;
    if (typeof url === "string" && url.startsWith("/")) {
      trackNotificationOpen(newId());
      router.push(url as never);
    }
  }, [ready, last]);

  useEffect(() => {
    if (!ready) {
      suspendPushRegistration();
      return;
    }
    beginPushSession();
    registerForPush().catch(() => {});
    return suspendPushRegistration;
  }, [ready]);
}
