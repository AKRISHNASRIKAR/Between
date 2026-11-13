import { db } from "../../db/client";
import { storage } from "../../lib/storage";
import { storageJobsRepo } from "./storage-jobs.repo";

export async function queueStorageDeletion(prefix: string) {
  await storageJobsRepo.enqueue(db, prefix);
}

/** A failed deletion keeps its independent job even if its user/space rows are gone. */
export async function runStorageDeletions(now = new Date()) {
  const jobs = await storageJobsRepo.due(db, now);
  let deleted = 0;
  for (const job of jobs) {
    try {
      await storage.deletePrefix(job.prefix);
      await storageJobsRepo.done(db, job.prefix);
      deleted++;
    } catch {
      const delay = Math.min(24 * 60 * 60_000, 60_000 * 2 ** Math.min(job.attempts, 10));
      await storageJobsRepo.failed(db, job.prefix, new Date(now.getTime() + delay));
    }
  }
  return deleted;
}
