import type { SpaceScope } from "../../lib/scope";
import { withTx } from "../../lib/tx";
import { listFuture } from "../future";
import { listPages, purgeStaleUploads } from "../journal";
import { membersRepo } from "../members";
import { listNotes } from "../notes";
import { listSessions } from "../quizzes";
import { purgeExpiredSpaces, spaceView } from "../spaces";
import { exportVibes } from "../vibes";

type Paged<T> = (cursor?: string) => Promise<{ items: T[]; nextCursor: string | null }>;

async function everyPage<T>(fetchPage: Paged<T>) {
  const out: T[] = [];
  let cursor: string | undefined;
  do {
    const page = await fetchPage(cursor);
    out.push(...page.items);
    cursor = page.nextCursor ?? undefined;
  } while (cursor);
  return out;
}

/**
 * Everything in the space the caller is allowed to see, as one JSON document. Built only from
 * each module's own read functions, so the export can never show more than the app does.
 */
export async function exportSpace(scope: SpaceScope) {
  const { space, members } = await withTx(async (tx) => ({
    space: await spaceView(tx, scope),
    members: await membersRepo.of(tx, scope),
  }));
  return {
    format: "love-notes-export/1",
    exportedAt: new Date().toISOString(),
    note: "Photo links expire after an hour — download them soon after exporting.",
    space: { name: space.name, togetherSince: space.togetherSince, createdAt: space.createdAt },
    members: members.map((m) => ({ id: m.id, name: m.name })),
    notes: await everyPage((c) => listNotes(scope, "all", c, 100)),
    journal: await everyPage((c) => listPages(scope, c, 50)),
    future: await listFuture(scope),
    moods: (await exportVibes(scope)).map((v) => ({
      date: v.localDate,
      userId: v.userId,
      mood: v.mood,
      note: v.note,
      visibility: v.visibility,
    })),
    quizzes: await listSessions(scope),
  };
}

/** Hourly housekeeping: purge closed spaces past retention, and abandoned uploads. */
export async function runCleanup(now = new Date()) {
  return {
    spacesPurged: await purgeExpiredSpaces(now),
    uploadsRemoved: await purgeStaleUploads(now),
  };
}
