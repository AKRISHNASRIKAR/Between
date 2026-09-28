import { sql } from "drizzle-orm";
import { check, index, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createdAt, ts, updatedAt } from "./_columns";
import { users } from "./auth";
import { spaces } from "./spaces";

export const notes = pgTable(
  "notes",
  {
    id: uuid().primaryKey(),
    spaceId: uuid()
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    authorId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Nullable: if the recipient deletes their account, the author keeps their own words.
    recipientId: uuid().references(() => users.id, { onDelete: "set null" }),
    body: text().notNull(),
    paper: text({ enum: ["cream", "blush", "kraft", "sky"] })
      .notNull()
      .default("cream"),
    unlockAt: ts(),
    unlockLabel: text(),
    openedAt: ts(),
    reactedAt: ts(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    deletedAt: ts(),
  },
  (t) => [
    index().on(t.spaceId, t.createdAt.desc()).where(sql`${t.deletedAt} is null`),
    index("notes_waiting_idx")
      .on(t.spaceId, t.recipientId)
      .where(sql`${t.openedAt} is null and ${t.deletedAt} is null`),
    check("notes_body_len_ck", sql`length(${t.body}) between 1 and 500`),
    check("notes_not_self_ck", sql`${t.authorId} <> ${t.recipientId}`),
  ],
);
