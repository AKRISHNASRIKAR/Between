/**
 * Tables owned by Better Auth (plural model names). Field names must match what Better Auth expects.
 * `users` doubles as our profile table: `name` = display name, `image` = avatar.
 */
import { boolean, index, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createdAt, id, ts, updatedAt } from "./_columns";

export const users = pgTable("users", {
  id: id(),
  name: text().notNull().default(""),
  email: text().notNull().unique(),
  emailVerified: boolean().notNull().default(false),
  image: text(),
  timezone: text().notNull().default("UTC"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: id(),
    expiresAt: ts().notNull(),
    token: text().notNull().unique(),
    ipAddress: text(),
    userAgent: text(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index().on(t.userId)],
);

export const accounts = pgTable(
  "accounts",
  {
    id: id(),
    accountId: text().notNull(),
    providerId: text().notNull(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: ts(),
    refreshTokenExpiresAt: ts(),
    scope: text(),
    password: text(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index().on(t.userId)],
);

export const verifications = pgTable(
  "verifications",
  {
    id: id(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: ts().notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index().on(t.identifier)],
);
