import { and, eq, inArray, isNull, lt, or } from "drizzle-orm";
import { db } from "../../db/client";
import { media, moodCheckins, spaceMembers, spaces, users } from "../../db/schema";
import { makeSpaceScope, type SpaceScope } from "../../lib/scope";
import { storage } from "../../lib/storage";
import { DAY_MS } from "../../lib/time";
import { withTx } from "../../lib/tx";
import type { AuthedUser } from "../../types";
import { listFuture } from "../future/service";
import { listPages } from "../journal/service";
import { listNotes } from "../notes/service";
import { listSessions } from "../quizzes/service";
import { leaveSpace } from "../spaces/service";

/**
 * Delete my account (SPEC §10.2): close my active space (partner keeps 30-day read-only access
 * to their own things), remove my photos from storage, then delete my user row — which cascades
 * to my sessions, push tokens, notes, journal blocks, moods and answers.
 */
export async function deleteAccount(user: AuthedUser): Promise<void> {
  const [membership] = await db
    .select({ spaceId: spaceMembers.spaceId })
    .from(spaceMembers)
    .where(and(eq(spaceMembers.userId, user.id), isNull(spaceMembers.leftAt)));
  if (membership) {
    await leaveSpace(
      makeSpaceScope({
        spaceId: membership.spaceId,
        userId: user.id,
        partnerId: null,
        writable: true,
        timezone: user.timezone,
      }),
    );
  }
  const mine = await db
    .select({ id: media.id, spaceId: media.spaceId })
    .from(media)
    .where(eq(media.uploadedBy, user.id));
  await Promise.all(mine.map((m) => storage.deletePrefix(`spaces/${m.spaceId}/media/${m.id}`).catch(() => {})));
  await db.delete(users).where(eq(users.id, user.id));
}

/** Everything in the space the caller can see, as one JSON document (photos as signed links). */
export async function exportSpace(scope: SpaceScope) {
  const [space] = await db.select().from(spaces).where(eq(spaces.id, scope.spaceId));
  const members = await db
    .select({ id: users.id, name: users.name })
    .from(spaceMembers)
    .innerJoin(users, eq(users.id, spaceMembers.userId))
    .where(eq(spaceMembers.spaceId, scope.spaceId));

  const all = async <T>(fetchPage: (cursor?: string) => Promise<{ items: T[]; nextCursor: string | null }>) => {
    const out: T[] = [];
    let cursor: string | undefined;
    do {
      const page = await fetchPage(cursor);
      out.push(...page.items);
      cursor = page.nextCursor ?? undefined;
    } while (cursor);
    return out;
  };

  const moods = await withTx((tx) =>
    tx
      .select()
      .from(moodCheckins)
      .where(
        and(
          eq(moodCheckins.spaceId, scope.spaceId),
          or(eq(moodCheckins.userId, scope.userId), eq(moodCheckins.visibility, "shared")),
        ),
      ),
  );

  return {
    format: "love-notes-export/1",
    exportedAt: new Date().toISOString(),
    note: "Photo links expire after an hour — download them soon after exporting.",
    space: { name: space?.name, togetherSince: space?.togetherSince, createdAt: space?.createdAt },
    members,
    notes: await all((c) => listNotes(scope, "all", c, 100)),
    journal: await all((c) => listPages(scope, c, 50)),
    future: await listFuture(scope),
    moods: moods.map((m) => ({
      date: m.localDate,
      userId: m.userId,
      mood: m.mood,
      note: m.note,
      visibility: m.visibility,
    })),
    quizzes: await listSessions(scope),
  };
}

/** Hourly housekeeping: purge closed spaces past retention, and abandoned uploads. */
export async function runCleanup(now = new Date()) {
  const expired = await db
    .select({ id: spaces.id })
    .from(spaces)
    .where(and(eq(spaces.status, "closed"), lt(spaces.purgeAfter, now)));
  for (const s of expired) {
    await storage.deletePrefix(`spaces/${s.id}/`).catch((e) => console.error("purge storage failed", s.id, e));
    await db.delete(spaces).where(eq(spaces.id, s.id)); // cascades to all space content
  }

  const stale = await db
    .select({ id: media.id, spaceId: media.spaceId })
    .from(media)
    .where(
      or(
        and(eq(media.status, "pending"), lt(media.createdAt, new Date(now.getTime() - DAY_MS))),
        and(isNull(media.blockId), lt(media.createdAt, new Date(now.getTime() - 7 * DAY_MS))),
      ),
    );
  for (const m of stale) await storage.deletePrefix(`spaces/${m.spaceId}/media/${m.id}`).catch(() => {});
  if (stale.length)
    await db.delete(media).where(
      inArray(
        media.id,
        stale.map((m) => m.id),
      ),
    );

  return { spacesPurged: expired.length, uploadsRemoved: stale.length };
}
