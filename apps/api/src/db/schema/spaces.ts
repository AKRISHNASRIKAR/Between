import { sql } from "drizzle-orm";
import { check, customType, date, index, pgTable, primaryKey, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { createdAt, id, ts } from "./_columns";
import { users } from "./auth";

const bytea = customType<{ data: Buffer }>({ dataType: () => "bytea" });

export const spaces = pgTable(
  "spaces",
  {
    id: id(),
    name: text().notNull().default("our little corner"),
    togetherSince: date({ mode: "string" }),
    timezone: text().notNull(),
    status: text({ enum: ["active", "closed"] })
      .notNull()
      .default("active"),
    closedAt: ts(),
    purgeAfter: ts(),
    // Nullable: deleting the creator's account must not block (or cascade-delete) the space.
    createdBy: uuid().references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [check("spaces_status_ck", sql`${t.status} in ('active','closed')`)],
);

export const spaceMembers = pgTable(
  "space_members",
  {
    spaceId: uuid()
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text({ enum: ["owner", "member"] })
      .notNull()
      .default("member"),
    joinedAt: createdAt(),
    leftAt: ts(),
  },
  (t) => [
    primaryKey({ columns: [t.spaceId, t.userId] }),
    // V1 rule: a user belongs to at most one active space.
    uniqueIndex("one_active_space_per_user").on(t.userId).where(sql`${t.leftAt} is null`),
  ],
);

export const spaceInvites = pgTable(
  "space_invites",
  {
    id: id(),
    spaceId: uuid()
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    codeHash: bytea().notNull().unique(),
    createdBy: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: ts().notNull(),
    acceptedBy: uuid().references(() => users.id, { onDelete: "set null" }),
    acceptedAt: ts(),
    revokedAt: ts(),
    createdAt: createdAt(),
  },
  (t) => [index("space_invites_open_idx").on(t.spaceId).where(sql`${t.acceptedAt} is null and ${t.revokedAt} is null`)],
);
