const pad = (n: number) => String(n).padStart(2, "0");

/** YYYY-MM-DD in the device's local timezone. */
export const localDateString = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** YYYY-MM in the device's local timezone. */
export const monthString = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y ?? 2000, (m ?? 1) - 1 + delta, 1);
  return monthString(d);
}

export const monthLabel = (month: string) => {
  const [y, m] = month.split("-").map(Number);
  return new Date(y ?? 2000, (m ?? 1) - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
};

/** "just now", "3h ago", "yesterday", "12 Mar" — for timelines. */
export function ago(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const mins = Math.round((now.getTime() - d.getTime()) / 60_000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  if (hours < 48) return "yesterday";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}
