import type { NoticePillar } from "@lovenotes/contracts";

export type ForegroundPush = { title: string; body: string; url: string; pillar: NoticePillar };

/** Web dev preview: no push. */
export async function registerForPush() {
  return "unavailable" as const;
}
export function useNotificationRouting(_ready: boolean) {}
export function onForegroundPush(_fn: (p: ForegroundPush) => void) {
  return () => {};
}
