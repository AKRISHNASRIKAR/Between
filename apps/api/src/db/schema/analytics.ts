import { index, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createdAt, id } from "./_columns";
import { users } from "./auth";
import { spaces } from "./spaces";
export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: id(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    spaceId: uuid().references(() => spaces.id, { onDelete: "cascade" }),
    name: text().notNull(),
    entityId: uuid(),
    occurredAt: createdAt(),
  },
  (t) => [index().on(t.spaceId, t.occurredAt)],
);
