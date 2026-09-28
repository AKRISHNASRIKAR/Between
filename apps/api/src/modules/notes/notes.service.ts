import {
  type CreateNoteInput,
  LIMITS,
  type Note,
  type NoteBox,
  type NotePage,
  type UpdateNoteInput,
} from "@lovenotes/contracts";
import type { Tx } from "../../db/client";
import { conflict, forbidden, notFound } from "../../lib/errors";
import { assertWritable, type SpaceScope } from "../../lib/scope";
import { withTx } from "../../lib/tx";
import { publish } from "../../realtime/hub";
import { displayName, membersRepo } from "../members";
import { notifyPartner } from "../notifications";
import { announcePet, growPet, petNameFor } from "../pet";
import { notesRepo, toNote } from "./notes.repo";

async function mustFind(tx: Tx, scope: SpaceScope, id: string, lock = false) {
  const row = await notesRepo.find(tx, scope, id, { lock });
  if (!row) throw notFound();
  return row;
}

export async function listNotes(
  scope: SpaceScope,
  box: NoteBox,
  cursor?: string,
  limit: number = LIMITS.pageSize.default,
): Promise<NotePage> {
  const { rows, nextCursor } = await withTx((tx) =>
    notesRepo.page(tx, scope, box, cursor, Math.min(limit, LIMITS.pageSize.max)),
  );
  return { items: rows.map(toNote), nextCursor };
}

export async function getNote(scope: SpaceScope, id: string): Promise<Note> {
  return withTx(async (tx) => toNote(await mustFind(tx, scope, id)));
}

/** Leave a note; the pet "carries" it (bond, live update, a notice for the partner). */
export async function createNote(scope: SpaceScope, input: CreateNoteInput): Promise<Note> {
  assertWritable(scope);
  const recipientId = scope.partnerId;
  if (!recipientId) throw conflict("NOT_IN_SPACE", "Your person hasn't joined yet.");
  const r = await withTx(async (tx) => {
    const inserted = await notesRepo.insert(tx, scope, { ...input, recipientId });
    if (!inserted) return { note: toNote(await mustFind(tx, scope, input.id)), fresh: false as const };
    const pet = await growPet(tx, scope, "note.created", inserted.id);
    const me = displayName(await membersRepo.of(tx, scope), scope.userId);
    return { note: toNote(inserted), fresh: true as const, pet, me, petName: await petNameFor(tx, scope) };
  });
  if (!r.fresh) return r.note; // idempotent retry (ADR 0008)
  publish(scope.spaceId, { t: "note.created", note: r.note });
  await announcePet(scope, r.pet);
  await notifyPartner(scope, { type: "note.waiting", noteId: r.note.id, from: r.me }, r.petName);
  return r.note;
}

/** Authors can edit until the note is opened. */
export async function updateNote(scope: SpaceScope, id: string, input: UpdateNoteInput): Promise<Note> {
  assertWritable(scope);
  const note = await withTx(async (tx) => {
    const row = await mustFind(tx, scope, id, true);
    if (row.authorId !== scope.userId) throw forbidden("FORBIDDEN_ACTION", "Only the writer can edit a note.");
    if (row.openedAt) throw conflict("FORBIDDEN_ACTION", "It's already been opened.");
    const updated = await notesRepo.update(tx, scope, id, {
      ...(input.body !== undefined && { body: input.body }),
      ...(input.paper && { paper: input.paper }),
    });
    if (!updated) throw notFound();
    return toNote(updated);
  });
  publish(scope.spaceId, { t: "note.updated", note });
  return note;
}

export async function deleteNote(scope: SpaceScope, id: string): Promise<void> {
  assertWritable(scope);
  await withTx(async (tx) => {
    const row = await mustFind(tx, scope, id, true);
    if (row.authorId !== scope.userId) throw forbidden("FORBIDDEN_ACTION", "Only the writer can delete a note.");
    await notesRepo.update(tx, scope, id, { deletedAt: new Date() });
  });
  publish(scope.spaceId, { t: "note.deleted", noteId: id });
}

/** The recipient opens the envelope. Idempotent. */
export async function openNote(scope: SpaceScope, id: string): Promise<Note> {
  const r = await withTx(async (tx) => {
    const row = await mustFind(tx, scope, id, true);
    if (row.recipientId !== scope.userId) throw forbidden("FORBIDDEN_ACTION", "Only the recipient opens a note.");
    if (row.openedAt) return { note: toNote(row), changed: false };
    const updated = await notesRepo.update(tx, scope, id, { openedAt: new Date() });
    if (!updated) throw notFound();
    return { note: toNote(updated), changed: true };
  });
  if (r.changed) publish(scope.spaceId, { t: "note.updated", note: r.note });
  return r.note;
}

export async function reactToNote(scope: SpaceScope, id: string, on: boolean): Promise<Note> {
  const note = await withTx(async (tx) => {
    const row = await mustFind(tx, scope, id, true);
    if (row.recipientId !== scope.userId) throw forbidden("FORBIDDEN_ACTION", "Only the recipient can react.");
    const updated = await notesRepo.update(tx, scope, id, {
      reactedAt: on ? (row.reactedAt ?? new Date()) : null,
      openedAt: row.openedAt ?? new Date(),
    });
    if (!updated) throw notFound();
    return toNote(updated);
  });
  publish(scope.spaceId, { t: "note.updated", note });
  return note;
}

/** How many notes are waiting for the caller (Today, widgets). */
export async function countWaitingNotes(scope: SpaceScope): Promise<number> {
  return withTx((tx) => notesRepo.waitingCount(tx, scope));
}
