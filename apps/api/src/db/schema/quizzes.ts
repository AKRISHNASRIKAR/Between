import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createdAt, id, ts } from "./_columns";
import { users } from "./auth";
import { spaces } from "./spaces";

/** Content (global, synced from /content/quizzes). */
export const quizPacks = pgTable("quiz_packs", {
  id: id(),
  slug: text().notNull().unique(),
  category: text().notNull(),
  title: text().notNull(),
  subtitle: text().notNull(),
  sort: integer().notNull().default(0),
  isPublished: boolean().notNull().default(true),
});

export const quizQuestions = pgTable(
  "quiz_questions",
  {
    id: id(),
    slug: text().notNull().unique(),
    packId: uuid().references(() => quizPacks.id, { onDelete: "set null" }),
    kind: text({ enum: ["choice", "who", "open"] }).notNull(),
    promptSelf: text().notNull(),
    promptGuess: text(),
    options: jsonb().$type<Array<{ id: string; label: string; glyph?: string }>>(),
    position: integer().notNull().default(0),
    isDaily: boolean().notNull().default(false),
    isPublished: boolean().notNull().default(true),
  },
  (t) => [index().on(t.packId, t.position)],
);

/** Per-space play. question_ids is a snapshot taken at start. */
export const quizSessions = pgTable(
  "quiz_sessions",
  {
    id: uuid().primaryKey(),
    spaceId: uuid()
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    packId: uuid().references(() => quizPacks.id),
    kind: text({ enum: ["pack", "daily"] }).notNull(),
    questionIds: uuid().array().notNull(),
    dailyDate: date({ mode: "string" }),
    startedBy: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    readyAt: ts(),
    createdAt: createdAt(),
  },
  (t) => [
    unique("quiz_sessions_id_space_uq").on(t.id, t.spaceId),
    uniqueIndex("one_daily_per_day").on(t.spaceId, t.dailyDate).where(sql`${t.kind} = 'daily'`),
    uniqueIndex("one_active_pack").on(t.spaceId, t.packId).where(sql`${t.kind} = 'pack' and ${t.readyAt} is null`),
    index().on(t.spaceId, t.createdAt.desc()),
  ],
);

export const quizParticipants = pgTable(
  "quiz_participants",
  {
    sessionId: uuid().notNull(),
    spaceId: uuid().notNull(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    completedAt: ts(),
    revealSeenAt: ts(),
  },
  (t) => [
    primaryKey({ columns: [t.sessionId, t.userId] }),
    foreignKey({ columns: [t.sessionId, t.spaceId], foreignColumns: [quizSessions.id, quizSessions.spaceId] }).onDelete(
      "cascade",
    ),
  ],
);

export const quizAnswers = pgTable(
  "quiz_answers",
  {
    sessionId: uuid().notNull(),
    spaceId: uuid().notNull(),
    questionId: uuid()
      .notNull()
      .references(() => quizQuestions.id),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    choice: text(),
    guess: text(),
    whoUserId: uuid(),
    textAnswer: text(),
    answeredAt: createdAt(),
  },
  (t) => [
    primaryKey({ columns: [t.sessionId, t.questionId, t.userId] }),
    foreignKey({ columns: [t.sessionId, t.spaceId], foreignColumns: [quizSessions.id, quizSessions.spaceId] }).onDelete(
      "cascade",
    ),
  ],
);
