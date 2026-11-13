import type { AnswerInput, QuizAnswer, QuizQuestion } from "@lovenotes/contracts";

export function questionAnswered(q: QuizQuestion, answer: QuizAnswer | undefined) {
  if (!answer) return false;
  if (q.kind === "choice") return !!answer.choice && !!answer.guess;
  if (q.kind === "who") return !!answer.whoUserId;
  return !!answer.text?.trim();
}

export function answerLabel(
  q: QuizQuestion,
  a: QuizAnswer | undefined,
  field: "choice" | "guess",
  people: { id: string; name: string }[],
) {
  if (!a) return "Not answered";
  if (q.kind === "open") return a.text ?? "Not answered";
  if (q.kind === "who") return people.find((p) => p.id === a.whoUserId)?.name ?? "Not answered";
  const option = q.options?.find((o) => o.id === a[field]);
  return option ? `${option.glyph ? `${option.glyph} ` : ""}${option.label}` : "Not selected";
}

export function answerAgreement(q: QuizQuestion, a: QuizAnswer | undefined, b: QuizAnswer | undefined) {
  if (!a || !b || q.kind === "open") return null;
  if (q.kind === "who") return a.whoUserId && b.whoUserId ? a.whoUserId === b.whoUserId : null;
  return a.choice && b.choice ? a.choice === b.choice : null;
}

/** A restored edit must be revisited even if an earlier version is already saved on the server. */
export function resumeQuestionIndex(
  questions: QuizQuestion[],
  answers: QuizAnswer[],
  picks: Record<string, AnswerInput>,
) {
  const saved = new Map(answers.map((answer) => [answer.questionId, answer]));
  const first = questions.findIndex(
    (question) => Object.hasOwn(picks, question.id) || !questionAnswered(question, saved.get(question.id)),
  );
  return first < 0 ? questions.length : first;
}
