import { sql } from "drizzle-orm";
import { check, date, index, integer, pgTable, text, unique, uuid } from "drizzle-orm/pg-core";
import { createdAt, ts, updatedAt } from "./_columns";
import { users } from "./auth";
import { spaces } from "./spaces";

export const moodCheckins = pgTable(
  "mood_checkins",
  {
    id: uuid().primaryKey(),
    spaceId: uuid()
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    localDate: date({ mode: "string" }).notNull(),
    mood: text().notNull(),
    note: text(),
    visibility: text({ enum: ["private", "shared"] })
      .notNull()
      .default("private"),
    sharedAt: ts(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    version: integer().notNull().default(0),
  },
  (t) => [
    unique("mood_one_per_day").on(t.spaceId, t.userId, t.localDate),
    index().on(t.spaceId, t.localDate.desc()),
    check("mood_visibility_ck", sql`(${t.visibility} = 'shared') = (${t.sharedAt} is not null)`),
    check("mood_note_len_ck", sql`${t.note} is null or length(${t.note}) <= 140`),
  ],
);
