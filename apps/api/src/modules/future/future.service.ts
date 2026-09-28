import { type CreateFutureInput, type FutureItem, positionBetween, type UpdateFutureInput } from "@lovenotes/contracts";
import type { Tx } from "../../db/client";
import { AppError, notFound } from "../../lib/errors";
import { assertWritable, type SpaceScope } from "../../lib/scope";
import { withTx } from "../../lib/tx";
import { publish } from "../../realtime/hub";
import { displayName, membersRepo } from "../members";
import { notifyPartner } from "../notifications";
import { announcePet, growPet, petNameFor } from "../pet";
import { futureRepo, toFutureItem } from "./future.repo";

const changed = (scope: SpaceScope) => publish(scope.spaceId, { t: "future.changed" });

async function mustFind(tx: Tx, scope: SpaceScope, id: string) {
  const row = await futureRepo.find(tx, scope, id, { lock: true });
  if (!row) throw notFound();
  return row;
}

export async function listFuture(scope: SpaceScope): Promise<FutureItem[]> {
  return (await withTx((tx) => futureRepo.list(tx, scope))).map(toFutureItem);
}

/** New items go on top. Idempotent on the client id. */
export async function addFuture(scope: SpaceScope, input: CreateFutureInput): Promise<FutureItem> {
  assertWritable(scope);
  const item = await withTx(async (tx) => {
    const top = await futureRepo.topPosition(tx, scope);
    const row =
      (await futureRepo.insert(tx, scope, {
        id: input.id,
        title: input.title,
        emoji: input.emoji ?? null,
        note: input.note ?? null,
        category: input.category,
        position: positionBetween(null, top),
      })) ?? (await mustFind(tx, scope, input.id));
    return toFutureItem(row);
  });
  changed(scope);
  return item;
}

/** Shared fields use optimistic concurrency: a stale `version` gets 409 instead of overwriting. */
export async function updateFuture(scope: SpaceScope, id: string, input: UpdateFutureInput): Promise<FutureItem> {
  assertWritable(scope);
  const item = await withTx(async (tx) => {
    const row = await mustFind(tx, scope, id);
    if (row.version !== input.version)
      throw new AppError("VERSION_CONFLICT", 409, "Updated by your person just now — take another look.");
    const move = input.after !== undefined || input.before !== undefined;
    const updated = await futureRepo.update(tx, scope, id, {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.emoji !== undefined && { emoji: input.emoji }),
      ...(input.note !== undefined && { note: input.note }),
      ...(input.category !== undefined && { category: input.category }),
      ...(move && { position: positionBetween(input.after ?? null, input.before ?? null) }),
    });
    if (!updated) throw notFound();
    return toFutureItem(updated);
  });
  changed(scope);
  return item;
}

/** Stamp done (or undo). Doing something together grows the pet. */
export async function setFutureDone(scope: SpaceScope, id: string, done: boolean): Promise<FutureItem> {
  assertWritable(scope);
  const r = await withTx(async (tx) => {
    const row = await mustFind(tx, scope, id);
    if (!!row.completedAt === done) return { item: toFutureItem(row), changed: false as const };
    const updated = await futureRepo.update(tx, scope, id, {
      completedAt: done ? new Date() : null,
      completedBy: done ? scope.userId : null,
    });
    if (!updated) throw notFound();
    const pet = done ? await growPet(tx, scope, "future.completed", id) : null;
    const me = displayName(await membersRepo.of(tx, scope), scope.userId);
    return { item: toFutureItem(updated), changed: true as const, pet, me, petName: await petNameFor(tx, scope) };
  });
  if (!r.changed) return r.item;
  changed(scope);
  await announcePet(scope, r.pet);
  if (done) await notifyPartner(scope, { type: "future.done", from: r.me, title: r.item.title }, r.petName);
  return r.item;
}

export async function deleteFuture(scope: SpaceScope, id: string): Promise<void> {
  assertWritable(scope);
  await withTx(async (tx) => {
    await mustFind(tx, scope, id);
    await futureRepo.update(tx, scope, id, { deletedAt: new Date() });
  });
  changed(scope);
}
