import { expect, test } from "bun:test";
import { inQuietHours } from "./quiet-hours";

const at = (hhmm: string) => new Date(`2026-09-28T${hhmm}:00Z`);

test("quiet hours can wrap past midnight", () => {
  const p = { quietStart: "22:00", quietEnd: "08:00" };
  expect(inQuietHours(p, "UTC", at("23:30"))).toBe(true);
  expect(inQuietHours(p, "UTC", at("07:59"))).toBe(true);
  expect(inQuietHours(p, "UTC", at("12:00"))).toBe(false);
});
test("off when not set; respects the member's timezone", () => {
  expect(inQuietHours({ quietStart: null, quietEnd: null }, "UTC", at("03:00"))).toBe(false);
  // 20:00 UTC is 01:30 in Kolkata
  expect(inQuietHours({ quietStart: "23:00", quietEnd: "07:00" }, "Asia/Kolkata", at("20:00"))).toBe(true);
});
