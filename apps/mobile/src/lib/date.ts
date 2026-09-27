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
