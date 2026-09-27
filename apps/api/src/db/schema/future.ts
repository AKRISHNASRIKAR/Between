import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createdAt, ts, updatedAt } from "./_columns";
import { users } from "./auth";
import { spaces } from "./spaces";

export const futureItems = pgTable(
  "future_items",
  {
    id: uuid().primaryKey(),
    spaceId: uuid()
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    title: text().notNull(),
    emoji: text(),
    note: text(),
    category: text({ enum: ["dream", "place", "watch", "try", "goal"] })
      .notNull()
      .default("dream"),
    position: text().notNull(),
    createdBy: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    completedAt: ts(),
    completedBy: uuid().references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    version: integer().notNull().default(0),
    deletedAt: ts(),
  },
  (t) => [
    index().on(t.spaceId, t.position).where(sql`${t.deletedAt} is null`),
    check("future_title_len_ck", sql`length(${t.title}) between 1 and 120`),
    check("future_completed_ck", sql`(${t.completedAt} is null) = (${t.completedBy} is null)`),
  ],
);
