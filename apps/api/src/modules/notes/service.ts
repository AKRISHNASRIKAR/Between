import {
  type CreateNoteInput,
  LIMITS,
  type Note,
  type NoteBox,
  type NotePage,
  type UpdateNoteInput,
} from "@lovenotes/contracts";
import { and, desc, eq, isNull, lt, or, sql } from "drizzle-orm";
import type { Tx } from "../../db/client";
import { notes, pets, users } from "../../db/schema";
import { decodeCursor, encodeCursor } from "../../lib/cursor";
import { conflict, forbidden, notFound } from "../../lib/errors";
import type { SpaceScope } from "../../lib/scope";
import { withTx } from "../../lib/tx";
import { activity } from "../activity/service";
import { sendPush } from "../notifications/service";
import { assertWritable } from "../spaces/service";

type Row = typeof notes.$inferSelect;

const toDto = (r: Row): Note => ({
  id: r.id,
  authorId: r.authorId,
  recipientId: r.recipientId,
  body: r.body,
  paper: r.paper,
  openedAt: r.openedAt?.toISOString() ?? null,
  reactedAt: r.reactedAt?.toISOString() ?? null,
  createdAt: r.createdAt.toISOString(),
  updatedAt: r.updatedAt.toISOString(),
});

/** Every note query is scoped to the space AND to notes the caller wrote or received. */
const visible = (scope: SpaceScope) =>
  and(
    eq(notes.spaceId, scope.spaceId),
    isNull(notes.deletedAt),
    or(eq(notes.authorId, scope.userId), eq(notes.recipientId, scope.userId)),
  );

async function findNote(tx: Tx, scope: SpaceScope, noteId: string, lock = false) {
  const q = tx
    .select()
    .from(notes)
    .where(and(visible(scope), eq(notes.id, noteId)));
  const [row] = lock ? await q.for("update") : await q;
  if (!row) throw notFound();
  return row;
}

export async function listNotes(
  scope: SpaceScope,
  box: NoteBox,
  cursor?: string,
  limit: number = LIMITS.pageSize.default,
): Promise<NotePage> {
  const after = decodeCursor(cursor);
  const take = Math.min(limit, LIMITS.pageSize.max);
  return withTx(async (tx) => {
    const rows = await tx
      .select()
      .from(notes)
      .where(
        and(
          visible(scope),
          box === "inbox" ? eq(notes.recipientId, scope.userId) : undefined,
          box === "sent" ? eq(notes.authorId, scope.userId) : undefined,
          after
            ? or(
                lt(notes.createdAt, after.createdAt),
                and(eq(notes.createdAt, after.createdAt), lt(notes.id, after.id)),
              )
            : undefined,
        ),
      )
      .orderBy(desc(notes.createdAt), desc(notes.id))
      .limit(take + 1);
    const page = rows.slice(0, take);
    const last = page.at(-1);
    return {
      items: page.map(toDto),
      nextCursor: rows.length > take && last ? encodeCursor(last.createdAt, last.id) : null,
    };
  });
}

export async function getNote(scope: SpaceScope, noteId: string): Promise<Note> {
  return withTx(async (tx) => toDto(await findNote(tx, scope, noteId)));
}

/** Idempotent on the client id. The pet "carries" the note: bond + push + realtime. */
export async function createNote(scope: SpaceScope, input: CreateNoteInput): Promise<Note> {
  assertWritable(scope);
  const recipientId = scope.partnerId;
  if (!recipientId) throw conflict("NOT_IN_SPACE", "Your person hasn't joined yet.");
  return withTx(async (tx, after) => {
    const inserted = await tx
      .insert(notes)
      .values({
        id: input.id,
        spaceId: scope.spaceId,
        authorId: scope.userId,
        recipientId,
        body: input.body,
        paper: input.paper,
      })
      .onConflictDoNothing()
      .returning();
    const row = inserted[0] ?? (await findNote(tx, scope, input.id));
    if (!inserted[0]) return toDto(row); // retry of an existing note

    const pet = await activity.award(tx, scope, "note.created", row.id);
    const [p] = await tx.select({ name: pets.name }).from(pets).where(eq(pets.spaceId, scope.spaceId));
    const dto = toDto(row);
    after(async () => {
      activity.broadcast(scope.spaceId, { t: "note.created", note: dto });
      if (pet) activity.broadcast(scope.spaceId, { t: "pet.updated", pet });
      await sendPush(recipientId, {
        kind: "notes",
        title: `${p?.name ?? "Your pet"} has something for you`,
        body: "A little note is waiting 💌",
        url: `/notes/${dto.id}`,
      });
    });
    return dto;
  });
}

/** Authors can edit until the note is opened. */
export async function updateNote(scope: SpaceScope, noteId: string, input: UpdateNoteInput): Promise<Note> {
  assertWritable(scope);
  return withTx(async (tx, after) => {
    const row = await findNote(tx, scope, noteId, true);
    if (row.authorId !== scope.userId) throw forbidden("FORBIDDEN_ACTION", "Only the writer can edit a note.");
    if (row.openedAt) throw conflict("FORBIDDEN_ACTION", "It's already been opened.");
    const [updated] = await tx
      .update(notes)
      .set({ ...(input.body !== undefined && { body: input.body }), ...(input.paper && { paper: input.paper }) })
      .where(eq(notes.id, noteId))
      .returning();
    if (!updated) throw notFound();
    const dto = toDto(updated);
    after(() => activity.broadcast(scope.spaceId, { t: "note.updated", note: dto }));
    return dto;
  });
}

export async function deleteNote(scope: SpaceScope, noteId: string): Promise<void> {
  assertWritable(scope);
  await withTx(async (tx, after) => {
    const row = await findNote(tx, scope, noteId, true);
    if (row.authorId !== scope.userId) throw forbidden("FORBIDDEN_ACTION", "Only the writer can delete a note.");
    await tx.update(notes).set({ deletedAt: new Date() }).where(eq(notes.id, noteId));
    after(() => activity.broadcast(scope.spaceId, { t: "note.deleted", noteId }));
  });
}

/** Recipient opens the envelope. Idempotent. */
export async function openNote(scope: SpaceScope, noteId: string): Promise<Note> {
  return withTx(async (tx, after) => {
    const row = await findNote(tx, scope, noteId, true);
    if (row.recipientId !== scope.userId) throw forbidden("FORBIDDEN_ACTION", "Only the recipient opens a note.");
    if (row.openedAt) return toDto(row);
    const [updated] = await tx.update(notes).set({ openedAt: new Date() }).where(eq(notes.id, noteId)).returning();
    if (!updated) throw notFound();
    const dto = toDto(updated);
    after(() => activity.broadcast(scope.spaceId, { t: "note.updated", note: dto }));
    return dto;
  });
}

export async function reactToNote(scope: SpaceScope, noteId: string, on: boolean): Promise<Note> {
  return withTx(async (tx, after) => {
    const row = await findNote(tx, scope, noteId, true);
    if (row.recipientId !== scope.userId) throw forbidden("FORBIDDEN_ACTION", "Only the recipient can react.");
    const [updated] = await tx
      .update(notes)
      .set({ reactedAt: on ? (row.reactedAt ?? new Date()) : null, openedAt: row.openedAt ?? new Date() })
      .where(eq(notes.id, noteId))
      .returning();
    if (!updated) throw notFound();
    const dto = toDto(updated);
    after(() => activity.broadcast(scope.spaceId, { t: "note.updated", note: dto }));
    return dto;
  });
}

/** Unopened notes waiting for the caller (for Today + the pet's envelope). */
export async function waitingCount(tx: Tx, scope: SpaceScope): Promise<number> {
  const [r] = await tx
    .select({ n: sql<number>`count(*)::int` })
    .from(notes)
    .where(
      and(
        eq(notes.spaceId, scope.spaceId),
        eq(notes.recipientId, scope.userId),
        isNull(notes.openedAt),
        isNull(notes.deletedAt),
      ),
    );
  return r?.n ?? 0;
}

export async function authorName(tx: Tx, userId: string) {
  const [u] = await tx.select({ name: users.name }).from(users).where(eq(users.id, userId));
  return u?.name ?? "";
}
