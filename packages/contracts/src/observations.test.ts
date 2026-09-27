import { expect, test } from "bun:test";
import { observation } from "./observations";

test("order-insensitive", () => {
  expect(observation("joyful", "excited")).toBe(observation("excited", "joyful"));
});
test("negative moods never get playful copy", () => {
  expect(observation("angry", "joyful")).toBe("Go gently with each other today.");
  expect(observation("hurt", "hurt")).toBe("Go gently with each other today.");
});
test("unknown pairs say nothing", () => {
  expect(observation("confused", "grateful")).toBeNull();
});
