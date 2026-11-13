import { integer, pgTable, text } from "drizzle-orm/pg-core";
import { createdAt, ts } from "./_columns";

/** Independent of users/spaces so deletion work survives cascading row removal. */
export const storageDeletionJobs = pgTable("storage_deletion_jobs", {
  prefix: text().primaryKey(),
  attempts: integer().notNull().default(0),
  nextAttemptAt: ts().notNull().defaultNow(),
  createdAt: createdAt(),
});
