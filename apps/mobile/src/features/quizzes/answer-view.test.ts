import { expect, test } from "bun:test";
import type { QuizAnswer, QuizQuestion } from "@lovenotes/contracts";
import { answerAgreement, answerLabel, questionAnswered, resumeQuestionIndex } from "./answer-view";

const q: QuizQuestion = {
  id: "q",
  kind: "choice",
  promptSelf: "Pick a drink",
  promptGuess: "Their drink",
  options: [
    { id: "tea", label: "Tea" },
    { id: "coffee", label: "Coffee" },
  ],
};
const answer = (patch: Partial<QuizAnswer>): QuizAnswer => ({
  questionId: "q",
  choice: null,
  guess: null,
  whoUserId: null,
  text: null,
  ...patch,
});
test("one question is complete only after both independent selections, including same-option picks", () => {
  expect(questionAnswered(q, answer({ choice: "tea" }))).toBe(false);
  expect(questionAnswered(q, answer({ guess: "tea" }))).toBe(false);
  expect(questionAnswered(q, answer({ choice: "tea", guess: "tea" }))).toBe(true);
});
test("resumed who/open answers are complete without manufacturing a prediction", () => {
  expect(questionAnswered({ ...q, kind: "who" }, answer({ whoUserId: "b" }))).toBe(true);
  expect(questionAnswered({ ...q, kind: "open" }, answer({ text: "   " }))).toBe(false);
  expect(questionAnswered({ ...q, kind: "open" }, answer({ text: "A walk" }))).toBe(true);
});
test("reports distinguish real answers and predictions and never label absent answers a match", () => {
  const a = answer({ choice: "tea", guess: "coffee" });
  expect(answerLabel(q, a, "choice", [])).toBe("Tea");
  expect(answerLabel(q, a, "guess", [])).toBe("Coffee");
  expect(answerAgreement(q, answer({}), answer({}))).toBeNull();
  expect(answerAgreement(q, a, answer({ choice: "coffee" }))).toBe(false);
  expect(answerAgreement(q, a, answer({ choice: "tea" }))).toBe(true);
  expect(answerAgreement({ ...q, kind: "open" }, a, a)).toBeNull();
});
test("who answers use actual member identity regardless of the viewer", () => {
  const people = [
    { id: "a", name: "Krishna" },
    { id: "b", name: "Ananya" },
  ];
  expect(answerLabel({ ...q, kind: "who" }, answer({ whoUserId: "b" }), "choice", people)).toBe("Ananya");
  expect(answerLabel({ ...q, kind: "who" }, answer({ whoUserId: "b" }), "choice", [...people].reverse())).toBe(
    "Ananya",
  );
});

test("restored edits reopen the question instead of sending an older saved version from review", () => {
  const saved = answer({ choice: "tea", guess: "coffee" });
  expect(resumeQuestionIndex([q], [saved], { q: { choice: "coffee", guess: "tea" } })).toBe(0);
  expect(resumeQuestionIndex([q], [saved], {})).toBe(1);
  expect(resumeQuestionIndex([q], [], {})).toBe(0);
  expect(resumeQuestionIndex([q], [saved], { removedQuestion: { choice: "tea" } })).toBe(1);
});
