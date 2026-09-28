import { describe, expect, test } from "bun:test";
import { type Notice, noticeCopy } from "./notices";
import { MILESTONE_COPY, PetMilestoneKind } from "./pet";

const all: Notice[] = [
  { type: "note.waiting", noteId: "n1", from: "Ananya" },
  { type: "vibe.shared", from: "Ananya" },
  { type: "quiz.started", sessionId: "s", from: "Ananya", packTitle: "Us two" },
  { type: "quiz.your_turn", sessionId: "s", from: "Ananya", daily: true },
  { type: "quiz.ready", sessionId: "s", daily: false },
  { type: "journal.written", pageId: "p", from: "Ananya" },
  { type: "journal.photos", pageId: "p", from: "Ananya", count: 3 },
  { type: "future.done", from: "Ananya", title: "Visit Goa" },
  { type: "pet.milestone", kind: "stage_young" },
];

describe("noticeCopy", () => {
  test("every notice has a title, body, deep link and pref", () => {
    for (const n of all) {
      const c = noticeCopy(n, "Mochi");
      expect(c.title.length).toBeGreaterThan(0);
      expect(c.body.length).toBeGreaterThan(0);
      expect(c.url.startsWith("/")).toBe(true);
    }
  });
  test("pet milestones are told in the pet's name", () => {
    expect(noticeCopy({ type: "pet.milestone", kind: "hatched" }, "Biscuit").body).toContain("Biscuit");
  });
  test("every milestone kind has copy", () => {
    for (const k of PetMilestoneKind.options) expect(MILESTONE_COPY[k].title).toBeTruthy();
  });
  test("the Daily question opens its own screen; packs open by id", () => {
    expect(noticeCopy({ type: "quiz.ready", sessionId: "s", daily: true }, "Mochi").url).toBe("/daily");
    expect(noticeCopy({ type: "quiz.your_turn", sessionId: "s", from: "A", daily: false }, "Mochi").url).toBe(
      "/quiz/s",
    );
  });
});
