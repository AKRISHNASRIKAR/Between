import {
  type AnswerInput,
  type QuizAnswer,
  type QuizPackSummary,
  type QuizQuestion,
  type QuizSession,
  type QuizSessionSummary,
  scoreQuiz,
} from "@lovenotes/contracts";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import type { Tx } from "../../db/client";
import {
  quizAnswers,
  quizPacks,
  quizParticipants,
  quizQuestions,
  quizSessions,
  spaceMembers,
  spaces,
  users,
} from "../../db/schema";
import { AppError, conflict, notFound } from "../../lib/errors";
import type { SpaceScope } from "../../lib/scope";
import { localDate } from "../../lib/time";
import { withTx } from "../../lib/tx";
import { activity } from "../activity/service";
import { sendPush } from "../notifications/service";
import { assertWritable } from "../spaces/service";

type SessionRow = typeof quizSessions.$inferSelect;
type PackRow = typeof quizPacks.$inferSelect;

const packDto = (p: PackRow, count: number): QuizPackSummary => ({
  id: p.id,
  slug: p.slug,
  category: p.category as QuizPackSummary["category"],
  title: p.title,
  subtitle: p.subtitle,
  questionCount: count,
});

export async function listPacks(tx: Tx): Promise<QuizPackSummary[]> {
  const rows = await tx
    .select({ pack: quizPacks, n: sql<number>`count(${quizQuestions.id})::int` })
    .from(quizPacks)
    .leftJoin(quizQuestions, and(eq(quizQuestions.packId, quizPacks.id), eq(quizQuestions.isPublished, true)))
    .where(eq(quizPacks.isPublished, true))
    .groupBy(quizPacks.id)
    .orderBy(asc(quizPacks.sort));
  return rows.map((r) => packDto(r.pack, r.n));
}

async function findSession(tx: Tx, scope: SpaceScope, sessionId: string, lock = false) {
  const q = tx
    .select()
    .from(quizSessions)
    .where(and(eq(quizSessions.id, sessionId), eq(quizSessions.spaceId, scope.spaceId)));
  const [row] = lock ? await q.for("update") : await q;
  if (!row) throw notFound();
  return row;
}

const answerDto = (a: typeof quizAnswers.$inferSelect): QuizAnswer => ({
  questionId: a.questionId,
  choice: a.choice,
  guess: a.guess,
  whoUserId: a.whoUserId,
  text: a.textAnswer,
});

/** Assemble a session for the caller. Partner answers exist in the payload ONLY once ready. */
async function loadSession(tx: Tx, scope: SpaceScope, s: SessionRow): Promise<QuizSession> {
  const qs = await tx.select().from(quizQuestions).where(inArray(quizQuestions.id, s.questionIds));
  const order = new Map(s.questionIds.map((id, i) => [id, i]));
  qs.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  const questions: QuizQuestion[] = qs.map((q) => ({
    id: q.id,
    kind: q.kind,
    promptSelf: q.promptSelf,
    promptGuess: q.promptGuess,
    options: q.options ?? null,
  }));

  const answers = await tx.select().from(quizAnswers).where(eq(quizAnswers.sessionId, s.id));
  const parts = await tx.select().from(quizParticipants).where(eq(quizParticipants.sessionId, s.id));
  const mine = answers.filter((a) => a.userId === scope.userId).map(answerDto);
  const theirsRaw = answers.filter((a) => a.userId !== scope.userId);
  const me = parts.find((p) => p.userId === scope.userId);
  const them = parts.find((p) => p.userId !== scope.userId);

  const pack = s.packId ? (await tx.select().from(quizPacks).where(eq(quizPacks.id, s.packId)))[0] : undefined;
  const ready = !!s.readyAt;
  const theirs = ready ? theirsRaw.map(answerDto) : null;

  return {
    id: s.id,
    kind: s.kind,
    pack: pack ? packDto(pack, questions.length) : null,
    dailyDate: s.dailyDate,
    questions,
    myAnswers: mine,
    myCompletedAt: me?.completedAt?.toISOString() ?? null,
    partnerAnsweredCount: theirsRaw.length,
    partnerCompletedAt: them?.completedAt?.toISOString() ?? null,
    partnerAnswers: theirs,
    result: ready && theirs ? scoreQuiz(questions, mine, theirs, pack?.category === "chaos") : null,
    readyAt: s.readyAt?.toISOString() ?? null,
    revealSeenAt: me?.revealSeenAt?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
  };
}

async function addParticipants(tx: Tx, scope: SpaceScope, sessionId: string) {
  const members = await tx
    .select({ userId: spaceMembers.userId })
    .from(spaceMembers)
    .where(and(eq(spaceMembers.spaceId, scope.spaceId), sql`${spaceMembers.leftAt} is null`));
  await tx
    .insert(quizParticipants)
    .values(members.map((m) => ({ sessionId, spaceId: scope.spaceId, userId: m.userId })))
    .onConflictDoNothing();
}

/** Start (or resume) a pack. One active session per pack per space. */
export async function startPack(scope: SpaceScope, input: { id: string; packId: string }): Promise<QuizSession> {
  assertWritable(scope);
  if (!scope.partnerId) throw conflict("NOT_IN_SPACE", "Quizzes need both of you.");
  return withTx(async (tx, after) => {
    const [pack] = await tx
      .select()
      .from(quizPacks)
      .where(and(eq(quizPacks.id, input.packId), eq(quizPacks.isPublished, true)));
    if (!pack) throw notFound();
    const [active] = await tx
      .select()
      .from(quizSessions)
      .where(
        and(
          eq(quizSessions.spaceId, scope.spaceId),
          eq(quizSessions.packId, pack.id),
          eq(quizSessions.kind, "pack"),
          sql`${quizSessions.readyAt} is null`,
        ),
      );
    if (active) return loadSession(tx, scope, active);

    const qs = await tx
      .select({ id: quizQuestions.id })
      .from(quizQuestions)
      .where(and(eq(quizQuestions.packId, pack.id), eq(quizQuestions.isPublished, true)))
      .orderBy(asc(quizQuestions.position));
    const [s] = await tx
      .insert(quizSessions)
      .values({
        id: input.id,
        spaceId: scope.spaceId,
        packId: pack.id,
        kind: "pack",
        questionIds: qs.map((q) => q.id),
        startedBy: scope.userId,
      })
      .returning();
    if (!s) throw new AppError("INTERNAL", 500);
    await addParticipants(tx, scope, s.id);
    const [me] = await tx.select({ name: users.name }).from(users).where(eq(users.id, scope.userId));
    const partnerId = scope.partnerId;
    after(async () => {
      activity.broadcast(scope.spaceId, { t: "quiz.updated", sessionId: s.id });
      if (partnerId)
        await sendPush(partnerId, {
          kind: "quizzes",
          title: "A quiz for two",
          body: `${me?.name || "Your person"} started “${pack.title}”`,
          url: `/quiz/${s.id}`,
        });
    });
    return loadSession(tx, scope, s);
  });
}

/** Today's daily question for the space (created lazily; the same for both of you). */
export async function getDaily(scope: SpaceScope): Promise<QuizSession | null> {
  if (!scope.partnerId) return null;
  return withTx(async (tx) => {
    const [space] = await tx.select({ tz: spaces.timezone }).from(spaces).where(eq(spaces.id, scope.spaceId));
    const today = localDate(new Date(), space?.tz ?? "UTC");
    const [existing] = await tx
      .select()
      .from(quizSessions)
      .where(
        and(eq(quizSessions.spaceId, scope.spaceId), eq(quizSessions.kind, "daily"), eq(quizSessions.dailyDate, today)),
      );
    if (existing) return loadSession(tx, scope, existing);
    if (!scope.writable) return null;

    // Deterministic, non-repeating pick for this space.
    const [q] = await tx.execute<{ id: string }>(sql`
      select id from quiz_questions
      where is_daily and is_published
        and id not in (select unnest(question_ids) from quiz_sessions where space_id = ${scope.spaceId} and kind = 'daily')
      order by md5(${scope.spaceId} || id::text)
      limit 1`);
    const fallback =
      q ??
      (
        await tx.execute<{ id: string }>(
          sql`select id from quiz_questions where is_daily and is_published order by random() limit 1`,
        )
      )[0];
    if (!fallback) return null;
    const inserted = await tx
      .insert(quizSessions)
      .values({
        id: crypto.randomUUID(),
        spaceId: scope.spaceId,
        kind: "daily",
        questionIds: [fallback.id],
        dailyDate: today,
        startedBy: scope.userId,
      })
      .onConflictDoNothing()
      .returning();
    const s =
      inserted[0] ??
      (
        await tx
          .select()
          .from(quizSessions)
          .where(
            and(
              eq(quizSessions.spaceId, scope.spaceId),
              eq(quizSessions.kind, "daily"),
              eq(quizSessions.dailyDate, today),
            ),
          )
      )[0];
    if (!s) return null;
    await addParticipants(tx, scope, s.id);
    return loadSession(tx, scope, s);
  });
}

export async function getSession(scope: SpaceScope, sessionId: string): Promise<QuizSession> {
  return withTx(async (tx) => loadSession(tx, scope, await findSession(tx, scope, sessionId)));
}

export async function listSessions(scope: SpaceScope): Promise<QuizSessionSummary[]> {
  return withTx(async (tx) => {
    const rows = await tx
      .select()
      .from(quizSessions)
      .where(and(eq(quizSessions.spaceId, scope.spaceId), eq(quizSessions.kind, "pack")))
      .orderBy(desc(quizSessions.createdAt))
      .limit(50);
    const out: QuizSessionSummary[] = [];
    for (const r of rows) {
      const { questions, myAnswers, partnerAnswers: _p, ...rest } = await loadSession(tx, scope, r);
      out.push({ ...rest, questionCount: questions.length, myAnsweredCount: myAnswers.length });
    }
    return out;
  });
}

/** Save one answer. Editable until you complete the quiz; never after. */
export async function answer(
  scope: SpaceScope,
  sessionId: string,
  questionId: string,
  input: AnswerInput,
): Promise<QuizSession> {
  assertWritable(scope);
  return withTx(async (tx, after) => {
    const s = await findSession(tx, scope, sessionId, true);
    if (!s.questionIds.includes(questionId)) throw notFound();
    const [me] = await tx
      .select()
      .from(quizParticipants)
      .where(and(eq(quizParticipants.sessionId, s.id), eq(quizParticipants.userId, scope.userId)));
    if (!me) throw notFound();
    if (me.completedAt) throw conflict("FORBIDDEN_ACTION", "You've already finished this one.");
    const [q] = await tx.select().from(quizQuestions).where(eq(quizQuestions.id, questionId));
    if (!q) throw notFound();

    const bad = (msg: string) => new AppError("VALIDATION_FAILED", 422, msg);
    const optionIds = new Set((q.options ?? []).map((o) => o.id));
    let values: { choice: string | null; guess: string | null; whoUserId: string | null; textAnswer: string | null };
    if (q.kind === "choice") {
      if (!input.choice || !optionIds.has(input.choice)) throw bad("Pick one of the options.");
      if (input.guess && !optionIds.has(input.guess)) throw bad("Pick one of the options.");
      values = { choice: input.choice, guess: input.guess ?? null, whoUserId: null, textAnswer: null };
    } else if (q.kind === "who") {
      if (!input.who) throw bad("Pick one of you.");
      values = {
        choice: null,
        guess: null,
        whoUserId: input.who === "me" ? scope.userId : scope.partnerId,
        textAnswer: null,
      };
    } else {
      if (!input.text) throw bad("Write a few words.");
      values = { choice: null, guess: null, whoUserId: null, textAnswer: input.text };
    }

    await tx
      .insert(quizAnswers)
      .values({ sessionId: s.id, spaceId: scope.spaceId, questionId, userId: scope.userId, ...values })
      .onConflictDoUpdate({ target: [quizAnswers.sessionId, quizAnswers.questionId, quizAnswers.userId], set: values });
    after(() => activity.broadcast(scope.spaceId, { t: "quiz.updated", sessionId: s.id }));
    return loadSession(tx, scope, s);
  });
}

/** Finish your side. When both are done, the reveal unlocks for both (atomically). */
export async function complete(scope: SpaceScope, sessionId: string): Promise<QuizSession> {
  assertWritable(scope);
  return withTx(async (tx, after) => {
    const s = await findSession(tx, scope, sessionId, true);
    const answered = await tx
      .select({ q: quizAnswers.questionId })
      .from(quizAnswers)
      .where(and(eq(quizAnswers.sessionId, s.id), eq(quizAnswers.userId, scope.userId)));
    const answeredSet = new Set(answered.map((a) => a.q));
    if (!s.questionIds.every((q) => answeredSet.has(q))) {
      throw new AppError("VALIDATION_FAILED", 422, "Answer every question first.");
    }
    const now = new Date();
    await tx
      .update(quizParticipants)
      .set({ completedAt: now })
      .where(
        and(
          eq(quizParticipants.sessionId, s.id),
          eq(quizParticipants.userId, scope.userId),
          sql`${quizParticipants.completedAt} is null`,
        ),
      );
    const parts = await tx.select().from(quizParticipants).where(eq(quizParticipants.sessionId, s.id));
    const bothDone = parts.length >= 2 && parts.every((p) => p.completedAt);
    let row = s;
    let pet = null;
    if (bothDone && !s.readyAt) {
      const [u] = await tx.update(quizSessions).set({ readyAt: now }).where(eq(quizSessions.id, s.id)).returning();
      if (u) row = u;
      pet = await activity.award(tx, scope, s.kind === "daily" ? "daily.answered_both" : "quiz.completed_both", s.id);
    }
    const [me] = await tx.select({ name: users.name }).from(users).where(eq(users.id, scope.userId));
    const partnerId = scope.partnerId;
    const readyNow = bothDone && !s.readyAt;
    after(async () => {
      activity.broadcast(scope.spaceId, { t: "quiz.updated", sessionId: s.id });
      if (pet) activity.broadcast(scope.spaceId, { t: "pet.updated", pet });
      if (partnerId)
        await sendPush(partnerId, {
          kind: "quizzes",
          title: readyNow ? "Ready to reveal ✦" : "Your turn",
          body: readyNow
            ? "You've both answered — see how you match."
            : `${me?.name || "Your person"} has answered. Your turn!`,
          url: s.kind === "daily" ? "/daily" : `/quiz/${s.id}`,
        });
    });
    return loadSession(tx, scope, row);
  });
}

export async function markRevealSeen(scope: SpaceScope, sessionId: string): Promise<void> {
  await withTx(async (tx) => {
    const s = await findSession(tx, scope, sessionId);
    if (!s.readyAt) return;
    await tx
      .update(quizParticipants)
      .set({ revealSeenAt: new Date() })
      .where(and(eq(quizParticipants.sessionId, s.id), eq(quizParticipants.userId, scope.userId)));
  });
}
