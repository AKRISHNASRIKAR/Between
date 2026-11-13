import { eq, lte, sql } from "drizzle-orm";
import type { Tx } from "../../db/client";
import { storageDeletionJobs } from "../../db/schema";

export const storageJobsRepo = {
  async enqueue(tx: Tx, prefix: string) {
    await tx
      .insert(storageDeletionJobs)
      .values({ prefix, nextAttemptAt: new Date(Date.now() + 6 * 60_000) })
      .onConflictDoNothing();
  },
  async due(tx: Tx, now: Date) {
    return tx.select().from(storageDeletionJobs).where(lte(storageDeletionJobs.nextAttemptAt, now)).limit(100);
  },
  async done(tx: Tx, prefix: string) {
    await tx.delete(storageDeletionJobs).where(eq(storageDeletionJobs.prefix, prefix));
  },
  async failed(tx: Tx, prefix: string, nextAttemptAt: Date) {
    await tx
      .update(storageDeletionJobs)
      .set({ attempts: sql`${storageDeletionJobs.attempts} + 1`, nextAttemptAt })
      .where(eq(storageDeletionJobs.prefix, prefix));
  },
};
