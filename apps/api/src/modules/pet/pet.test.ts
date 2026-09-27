import { describe, expect, test } from "bun:test";
import { bondFor } from "./bond";
import { derivePetMood, type PetMoodInput } from "./mood";

const now = new Date("2026-09-28T12:00:00Z");
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000);
const base: PetMoodInput = {
  stage: "baby",
  lastFedAt: hoursAgo(1),
  lastPlayedAt: null,
  lastPettedAt: null,
  lastSharedActivityAt: null,
};

describe("derivePetMood", () => {
  test("egg is always content", () => {
    expect(derivePetMood({ ...base, stage: "egg", lastFedAt: null }, now, 12)).toBe("content");
  });
  test("recent shared activity → excited, even at night", () => {
    expect(derivePetMood({ ...base, lastSharedActivityAt: hoursAgo(1) }, now, 2)).toBe("excited");
  });
  test("night → sleepy", () => {
    expect(derivePetMood(base, now, 23)).toBe("sleepy");
    expect(derivePetMood(base, now, 5)).toBe("sleepy");
  });
  test("long absence → sleepy, never sad", () => {
    expect(derivePetMood({ ...base, lastFedAt: hoursAgo(100) }, now, 12)).toBe("sleepy");
  });
  test("not fed for 20h+ → peckish", () => {
    expect(derivePetMood({ ...base, lastFedAt: hoursAgo(21), lastPettedAt: hoursAgo(1) }, now, 12)).toBe("peckish");
    expect(derivePetMood({ ...base, lastFedAt: null, lastPettedAt: hoursAgo(1) }, now, 12)).toBe("peckish");
  });
  test("recently cared for → happy; otherwise content", () => {
    expect(derivePetMood(base, now, 12)).toBe("happy");
    expect(derivePetMood({ ...base, lastFedAt: hoursAgo(15) }, now, 12)).toBe("content");
  });
});

describe("bondFor", () => {
  test("respects caps", () => {
    expect(bondFor("pet.feed", 0)).toBe(1);
    expect(bondFor("pet.feed", 3)).toBe(0);
    expect(bondFor("future.completed", 99)).toBe(10);
  });
});
