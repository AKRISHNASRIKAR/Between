import { z } from "zod";

/** Content-free product events. Never attach message text, answers, moods or media URLs. */
export const AnalyticsEventName = z.enum([
  "account_created",
  "space_created",
  "partner_invited",
  "partner_joined",
  "first_shared_interaction",
  "mood_checked",
  "mood_shared",
  "note_created",
  "note_opened",
  "quiz_started",
  "quiz_completed",
  "quiz_revealed",
  "journal_entry_created",
  "memory_added",
  "future_item_completed",
  "pet_enabled",
  "pet_disabled",
  "pet_fed",
  "pet_played",
  "pet_petted",
  "pet_evolved",
  "notification_opened",
  "widget_added",
  "widget_opened",
  "widget_interaction",
  "widget_deep_link",
]);
export const AnalyticsEvent = z.object({ id: z.uuid(), name: AnalyticsEventName, occurredAt: z.iso.datetime() });
export const WidgetAnalyticsInput = z.object({
  id: z.uuid(),
  name: z.enum(["widget_added", "widget_opened", "widget_interaction", "widget_deep_link", "notification_opened"]),
});
