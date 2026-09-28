import { boolean, index, pgTable, text, time, uuid } from "drizzle-orm/pg-core";
import { createdAt, ts } from "./_columns";
import { users } from "./auth";

export const pushTokens = pgTable(
  "push_tokens",
  {
    token: text().primaryKey(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    platform: text({ enum: ["ios", "android"] }).notNull(),
    createdAt: createdAt(),
    lastSeenAt: ts().notNull().defaultNow(),
  },
  (t) => [index().on(t.userId)],
);

export const notificationPrefs = pgTable("notification_prefs", {
  userId: uuid()
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  notes: boolean().notNull().default(true),
  vibes: boolean().notNull().default(true),
  quizzes: boolean().notNull().default(true),
  journal: boolean().notNull().default(true),
  future: boolean().notNull().default(true),
  /** Column keeps its original name; the product term is "pet updates". */
  petUpdates: boolean("pet_greeting").notNull().default(false),
  quietStart: time(),
  quietEnd: time(),
});
