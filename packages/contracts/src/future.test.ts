import { expect, test } from "bun:test";
import { positionBetween } from "./future";

test("positions sort between their neighbours", () => {
  const first = positionBetween(null, null);
  const before = positionBetween(null, first);
  const after = positionBetween(first, null);
  const mid = positionBetween(first, after);
  expect([after, first, mid, before].sort()).toEqual([before, first, mid, after]);
});
test("can keep inserting between close keys", () => {
  let a = positionBetween(null, null);
  const b = positionBetween(a, null);
  for (let i = 0; i < 50; i++) {
    const m = positionBetween(a, b);
    expect(m > a && m < b).toBe(true);
    a = m;
  }
});
