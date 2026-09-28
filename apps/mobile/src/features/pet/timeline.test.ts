import { describe, expect, test } from "bun:test";
import type { PetTimelineItem } from "@lovenotes/contracts";
import { groupCare } from "./timeline";

const care = (kind: "feed" | "pet" | "play", by: string, at: string): PetTimelineItem => ({
  type: "care",
  kind,
  byUserId: by,
  at,
});

describe("groupCare", () => {
  test("merges back-to-back identical care, keeps milestones and changes of person apart", () => {
    const g = groupCare([
      care("play", "a", "5"),
      care("play", "a", "4"),
      care("play", "b", "3"),
      { type: "milestone", kind: "first_note", at: "2", byUserId: null },
      care("play", "b", "1"),
    ]);
    expect(g.map((e) => e.times)).toEqual([2, 1, 1, 1]);
  });
});
