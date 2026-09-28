import type { AddBlockInput, CreatePageInput, JournalPage, Notice } from "@lovenotes/contracts";
import type { Tx } from "../../db/client";
import { AppError, forbidden, notFound } from "../../lib/errors";
import { assertWritable, type SpaceScope } from "../../lib/scope";
import { withTx } from "../../lib/tx";
import { publish } from "../../realtime/hub";
import { displayName, membersRepo } from "../members";
import { notifyPartner } from "../notifications";
import { announcePet, growPet, mergePetOutcomes, type PetOutcome, petNameFor } from "../pet";
import { decodePageCursor, encodePageCursor, journalRepo, type PageRow } from "./journal.repo";
import { attachMedia } from "./media.service";

type BlockInput = { id: string; body?: string | null; mediaIds: string[] };

/** What a new block means for the pet and the partner, handed out of the transaction. */
type Written = { pet: PetOutcome | null; notice: Notice; petName: string };

const changed = (scope: SpaceScope, pageId: string) => publish(scope.spaceId, { t: "journal.changed", pageId });

async function mustFindPage(tx: Tx, scope: SpaceScope, id: string) {
  const p = await journalRepo.findPage(tx, scope, id);
  if (!p) throw notFound();
  return p;
}

async function view(tx: Tx, page: PageRow): Promise<JournalPage> {
  const [p] = await journalRepo.hydrate(tx, [page]);
  if (!p) throw notFound();
  return p;
}

/** Insert a block (text and/or photos). Returns null for an idempotent retry. */
async function writeBlock(tx: Tx, scope: SpaceScope, pageId: string, input: BlockInput): Promise<Written | null> {
  const inserted = await journalRepo.insertBlock(tx, scope, {
    id: input.id,
    pageId,
    kind: input.mediaIds.length ? "photos" : "text",
    body: input.body?.trim() || null,
  });
  if (!inserted) return null;
  await attachMedia(tx, scope, input.id, input.mediaIds);

  // Writing grows the pet; each photo adds a little more (daily caps apply in the pet module).
  let pet = await growPet(tx, scope, "journal.block_added", pageId);
  for (const _ of input.mediaIds) pet = mergePetOutcomes(pet, await growPet(tx, scope, "media.added", pageId));

  const from = displayName(await membersRepo.of(tx, scope), scope.userId);
  const photosOnly = input.mediaIds.length > 0 && !input.body?.trim();
  const notice: Notice = photosOnly
    ? { type: "journal.photos", pageId, from, count: input.mediaIds.length }
    : { type: "journal.written", pageId, from };
  return { pet, notice, petName: await petNameFor(tx, scope) };
}

async function announceWritten(scope: SpaceScope, pageId: string, w: Written | null) {
  changed(scope, pageId);
  if (!w) return;
  await announcePet(scope, w.pet);
  await notifyPartner(scope, w.notice, w.petName);
}

export async function listPages(scope: SpaceScope, cursor?: string, limit = 20) {
  return withTx(async (tx) => {
    const rows = await journalRepo.pages(tx, scope, decodePageCursor(cursor), limit + 1);
    const page = rows.slice(0, limit);
    const last = page.at(-1);
    return {
      items: await journalRepo.hydrate(tx, page),
      nextCursor: rows.length > limit && last ? encodePageCursor(last) : null,
    };
  });
}

export async function getPage(scope: SpaceScope, id: string): Promise<JournalPage> {
  return withTx(async (tx) => view(tx, await mustFindPage(tx, scope, id)));
}

/** "Write about today": the newest page dated `date`, if any. */
export async function findPageByDate(scope: SpaceScope, date: string) {
  return withTx((tx) => journalRepo.newestPageOn(tx, scope, date));
}

/** A new page, optionally with the author's first block. Idempotent on the client id. */
export async function createPage(scope: SpaceScope, input: CreatePageInput): Promise<JournalPage> {
  assertWritable(scope);
  const r = await withTx(async (tx) => {
    const created = await journalRepo.insertPage(tx, scope, {
      id: input.id,
      pageDate: input.pageDate,
      title: input.title ?? null,
    });
    const page = created ?? (await mustFindPage(tx, scope, input.id));
    const block = input.block;
    const written =
      created && block && (block.body || block.mediaIds.length) ? await writeBlock(tx, scope, page.id, block) : null;
    return { page: await view(tx, page), written, created: !!created };
  });
  if (r.created) await announceWritten(scope, r.page.id, r.written);
  return r.page;
}

export async function addBlock(scope: SpaceScope, pageId: string, input: AddBlockInput): Promise<JournalPage> {
  assertWritable(scope);
  const r = await withTx(async (tx) => {
    const page = await mustFindPage(tx, scope, pageId);
    const written = await writeBlock(tx, scope, page.id, input);
    return { page: await view(tx, page), written };
  });
  if (r.written) await announceWritten(scope, pageId, r.written);
  return r.page;
}

/** Blocks belong to their author: only they can change or remove them. */
async function mustOwnBlock(tx: Tx, scope: SpaceScope, blockId: string, verb: "edit" | "remove") {
  const b = await journalRepo.findBlock(tx, scope, blockId, { lock: true });
  if (!b) throw notFound();
  if (b.authorId !== scope.userId) throw forbidden("FORBIDDEN_ACTION", `You can only ${verb} what you wrote.`);
  return b;
}

export async function editBlock(
  scope: SpaceScope,
  blockId: string,
  body: string,
  version: number,
): Promise<JournalPage> {
  assertWritable(scope);
  const page = await withTx(async (tx) => {
    const b = await mustOwnBlock(tx, scope, blockId, "edit");
    if (b.version !== version) throw new AppError("VERSION_CONFLICT", 409, "This changed — take another look.");
    await journalRepo.updateBlockBody(tx, scope, blockId, body);
    return view(tx, await mustFindPage(tx, scope, b.pageId));
  });
  changed(scope, page.id);
  return page;
}

/** Removing the last block removes the page too. */
export async function deleteBlock(scope: SpaceScope, blockId: string): Promise<void> {
  assertWritable(scope);
  const pageId = await withTx(async (tx) => {
    const b = await mustOwnBlock(tx, scope, blockId, "remove");
    await journalRepo.deleteBlock(tx, scope, blockId);
    if (!(await journalRepo.blockCount(tx, scope, b.pageId))) await journalRepo.softDeletePage(tx, scope, b.pageId);
    return b.pageId;
  });
  changed(scope, pageId);
}

export async function lovePage(scope: SpaceScope, pageId: string, on: boolean): Promise<JournalPage> {
  const page = await withTx(async (tx) => {
    const p = await mustFindPage(tx, scope, pageId);
    await journalRepo.setLove(tx, scope, pageId, on);
    return view(tx, p);
  });
  changed(scope, pageId);
  return page;
}
