import { describe, expect, test } from "bun:test";
import { WELLBEING_FLOOR } from "@lovenotes/contracts";
import { eligibleMilestones, nextStage } from "./growth";
import { deriveWellbeing } from "./wellbeing";

const now = new Date("2026-09-28T12:00:00Z");
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000);

describe("growth", () => {
  test("stages need both days together and bond", () => {
    expect(nextStage("baby", 500, 5)).toBeNull();
    expect(nextStage("baby", 100, 30)).toBeNull();
    expect(nextStage("baby", 150, 14)).toBe("young");
    expect(nextStage("young", 600, 60)).toBe("grown");
    expect(nextStage("grown", 9999, 999)).toBeNull();
  });
  test("firsts come from the action; thresholds from bond and days", () => {
    expect(eligibleMilestones({ source: "note.created", bond: 3, ageDays: 0, stage: "baby" })).toEqual(["first_note"]);
    expect(eligibleMilestones({ bond: 160, ageDays: 31, stage: "young" })).toEqual([
      "bond_50",
      "bond_150",
      "together_30",
      "stage_young",
    ]);
  });
});

describe("well-being", () => {
  const base = {
    stage: "baby" as const,
    lastFedAt: null,
    lastPlayedAt: null,
    lastPettedAt: null,
    lastSharedActivityAt: null,
  };

  test("never drops below calm, even after weeks alone", () => {
    const w = deriveWellbeing({ ...base, lastFedAt: hoursAgo(24 * 30) }, [], now);
    expect(w.fullness.value).toBe(WELLBEING_FLOOR);
    expect(w.love.value).toBe(WELLBEING_FLOOR);
    expect(w.love.word).toBe("calm");
  });
  test("fills right after care and explains why", () => {
    const w = deriveWellbeing(
      { ...base, lastFedAt: hoursAgo(0.2) },
      [{ kind: "feed", at: hoursAgo(0.2), byUserId: "partner" }],
      now,
    );
    expect(w.fullness.value).toBeGreaterThan(0.95);
    expect(w.fullness.word).toBe("full");
    expect(w.lastCare).toEqual([{ kind: "feed", byUserId: "partner", at: hoursAgo(0.2).toISOString() }]);
  });
  test("eggs are simply cozy", () => {
    const egg = deriveWellbeing({ ...base, stage: "egg" }, [], now);
    expect(egg.love.word).toBe("cozy");
    expect(egg.lastCare).toEqual([]);
  });
});
