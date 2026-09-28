import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  smallint,
  text,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { createdAt, id, ts } from "./_columns";
import { users } from "./auth";
import { spaces } from "./spaces";

export const pets = pgTable(
  "pets",
  {
    id: id(),
    spaceId: uuid()
      .notNull()
      .unique()
      .references(() => spaces.id, { onDelete: "cascade" }),
    species: text().notNull().default("dog"),
    name: text(),
    proposedName: text(),
    proposedBy: uuid().references(() => users.id, { onDelete: "set null" }),
    stage: text().notNull().default("egg"),
    bond: integer().notNull().default(0),
    hatchedAt: ts(),
    lastFedAt: ts(),
    lastPlayedAt: ts(),
    lastPettedAt: ts(),
    lastSharedActivityAt: ts(),
    /** Pet updates are pushed at most once a day (ADR 0003 / CONTEXT "Pet update"). */
    lastUpdatePushAt: ts(),
    appearance: jsonb().notNull().default({}),
    version: integer().notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [unique("pets_id_space_uq").on(t.id, t.spaceId), check("pets_bond_ck", sql`${t.bond} >= 0`)],
);

export const petInteractions = pgTable(
  "pet_interactions",
  {
    id: uuid().primaryKey(),
    spaceId: uuid().notNull(),
    petId: uuid().notNull(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text({ enum: ["feed", "pet", "play"] }).notNull(),
    bondDelta: smallint().notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [
    foreignKey({ columns: [t.petId, t.spaceId], foreignColumns: [pets.id, pets.spaceId] }).onDelete("cascade"),
    index().on(t.spaceId, t.userId, t.createdAt.desc()),
    check("pet_interactions_kind_ck", sql`${t.kind} in ('feed','pet','play')`),
  ],
);

/** Good-news moments, recorded once per pet. */
export const petMilestones = pgTable(
  "pet_milestones",
  {
    petId: uuid().notNull(),
    spaceId: uuid().notNull(),
    kind: text().notNull(),
    byUserId: uuid().references(() => users.id, { onDelete: "set null" }),
    earnedAt: createdAt(),
  },
  (t) => [
    primaryKey({ columns: [t.petId, t.kind] }),
    foreignKey({ columns: [t.petId, t.spaceId], foreignColumns: [pets.id, pets.spaceId] }).onDelete("cascade"),
    index().on(t.spaceId, t.earnedAt.desc()),
  ],
);
