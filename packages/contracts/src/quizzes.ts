import { z } from "zod";
import { LIMITS } from "./limits";

export const QuizCategory = z.enum(["about_me", "favorites", "personality", "relationship", "chaos", "daily"]);
export type QuizCategory = z.infer<typeof QuizCategory>;

export const QuestionKind = z.enum(["choice", "who", "open"]);
export type QuestionKind = z.infer<typeof QuestionKind>;

export const QuizOption = z.object({
  id: z.string().min(1).max(40),
  label: z.string().min(1).max(60),
  glyph: z.string().max(8).optional(),
});
export type QuizOption = z.infer<typeof QuizOption>;

/** Content (repo JSON → DB). Prompts may contain {partner}. */
export const QuestionContent = z
  .object({
    slug: z.string().regex(/^[a-z0-9-]+$/),
    kind: QuestionKind,
    promptSelf: z.string().min(3).max(140),
    promptGuess: z.string().min(3).max(140).optional(),
    options: z.array(QuizOption).min(2).max(6).optional(),
  })
  .refine((q) => q.kind !== "choice" || (q.options && q.promptGuess), "choice questions need options and promptGuess");
export type QuestionContent = z.infer<typeof QuestionContent>;

export const PackContent = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  category: QuizCategory.exclude(["daily"]),
  title: z.string().min(2).max(40),
  subtitle: z.string().min(2).max(80),
  sort: z.number().int(),
  questions: z.array(QuestionContent).min(3).max(12),
});
export type PackContent = z.infer<typeof PackContent>;

export const DailyPoolContent = z.object({ questions: z.array(QuestionContent).min(1) });

/** API shapes */
export const QuizQuestion = z.object({
  id: z.uuid(),
  kind: QuestionKind,
  promptSelf: z.string(),
  promptGuess: z.string().nullable(),
  options: z.array(QuizOption).nullable(),
});
export type QuizQuestion = z.infer<typeof QuizQuestion>;

export const QuizPackSummary = z.object({
  id: z.uuid(),
  slug: z.string(),
  category: QuizCategory,
  title: z.string(),
  subtitle: z.string(),
  questionCount: z.number(),
});
export type QuizPackSummary = z.infer<typeof QuizPackSummary>;

export const QuizAnswer = z.object({
  questionId: z.uuid(),
  choice: z.string().nullable(),
  guess: z.string().nullable(),
  whoUserId: z.uuid().nullable(),
  text: z.string().nullable(),
});
export type QuizAnswer = z.infer<typeof QuizAnswer>;

export const AnswerInput = z.object({
  choice: z.string().max(40).optional(),
  guess: z.string().max(40).optional(),
  who: z.enum(["me", "partner"]).optional(),
  text: z.string().trim().min(1).max(LIMITS.quizOpenAnswer.max).optional(),
});
export type AnswerInput = z.infer<typeof AnswerInput>;

export const QuizResultLabel = z.enum([
  "same_brain",
  "know_them_well",
  "surprisingly_similar",
  "still_learning",
  "opposites",
  "chaos_couple",
]);
export type QuizResultLabel = z.infer<typeof QuizResultLabel>;

export const QuizResult = z.object({
  label: QuizResultLabel,
  scored: z.number(),
  agreed: z.number(),
  myCorrectGuesses: z.number(),
  theirCorrectGuesses: z.number(),
});
export type QuizResult = z.infer<typeof QuizResult>;

export const QuizSession = z.object({
  id: z.uuid(),
  kind: z.enum(["pack", "daily"]),
  pack: QuizPackSummary.nullable(),
  dailyDate: z.string().nullable(),
  questions: z.array(QuizQuestion),
  myAnswers: z.array(QuizAnswer),
  myCompletedAt: z.string().nullable(),
  partnerAnsweredCount: z.number(),
  partnerCompletedAt: z.string().nullable(),
  /** Present only once BOTH have completed (server-enforced secrecy). */
  partnerAnswers: z.array(QuizAnswer).nullable(),
  result: QuizResult.nullable(),
  readyAt: z.string().nullable(),
  revealSeenAt: z.string().nullable(),
  createdAt: z.string(),
});
export type QuizSession = z.infer<typeof QuizSession>;

export const QuizSessionSummary = QuizSession.omit({ questions: true, myAnswers: true, partnerAnswers: true }).extend({
  questionCount: z.number(),
  myAnsweredCount: z.number(),
});
export type QuizSessionSummary = z.infer<typeof QuizSessionSummary>;

export const StartQuizInput = z.object({ id: z.uuid(), packId: z.uuid() });

export const RESULT_COPY: Record<QuizResultLabel, { title: string; line: string }> = {
  same_brain: { title: "Same brain", line: "Honestly, a little spooky." },
  know_them_well: { title: "You know each other well", line: "Paying attention pays off." },
  surprisingly_similar: { title: "Surprisingly similar", line: "More in common than you'd guess." },
  still_learning: { title: "Still learning each other", line: "The fun part — more to find out." },
  opposites: { title: "Opposites, apparently", line: "Keeps things interesting." },
  chaos_couple: { title: "Chaos couple", line: "No notes. Perfect as you are." },
};

type Side = Pick<QuizAnswer, "questionId" | "choice" | "guess" | "whoUserId">;

/**
 * Pure scoring (SPEC §4.2). Agreement only — never a "compatibility" claim.
 * choice: agree if both picked the same; guesses scored separately.
 * who: agree if both picked the same person. open: not scored.
 */
export function scoreQuiz(
  questions: Pick<QuizQuestion, "id" | "kind">[],
  mine: Side[],
  theirs: Side[],
  isChaos: boolean,
): QuizResult {
  const byQ = (list: Side[]) => new Map(list.map((a) => [a.questionId, a]));
  const m = byQ(mine);
  const t = byQ(theirs);
  let scored = 0;
  let agreed = 0;
  let myCorrectGuesses = 0;
  let theirCorrectGuesses = 0;
  for (const q of questions) {
    const a = m.get(q.id);
    const b = t.get(q.id);
    if (!a || !b || q.kind === "open") continue;
    scored++;
    if (q.kind === "choice") {
      if (a.choice && a.choice === b.choice) agreed++;
      if (a.guess && a.guess === b.choice) myCorrectGuesses++;
      if (b.guess && b.guess === a.choice) theirCorrectGuesses++;
    } else if (a.whoUserId && a.whoUserId === b.whoUserId) {
      agreed++;
    }
  }
  const choiceCount = questions.filter((q) => q.kind === "choice" && m.has(q.id) && t.has(q.id)).length;
  const understanding =
    scored === 0 ? 0 : (agreed + (myCorrectGuesses + theirCorrectGuesses) / 2) / (scored + choiceCount);
  const label: QuizResultLabel = isChaos
    ? "chaos_couple"
    : understanding >= 0.85
      ? "same_brain"
      : understanding >= 0.65
        ? "know_them_well"
        : understanding >= 0.45
          ? "surprisingly_similar"
          : understanding >= 0.25
            ? "still_learning"
            : "opposites";
  return { label, scored, agreed, myCorrectGuesses, theirCorrectGuesses };
}

export const withPartner = (prompt: string, partner: string) => prompt.replaceAll("{partner}", partner);
