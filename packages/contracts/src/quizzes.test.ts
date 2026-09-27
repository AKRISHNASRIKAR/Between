import { describe, expect, test } from "bun:test";
import { scoreQuiz } from "./quizzes";

const q = (id: string, kind: "choice" | "who" | "open") => ({ id, kind });
const ans = (questionId: string, v: Partial<{ choice: string; guess: string; whoUserId: string }>) => ({
  questionId,
  choice: v.choice ?? null,
  guess: v.guess ?? null,
  whoUserId: v.whoUserId ?? null,
});

describe("scoreQuiz", () => {
  test("perfect understanding → same brain", () => {
    const qs = [q("1", "choice"), q("2", "who")];
    const r = scoreQuiz(
      qs,
      [ans("1", { choice: "a", guess: "a" }), ans("2", { whoUserId: "u1" })],
      [ans("1", { choice: "a", guess: "a" }), ans("2", { whoUserId: "u1" })],
      false,
    );
    expect(r.label).toBe("same_brain");
    expect(r.agreed).toBe(2);
    expect(r.myCorrectGuesses).toBe(1);
  });
  test("guessing each other right counts even when you differ", () => {
    const r = scoreQuiz(
      [q("1", "choice")],
      [ans("1", { choice: "a", guess: "b" })],
      [ans("1", { choice: "b", guess: "a" })],
      false,
    );
    expect(r.agreed).toBe(0);
    expect(r.myCorrectGuesses).toBe(1);
    expect(r.theirCorrectGuesses).toBe(1);
    expect(r.label).toBe("surprisingly_similar");
  });
  test("open questions are never scored; chaos packs are always chaos couple", () => {
    const r = scoreQuiz([q("1", "open")], [ans("1", {})], [ans("1", {})], true);
    expect(r.scored).toBe(0);
    expect(r.label).toBe("chaos_couple");
  });
  test("total mismatch → opposites", () => {
    const r = scoreQuiz(
      [q("1", "choice"), q("2", "who")],
      [ans("1", { choice: "a", guess: "a" }), ans("2", { whoUserId: "u1" })],
      [ans("1", { choice: "b", guess: "b" }), ans("2", { whoUserId: "u2" })],
      false,
    );
    expect(r.label).toBe("opposites");
  });
});
