import {
  type AnswerInput,
  type Notice,
  type QuizPackSummary,
  type QuizQuestion,
  type QuizSession,
  type QuizSessionSummary,
  scoreQuiz,
} from "@lovenotes/contracts";
import type { Tx } from "../../db/client";
import { AppError, conflict, notFound } from "../../lib/errors";
import { assertWritable, type SpaceScope } from "../../lib/scope";
import { localDate } from "../../lib/time";
import { withTx } from "../../lib/tx";
import { publish } from "../../realtime/hub";
import { displayName, membersRepo } from "../members";
import { notifyPartner } from "../notifications";
import { announcePet, growPet, type PetOutcome, petNameFor } from "../pet";
import { spaceTimezone } from "../spaces";
import { type AnswerValues, catalogRepo, type SessionRow, sessionsRepo, toAnswer, toPackSummary } from "./quizzes.repo";

const updated = (scope: SpaceScope, sessionId: string) => publish(scope.spaceId, { t: "quiz.updated", sessionId });

async function mustFind(tx: Tx, scope: SpaceScope, id: string, opts: { lock?: boolean } = {}) {
  const s = await sessionsRepo.find(tx, scope, id, opts);
  if (!s) throw notFound();
  return s;
}

/** Everyone currently in the space plays (one Quiz session covers both Members). */
async function enrol(tx: Tx, scope: SpaceScope, sessionId: string) {
  const members = await membersRepo.of(tx, scope);
  await sessionsRepo.addParticipants(
    tx,
    scope,
    sessionId,
    members.filter((m) => !m.leftAt).map((m) => m.id),
  );
}

/**
 * A session as the caller sees it. The partner's answers are only in the payload once the
 * Reveal is ready — before that the client can't see them, not even by inspecting traffic.
 */
async function view(tx: Tx, scope: SpaceScope, s: SessionRow): Promise<QuizSession> {
  const order = new Map(s.questionIds.map((id, i) => [id, i]));
  const questions: QuizQuestion[] = (await catalogRepo.questions(tx, s.questionIds))
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
    .map((q) => ({
      id: q.id,
      kind: q.kind,
      promptSelf: q.promptSelf,
      promptGuess: q.promptGuess,
      options: q.options ?? null,
    }));

  const answers = await sessionsRepo.answers(tx, s.id);
  const parts = await sessionsRepo.participants(tx, s.id);
  const mine = answers.filter((a) => a.userId === scope.userId).map(toAnswer);
  const theirsRaw = answers.filter((a) => a.userId !== scope.userId);
  const me = parts.find((p) => p.userId === scope.userId);
  const them = parts.find((p) => p.userId !== scope.userId);
  const pack = s.packId ? await catalogRepo.pack(tx, s.packId) : null;
  const theirs = s.readyAt ? theirsRaw.map(toAnswer) : null;

  return {
    id: s.id,
    kind: s.kind,
    pack: pack ? toPackSummary(pack, questions.length) : null,
    dailyDate: s.dailyDate,
    questions,
    myAnswers: mine,
    myCompletedAt: me?.completedAt?.toISOString() ?? null,
    partnerAnsweredCount: theirsRaw.length,
    partnerCompletedAt: them?.completedAt?.toISOString() ?? null,
    partnerAnswers: theirs,
    result: theirs ? scoreQuiz(questions, mine, theirs, pack?.category === "chaos") : null,
    readyAt: s.readyAt?.toISOString() ?? null,
    revealSeenAt: me?.revealSeenAt?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
  };
}

export async function listPacks(tx: Tx): Promise<QuizPackSummary[]> {
  return (await catalogRepo.packs(tx)).map((r) => toPackSummary(r.pack, r.n));
}

/** Start a pack, or resume the one already open: one active session per pack per space. */
export async function startPack(scope: SpaceScope, input: { id: string; packId: string }): Promise<QuizSession> {
  assertWritable(scope);
  if (!scope.partnerId) throw conflict("NOT_IN_SPACE", "Quizzes need both of you.");
  const r = await withTx(async (tx) => {
    const pack = await catalogRepo.pack(tx, input.packId, { publishedOnly: true });
    if (!pack) throw notFound();
    const active = await sessionsRepo.activeForPack(tx, scope, pack.id);
    if (active) return { session: await view(tx, scope, active), notice: null };

    const s = await sessionsRepo.insert(tx, scope, {
      id: input.id,
      kind: "pack",
      packId: pack.id,
      questionIds: await catalogRepo.packQuestionIds(tx, pack.id),
    });
    if (!s) return { session: await view(tx, scope, await mustFind(tx, scope, input.id)), notice: null };
    await enrol(tx, scope, s.id);
    const from = displayName(await membersRepo.of(tx, scope), scope.userId);
    const notice: Notice = { type: "quiz.started", sessionId: s.id, from, packTitle: pack.title };
    return { session: await view(tx, scope, s), notice, petName: await petNameFor(tx, scope) };
  });
  if (r.notice) {
    updated(scope, r.session.id);
    await notifyPartner(scope, r.notice, r.petName);
  }
  return r.session;
}

/** Today's Daily question (the space's "today"), created on first look and shared by both. */
export async function getDaily(scope: SpaceScope): Promise<QuizSession | null> {
  if (!scope.partnerId) return null;
  return withTx(async (tx) => {
    const today = localDate(new Date(), await spaceTimezone(tx, scope));
    const existing = await sessionsRepo.daily(tx, scope, today);
    if (existing) return view(tx, scope, existing);
    if (!scope.writable) return null;

    const questionId = await catalogRepo.nextDailyQuestionId(tx, scope);
    if (!questionId) return null;
    // Both members may open Today at once: the unique (space, daily date) index picks one winner.
    const s =
      (await sessionsRepo.insert(tx, scope, {
        id: crypto.randomUUID(),
        kind: "daily",
        dailyDate: today,
        questionIds: [questionId],
      })) ?? (await sessionsRepo.daily(tx, scope, today));
    if (!s) return null;
    await enrol(tx, scope, s.id);
    return view(tx, scope, s);
  });
}

export async function getSession(scope: SpaceScope, sessionId: string): Promise<QuizSession> {
  return withTx(async (tx) => view(tx, scope, await mustFind(tx, scope, sessionId)));
}

export async function listSessions(scope: SpaceScope): Promise<QuizSessionSummary[]> {
  return withTx(async (tx) => {
    const out: QuizSessionSummary[] = [];
    for (const r of await sessionsRepo.packSessions(tx, scope)) {
      const { questions, myAnswers, partnerAnswers: _hidden, ...rest } = await view(tx, scope, r);
      out.push({ ...rest, questionCount: questions.length, myAnsweredCount: myAnswers.length });
    }
    return out;
  });
}

/** Check an answer against its question and turn it into stored values. */
function answerValues(
  scope: SpaceScope,
  q: NonNullable<Awaited<ReturnType<typeof catalogRepo.question>>>,
  input: AnswerInput,
): AnswerValues {
  const bad = (msg: string) => new AppError("VALIDATION_FAILED", 422, msg);
  const none = { choice: null, guess: null, whoUserId: null, textAnswer: null };
  if (q.kind === "choice") {
    const ids = new Set((q.options ?? []).map((o) => o.id));
    if (!input.choice || !ids.has(input.choice)) throw bad("Pick one of the options.");
    if (input.guess && !ids.has(input.guess)) throw bad("Pick one of the options.");
    return { ...none, choice: input.choice, guess: input.guess ?? null };
  }
  if (q.kind === "who") {
    if (!input.who) throw bad("Pick one of you.");
    return { ...none, whoUserId: input.who === "me" ? scope.userId : scope.partnerId };
  }
  if (!input.text) throw bad("Write a few words.");
  return { ...none, textAnswer: input.text };
}

/** Save one answer. Editable until you send your answers; locked after. */
export async function answer(
  scope: SpaceScope,
  sessionId: string,
  questionId: string,
  input: AnswerInput,
): Promise<QuizSession> {
  assertWritable(scope);
  const session = await withTx(async (tx) => {
    const s = await mustFind(tx, scope, sessionId, { lock: true });
    if (!s.questionIds.includes(questionId)) throw notFound();
    const me = (await sessionsRepo.participants(tx, s.id)).find((p) => p.userId === scope.userId);
    if (!me) throw notFound();
    if (me.completedAt) throw conflict("FORBIDDEN_ACTION", "You've already finished this one.");
    const q = await catalogRepo.question(tx, questionId);
    if (!q) throw notFound();
    await sessionsRepo.saveAnswer(tx, scope, s.id, questionId, answerValues(scope, q, input));
    return view(tx, scope, s);
  });
  updated(scope, sessionId);
  return session;
}

/** Send your answers. When both have, the Reveal unlocks for both in the same transaction. */
export async function complete(scope: SpaceScope, sessionId: string): Promise<QuizSession> {
  assertWritable(scope);
  const r = await withTx(async (tx) => {
    const s = await mustFind(tx, scope, sessionId, { lock: true });
    const answered = new Set(
      (await sessionsRepo.answers(tx, s.id)).filter((a) => a.userId === scope.userId).map((a) => a.questionId),
    );
    if (!s.questionIds.every((q) => answered.has(q)))
      throw new AppError("VALIDATION_FAILED", 422, "Answer every question first.");

    const now = new Date();
    await sessionsRepo.markCompleted(tx, scope, s.id, now);
    const parts = await sessionsRepo.participants(tx, s.id);
    const readyNow = !s.readyAt && parts.length >= 2 && parts.every((p) => p.completedAt);

    let row = s;
    let pet: PetOutcome | null = null;
    if (readyNow) {
      row = (await sessionsRepo.markReady(tx, scope, s.id, now)) ?? s;
      pet = await growPet(tx, scope, s.kind === "daily" ? "daily.answered_both" : "quiz.completed_both", s.id);
    }
    const daily = s.kind === "daily";
    const from = displayName(await membersRepo.of(tx, scope), scope.userId);
    const notice: Notice | null = readyNow
      ? { type: "quiz.ready", sessionId: s.id, daily }
      : s.readyAt
        ? null
        : { type: "quiz.your_turn", sessionId: s.id, from, daily };
    return { session: await view(tx, scope, row), pet, notice, petName: await petNameFor(tx, scope) };
  });
  updated(scope, sessionId);
  await announcePet(scope, r.pet);
  if (r.notice) await notifyPartner(scope, r.notice, r.petName);
  return r.session;
}

export async function markRevealSeen(scope: SpaceScope, sessionId: string): Promise<void> {
  await withTx(async (tx) => {
    const s = await mustFind(tx, scope, sessionId);
    if (s.readyAt) await sessionsRepo.markRevealSeen(tx, scope, s.id);
  });
}
