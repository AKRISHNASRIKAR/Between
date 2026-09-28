import type { QuizAnswer, QuizPackSummary } from "@lovenotes/contracts";
import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import type { Tx } from "../../db/client";
import { quizAnswers, quizPacks, quizParticipants, quizQuestions, quizSessions } from "../../db/schema";
import type { SpaceScope } from "../../lib/scope";

export type SessionRow = typeof quizSessions.$inferSelect;
export type PackRow = typeof quizPacks.$inferSelect;
export type QuestionRow = typeof quizQuestions.$inferSelect;
export type AnswerValues = {
  choice: string | null;
  guess: string | null;
  whoUserId: string | null;
  textAnswer: string | null;
};

export const toPackSummary = (p: PackRow, count: number): QuizPackSummary => ({
  id: p.id,
  slug: p.slug,
  category: p.category as QuizPackSummary["category"],
  title: p.title,
  subtitle: p.subtitle,
  questionCount: count,
});

export const toAnswer = (a: typeof quizAnswers.$inferSelect): QuizAnswer => ({
  questionId: a.questionId,
  choice: a.choice,
  guess: a.guess,
  whoUserId: a.whoUserId,
  text: a.textAnswer,
});

/** The content library (global, published only). */
export const catalogRepo = {
  async packs(tx: Tx) {
    return tx
      .select({ pack: quizPacks, n: sql<number>`count(${quizQuestions.id})::int` })
      .from(quizPacks)
      .leftJoin(quizQuestions, and(eq(quizQuestions.packId, quizPacks.id), eq(quizQuestions.isPublished, true)))
      .where(eq(quizPacks.isPublished, true))
      .groupBy(quizPacks.id)
      .orderBy(asc(quizPacks.sort));
  },
  async pack(tx: Tx, id: string, opts: { publishedOnly?: boolean } = {}) {
    const [p] = await tx
      .select()
      .from(quizPacks)
      .where(and(eq(quizPacks.id, id), opts.publishedOnly ? eq(quizPacks.isPublished, true) : undefined));
    return p ?? null;
  },
  async packQuestionIds(tx: Tx, packId: string) {
    const rows = await tx
      .select({ id: quizQuestions.id })
      .from(quizQuestions)
      .where(and(eq(quizQuestions.packId, packId), eq(quizQuestions.isPublished, true)))
      .orderBy(asc(quizQuestions.position));
    return rows.map((r) => r.id);
  },
  async question(tx: Tx, id: string) {
    const [q] = await tx.select().from(quizQuestions).where(eq(quizQuestions.id, id));
    return q ?? null;
  },
  async questions(tx: Tx, ids: string[]) {
    return ids.length ? tx.select().from(quizQuestions).where(inArray(quizQuestions.id, ids)) : [];
  },
  /** A daily question this space hasn't had yet, in a stable per-space order; else any. */
  async nextDailyQuestionId(tx: Tx, scope: SpaceScope) {
    const [fresh] = await tx.execute<{ id: string }>(sql`
      select id from quiz_questions
      where is_daily and is_published
        and id not in (select unnest(question_ids) from quiz_sessions where space_id = ${scope.spaceId} and kind = 'daily')
      order by md5(${scope.spaceId} || id::text)
      limit 1`);
    if (fresh) return fresh.id;
    const [any] = await tx.execute<{ id: string }>(
      sql`select id from quiz_questions where is_daily and is_published order by random() limit 1`,
    );
    return any?.id ?? null;
  },
};

/** Quiz sessions, participants and answers, always within one space. */
export const sessionsRepo = {
  async find(tx: Tx, scope: SpaceScope, id: string, opts: { lock?: boolean } = {}) {
    const q = tx
      .select()
      .from(quizSessions)
      .where(and(eq(quizSessions.id, id), eq(quizSessions.spaceId, scope.spaceId)));
    const [row] = opts.lock ? await q.for("update") : await q;
    return row ?? null;
  },
  async activeForPack(tx: Tx, scope: SpaceScope, packId: string) {
    const [row] = await tx
      .select()
      .from(quizSessions)
      .where(
        and(
          eq(quizSessions.spaceId, scope.spaceId),
          eq(quizSessions.packId, packId),
          eq(quizSessions.kind, "pack"),
          isNull(quizSessions.readyAt),
        ),
      );
    return row ?? null;
  },
  async daily(tx: Tx, scope: SpaceScope, date: string) {
    const [row] = await tx
      .select()
      .from(quizSessions)
      .where(
        and(eq(quizSessions.spaceId, scope.spaceId), eq(quizSessions.kind, "daily"), eq(quizSessions.dailyDate, date)),
      );
    return row ?? null;
  },
  async packSessions(tx: Tx, scope: SpaceScope, limit = 50) {
    return tx
      .select()
      .from(quizSessions)
      .where(and(eq(quizSessions.spaceId, scope.spaceId), eq(quizSessions.kind, "pack")))
      .orderBy(desc(quizSessions.createdAt))
      .limit(limit);
  },
  /** Returns null when a session with this id (or this space's daily for the date) already exists. */
  async insert(
    tx: Tx,
    scope: SpaceScope,
    v: { id: string; kind: SessionRow["kind"]; packId?: string; dailyDate?: string; questionIds: string[] },
  ) {
    const [row] = await tx
      .insert(quizSessions)
      .values({ ...v, spaceId: scope.spaceId, startedBy: scope.userId })
      .onConflictDoNothing()
      .returning();
    return row ?? null;
  },
  async markReady(tx: Tx, scope: SpaceScope, id: string, at: Date) {
    const [row] = await tx
      .update(quizSessions)
      .set({ readyAt: at })
      .where(and(eq(quizSessions.id, id), eq(quizSessions.spaceId, scope.spaceId)))
      .returning();
    return row ?? null;
  },

  async addParticipants(tx: Tx, scope: SpaceScope, sessionId: string, userIds: string[]) {
    if (!userIds.length) return;
    await tx
      .insert(quizParticipants)
      .values(userIds.map((userId) => ({ sessionId, spaceId: scope.spaceId, userId })))
      .onConflictDoNothing();
  },
  async participants(tx: Tx, sessionId: string) {
    return tx.select().from(quizParticipants).where(eq(quizParticipants.sessionId, sessionId));
  },
  async markCompleted(tx: Tx, scope: SpaceScope, sessionId: string, at: Date) {
    await tx
      .update(quizParticipants)
      .set({ completedAt: at })
      .where(
        and(
          eq(quizParticipants.sessionId, sessionId),
          eq(quizParticipants.userId, scope.userId),
          isNull(quizParticipants.completedAt),
        ),
      );
  },
  async markRevealSeen(tx: Tx, scope: SpaceScope, sessionId: string) {
    await tx
      .update(quizParticipants)
      .set({ revealSeenAt: new Date() })
      .where(and(eq(quizParticipants.sessionId, sessionId), eq(quizParticipants.userId, scope.userId)));
  },

  async answers(tx: Tx, sessionId: string) {
    return tx.select().from(quizAnswers).where(eq(quizAnswers.sessionId, sessionId));
  },
  async saveAnswer(tx: Tx, scope: SpaceScope, sessionId: string, questionId: string, values: AnswerValues) {
    await tx
      .insert(quizAnswers)
      .values({ sessionId, spaceId: scope.spaceId, questionId, userId: scope.userId, ...values })
      .onConflictDoUpdate({ target: [quizAnswers.sessionId, quizAnswers.questionId, quizAnswers.userId], set: values });
  },
};
