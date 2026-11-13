import { api } from "./api";
import { newId } from "./ids";

/** No text, answers, mood values, media URLs or arbitrary properties. */
export function trackWidget(name: "widget_added" | "widget_opened" | "widget_interaction" | "widget_deep_link") {
  api.analytics.$post({ json: { id: newId(), name } }).catch(() => {});
}

export function trackNotificationOpen(id: string) {
  api.analytics.$post({ json: { id, name: "notification_opened" } }).catch(() => {});
}
