import type { NotificationPrefs } from "@lovenotes/contracts";

/** Minutes since local midnight for `date` in an IANA timezone. */
function localMinutes(date: Date, tz: string): number {
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

/** True when `now` falls inside the member's quiet hours (which may wrap past midnight). */
export function inQuietHours(
  prefs: Pick<NotificationPrefs, "quietStart" | "quietEnd">,
  tz: string,
  now = new Date(),
): boolean {
  if (!prefs.quietStart || !prefs.quietEnd) return false;
  const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  const start = toMin(prefs.quietStart);
  const end = toMin(prefs.quietEnd);
  const n = localMinutes(now, tz);
  return start <= end ? n >= start && n < end : n >= start || n < end;
}
