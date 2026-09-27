import {
  MOODS,
  type MoodCheckin,
  type MoodId,
  observation,
  type UpsertMoodInput,
  type Vibe,
  type VibeMonth,
} from "@lovenotes/contracts";
import { and, asc, eq, gte, lt } from "drizzle-orm";
import type { Tx } from "../../db/client";
import { moodCheckins, users } from "../../db/schema";
import { AppError } from "../../lib/errors";
import type { SpaceScope } from "../../lib/scope";
import { DAY_MS, localDate } from "../../lib/time";
import { withTx } from "../../lib/tx";
import { activity } from "../activity/service";
import { sendPush } from "../notifications/service";
import { assertWritable } from "../spaces/service";

type Row = typeof moodCheckins.$inferSelect;

const toDto = (r: Row): MoodCheckin => ({
  id: r.id,
  userId: r.userId,
  localDate: r.localDate,
  mood: r.mood as MoodId,
  note: r.note,
  visibility: r.visibility,
  sharedAt: r.sharedAt?.toISOString() ?? null,
  updatedAt: r.updatedAt.toISOString(),
});

/** Check-ins are for "today" only: the client's local date must be within a day of server time. */
export function assertAllowedDate(date: string, now = new Date()) {
  const t = Date.parse(`${date}T12:00:00Z`);
  if (Number.isNaN(t) || Math.abs(t - now.getTime()) > 1.6 * DAY_MS) {
    throw new AppError("VALIDATION_FAILED", 422, "You can only check in for today.", { date: "Only today" });
  }
}

async function partnerTimezone(tx: Tx, partnerId: string) {
  const [p] = await tx.select({ tz: users.timezone, name: users.name }).from(users).where(eq(users.id, partnerId));
  return p;
}

/** The partner's check-in for *their* today — only if shared. Private rows have no read path. */
async function partnerShared(tx: Tx, scope: SpaceScope): Promise<MoodCheckin | null> {
  if (!scope.partnerId) return null;
  const p = await partnerTimezone(tx, scope.partnerId);
  const theirDate = localDate(new Date(), p?.tz ?? "UTC");
  const [row] = await tx
    .select()
    .from(moodCheckins)
    .where(
      and(
        eq(moodCheckins.spaceId, scope.spaceId),
        eq(moodCheckins.userId, scope.partnerId),
        eq(moodCheckins.localDate, theirDate),
        eq(moodCheckins.visibility, "shared"),
      ),
    );
  return row ? toDto(row) : null;
}

async function loadVibe(tx: Tx, scope: SpaceScope, date: string): Promise<Vibe> {
  const [mine] = await tx
    .select()
    .from(moodCheckins)
    .where(
      and(
        eq(moodCheckins.spaceId, scope.spaceId),
        eq(moodCheckins.userId, scope.userId),
        eq(moodCheckins.localDate, date),
      ),
    );
  const me = mine ? toDto(mine) : null;
  const partner = await partnerShared(tx, scope);
  const both = me?.visibility === "shared" && partner ? observation(me.mood, partner.mood) : null;
  return { date, me, partner, observation: both };
}

export async function getVibe(scope: SpaceScope, date: string): Promise<Vibe> {
  assertAllowedDate(date);
  return withTx((tx) => loadVibe(tx, scope, date));
}

export async function upsertVibe(scope: SpaceScope, date: string, input: UpsertMoodInput): Promise<Vibe> {
  assertWritable(scope);
  assertAllowedDate(date);
  if (!MOODS[input.mood]) throw new AppError("VALIDATION_FAILED", 422, "Unknown mood");

  return withTx(async (tx, after) => {
    const [existing] = await tx
      .select()
      .from(moodCheckins)
      .where(
        and(
          eq(moodCheckins.spaceId, scope.spaceId),
          eq(moodCheckins.userId, scope.userId),
          eq(moodCheckins.localDate, date),
        ),
      )
      .for("update");

    const now = new Date();
    const wasShared = existing?.visibility === "shared";
    const isShared = input.visibility === "shared";
    const values = {
      mood: input.mood,
      note: input.note?.trim() || null,
      visibility: input.visibility,
      sharedAt: isShared ? (existing?.sharedAt ?? now) : null,
    };

    const [row] = existing
      ? await tx.update(moodCheckins).set(values).where(eq(moodCheckins.id, existing.id)).returning()
      : await tx
          .insert(moodCheckins)
          .values({ id: input.id, spaceId: scope.spaceId, userId: scope.userId, localDate: date, ...values })
          .returning();
    if (!row) throw new AppError("INTERNAL", 500);

    // Sharing is a shared activity (bond + pet reacts). Private check-ins leave no trace anywhere.
    const pet = isShared && !wasShared ? await activity.award(tx, scope, "mood.shared", row.id) : null;
    const dto = toDto(row);
    const [actor] = await tx.select({ name: users.name }).from(users).where(eq(users.id, scope.userId));

    after(async () => {
      if (isShared) activity.broadcast(scope.spaceId, { t: "mood.shared", checkin: dto });
      else if (wasShared)
        activity.broadcast(scope.spaceId, { t: "mood.unshared", userId: scope.userId, localDate: date });
      if (pet) activity.broadcast(scope.spaceId, { t: "pet.updated", pet });
      if (isShared && !wasShared && scope.partnerId) {
        await sendPush(scope.partnerId, {
          kind: "vibes",
          title: "Today's vibe",
          body: `${actor?.name || "Your person"} shared how today feels`,
          url: "/today",
        });
      }
    });
    return loadVibe(tx, scope, date);
  });
}

/** A month of vibes: all of mine, only the partner's shared ones. */
export async function vibeMonth(scope: SpaceScope, month: string): Promise<VibeMonth> {
  const start = `${month}-01`;
  const [y, m] = month.split("-").map(Number);
  const next = new Date(Date.UTC(y ?? 2000, m ?? 1, 1)).toISOString().slice(0, 10);
  return withTx(async (tx) => {
    const rows = await tx
      .select()
      .from(moodCheckins)
      .where(
        and(
          eq(moodCheckins.spaceId, scope.spaceId),
          gte(moodCheckins.localDate, start),
          lt(moodCheckins.localDate, next),
        ),
      )
      .orderBy(asc(moodCheckins.localDate));
    return {
      month,
      mine: rows.filter((r) => r.userId === scope.userId).map(toDto),
      partner: rows.filter((r) => r.userId !== scope.userId && r.visibility === "shared").map(toDto),
    };
  });
}
