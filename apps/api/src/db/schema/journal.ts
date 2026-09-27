import { sql } from "drizzle-orm";
import {
  date,
  foreignKey,
  index,
  integer,
  pgTable,
  primaryKey,
  smallint,
  text,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { createdAt, ts, updatedAt } from "./_columns";
import { users } from "./auth";
import { spaces } from "./spaces";

export const journalPages = pgTable(
  "journal_pages",
  {
    id: uuid().primaryKey(),
    spaceId: uuid()
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    pageDate: date({ mode: "string" }).notNull(),
    title: text(),
    createdBy: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    version: integer().notNull().default(0),
    deletedAt: ts(),
  },
  (t) => [
    unique("journal_pages_id_space_uq").on(t.id, t.spaceId),
    index().on(t.spaceId, t.pageDate.desc(), t.createdAt.desc()).where(sql`${t.deletedAt} is null`),
  ],
);

export const journalBlocks = pgTable(
  "journal_blocks",
  {
    id: uuid().primaryKey(),
    spaceId: uuid().notNull(),
    pageId: uuid().notNull(),
    authorId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text({ enum: ["text", "photos"] }).notNull(),
    body: text(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    version: integer().notNull().default(0),
  },
  (t) => [
    unique("journal_blocks_id_space_uq").on(t.id, t.spaceId),
    foreignKey({ columns: [t.pageId, t.spaceId], foreignColumns: [journalPages.id, journalPages.spaceId] }).onDelete(
      "cascade",
    ),
    index().on(t.pageId, t.createdAt),
  ],
);

export const journalReactions = pgTable(
  "journal_reactions",
  {
    pageId: uuid().notNull(),
    spaceId: uuid().notNull(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [
    primaryKey({ columns: [t.pageId, t.userId] }),
    foreignKey({ columns: [t.pageId, t.spaceId], foreignColumns: [journalPages.id, journalPages.spaceId] }).onDelete(
      "cascade",
    ),
  ],
);

export const media = pgTable(
  "media",
  {
    id: uuid().primaryKey(),
    spaceId: uuid()
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    uploadedBy: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    blockId: uuid(),
    position: smallint().notNull().default(0),
    storageKey: text().notNull(),
    thumbKey: text().notNull(),
    mime: text().notNull(),
    bytes: integer().notNull(),
    width: integer().notNull(),
    height: integer().notNull(),
    caption: text(),
    takenAt: ts(),
    status: text({ enum: ["pending", "ready"] })
      .notNull()
      .default("pending"),
    createdAt: createdAt(),
  },
  (t) => [
    foreignKey({ columns: [t.blockId, t.spaceId], foreignColumns: [journalBlocks.id, journalBlocks.spaceId] }).onDelete(
      "set null",
    ),
    index().on(t.spaceId, t.createdAt.desc()).where(sql`${t.status} = 'ready'`),
    index().on(t.blockId, t.position),
  ],
);
