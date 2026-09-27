import { index, pgTable, smallint, text, uuid } from "drizzle-orm/pg-core";
import { createdAt, id } from "./_columns";
import { users } from "./auth";
import { spaces } from "./spaces";

/** Shared-activity log: bond caps, "since your last visit", future recaps. Private moods are never recorded here. */
export const activityEvents = pgTable(
  "activity_events",
  {
    id: id(),
    spaceId: uuid()
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    actorId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text().notNull(),
    subjectId: uuid(),
    bondDelta: smallint().notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.spaceId, t.createdAt.desc()), index().on(t.spaceId, t.actorId, t.kind, t.createdAt.desc())],
);
