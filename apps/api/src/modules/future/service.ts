import { type CreateFutureInput, type FutureItem, positionBetween, type UpdateFutureInput } from "@lovenotes/contracts";
import { and, asc, eq, isNull, sql } from "drizzle-orm";
import type { Tx } from "../../db/client";
import { futureItems, users } from "../../db/schema";
import { AppError, notFound } from "../../lib/errors";
import type { SpaceScope } from "../../lib/scope";
import { withTx } from "../../lib/tx";
import { activity } from "../activity/service";
import { sendPush } from "../notifications/service";
import { assertWritable } from "../spaces/service";

type Row = typeof futureItems.$inferSelect;

const toDto = (r: Row): FutureItem => ({
  id: r.id,
  title: r.title,
  emoji: r.emoji,
  note: r.note,
  category: r.category,
  position: r.position,
  createdBy: r.createdBy,
  completedAt: r.completedAt?.toISOString() ?? null,
  completedBy: r.completedBy,
  createdAt: r.createdAt.toISOString(),
  version: r.version,
});

const scoped = (scope: SpaceScope) => and(eq(futureItems.spaceId, scope.spaceId), isNull(futureItems.deletedAt));

async function find(tx: Tx, scope: SpaceScope, id: string) {
  const [row] = await tx
    .select()
    .from(futureItems)
    .where(and(scoped(scope), eq(futureItems.id, id)))
    .for("update");
  if (!row) throw notFound();
  return row;
}

const changed = (scope: SpaceScope) => activity.broadcast(scope.spaceId, { t: "future.changed" });

export async function listFuture(scope: SpaceScope): Promise<FutureItem[]> {
  return withTx(async (tx) =>
    (
      await tx
        .select()
        .from(futureItems)
        .where(scoped(scope))
        .orderBy(asc(futureItems.position), asc(futureItems.createdAt))
    ).map(toDto),
  );
}

/** New items go on top. Idempotent on the client id. */
export async function addFuture(scope: SpaceScope, input: CreateFutureInput): Promise<FutureItem> {
  assertWritable(scope);
  return withTx(async (tx, after) => {
    const [top] = await tx
      .select({ p: futureItems.position })
      .from(futureItems)
      .where(scoped(scope))
      .orderBy(asc(futureItems.position))
      .limit(1);
    const inserted = await tx
      .insert(futureItems)
      .values({
        id: input.id,
        spaceId: scope.spaceId,
        title: input.title,
        emoji: input.emoji ?? null,
        note: input.note ?? null,
        category: input.category,
        position: positionBetween(null, top?.p ?? null),
        createdBy: scope.userId,
      })
      .onConflictDoNothing()
      .returning();
    const row = inserted[0] ?? (await find(tx, scope, input.id));
    after(() => changed(scope));
    return toDto(row);
  });
}

/** Shared editable fields use optimistic concurrency: stale `version` → 409 with the current item. */
export async function updateFuture(scope: SpaceScope, id: string, input: UpdateFutureInput): Promise<FutureItem> {
  assertWritable(scope);
  return withTx(async (tx, after) => {
    const row = await find(tx, scope, id);
    if (row.version !== input.version) {
      throw new AppError("VERSION_CONFLICT", 409, "Updated by your person just now — take another look.");
    }
    const move = input.after !== undefined || input.before !== undefined;
    const [u] = await tx
      .update(futureItems)
      .set({
        ...(input.title !== undefined && { title: input.title }),
        ...(input.emoji !== undefined && { emoji: input.emoji }),
        ...(input.note !== undefined && { note: input.note }),
        ...(input.category !== undefined && { category: input.category }),
        ...(move && { position: positionBetween(input.after ?? null, input.before ?? null) }),
        version: sql`${futureItems.version} + 1`,
      })
      .where(eq(futureItems.id, id))
      .returning();
    if (!u) throw notFound();
    after(() => changed(scope));
    return toDto(u);
  });
}

export async function setFutureDone(scope: SpaceScope, id: string, done: boolean): Promise<FutureItem> {
  assertWritable(scope);
  return withTx(async (tx, after) => {
    const row = await find(tx, scope, id);
    if (!!row.completedAt === done) return toDto(row); // idempotent
    const [u] = await tx
      .update(futureItems)
      .set({
        completedAt: done ? new Date() : null,
        completedBy: done ? scope.userId : null,
        version: sql`${futureItems.version} + 1`,
      })
      .where(eq(futureItems.id, id))
      .returning();
    if (!u) throw notFound();
    const pet = done ? await activity.award(tx, scope, "future.completed", id) : null;
    const [me] = await tx.select({ name: users.name }).from(users).where(eq(users.id, scope.userId));
    const partnerId = scope.partnerId;
    after(async () => {
      changed(scope);
      if (pet) activity.broadcast(scope.spaceId, { t: "pet.updated", pet });
      if (done && partnerId)
        await sendPush(partnerId, {
          kind: "future",
          title: "Done together ✦",
          body: `${me?.name || "Your person"} stamped “${u.title}”`,
          url: "/future",
        });
    });
    return toDto(u);
  });
}

export async function deleteFuture(scope: SpaceScope, id: string): Promise<void> {
  assertWritable(scope);
  await withTx(async (tx, after) => {
    await find(tx, scope, id);
    await tx.update(futureItems).set({ deletedAt: new Date() }).where(eq(futureItems.id, id));
    after(() => changed(scope));
  });
}
