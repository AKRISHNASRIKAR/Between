import { describe, expect, test } from "bun:test";
import { homeMoments } from "./moments";

type Input = Parameters<typeof homeMoments>[0];
const base: Input = {
  notesWaiting: 0,
  daily: null,
  vibe: { me: { mood: "calm", visibility: "shared" }, partner: { mood: "excited" } },
  pet: undefined,
  myId: "me",
  partnerName: "Alex",
};
const quiz = { questions: [], myCompletedAt: null, readyAt: null, revealSeenAt: null };
const pet = {
  status: "ACTIVE" as const,
  proposedEnabled: null,
  decisionById: null,
  name: "Mochi",
  mood: "happy" as const,
};

describe("Today's finite moments", () => {
  test("partner note precedes reveal and a missing check-in, and caps at three", () => {
    const result = homeMoments({
      ...base,
      notesWaiting: 27,
      daily: { ...quiz, readyAt: "now" },
      vibe: { me: null, partner: null },
      pet,
    });
    expect(result.moments.map((m) => m.kind)).toEqual(["note", "quiz", "vibe"]);
    expect(result.moments[0]?.body).toContain("27");
    expect(result.caughtUp).toBe(false);
  });
  test("NONE and PAUSED reclaim the pet surface without promotion", () => {
    for (const status of ["NONE", "PAUSED"] as const) {
      const result = homeMoments({ ...base, pet: { ...pet, status } });
      expect(result.moments.map((m) => m.kind)).toEqual(["vibe"]);
      expect(result.caughtUp).toBe(true);
    }
  });
  test("a private check-in counts as complete and is labeled private", () => {
    const result = homeMoments({ ...base, vibe: { me: { mood: "calm", visibility: "private" }, partner: null } });
    expect(result.caughtUp).toBe(true);
    expect(result.moments[0]?.body).toContain("just for you");
    expect(result.moments[0]?.title).not.toBe("You both checked in");
  });
  test("waiting on a partner never blocks the caught-up endpoint", () => {
    const result = homeMoments({ ...base, daily: { ...quiz, myCompletedAt: "now" } });
    expect(result.caughtUp).toBe(true);
    expect(result.moments.some((m) => m.title === "Your answer is tucked away")).toBe(true);
  });
  test("a seen reveal disappears while an active pet stays optional", () => {
    const result = homeMoments({
      ...base,
      daily: { ...quiz, myCompletedAt: "then", readyAt: "then", revealSeenAt: "now" },
      pet,
    });
    expect(result.moments.map((m) => m.kind)).toEqual(["vibe", "pet"]);
    expect(result.caughtUp).toBe(true);
  });
  test("only an actual partner pet proposal calls for a response", () => {
    expect(
      homeMoments({ ...base, pet: { ...pet, status: "PENDING", proposedEnabled: true, decisionById: "them" } })
        .moments[0]?.kind,
    ).toBe("pet-decision");
    expect(
      homeMoments({ ...base, pet: { ...pet, status: "PENDING", proposedEnabled: true, decisionById: "me" } }).caughtUp,
    ).toBe(true);
  });
  test("unknown mood data never manufactures a check-in request", () => {
    expect(homeMoments({ ...base, vibe: undefined }).moments).toHaveLength(0);
  });
});
