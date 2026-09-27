/** Hour-of-day (0–23) for `date` in an IANA timezone. Falls back to UTC for unknown zones. */
export function localHour(date: Date, timeZone: string): number {
  try {
    return Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone }).format(date));
  } catch {
    return date.getUTCHours();
  }
}

/** `YYYY-MM-DD` for `date` in an IANA timezone. */
export function localDate(date: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export const DAY_MS = 86_400_000;
export const HOUR_MS = 3_600_000;
