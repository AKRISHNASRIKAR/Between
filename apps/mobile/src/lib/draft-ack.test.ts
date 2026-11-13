import { expect, test } from "bun:test";
import type { JournalBlock, JournalPage } from "@lovenotes/contracts";
import { blockAcknowledges, noteAcknowledges, pageAcknowledges } from "./draft-ack";
import { createDraftStore } from "./draft-store";

test("a lost response followed by an edited retry never acknowledges the old committed note", () => {
  const disk = new Map<string, string>();
  let id = 0;
  const store = createDraftStore(
    {
      getSync: (key) => disk.get(key) ?? null,
      setSync: (key, value) => {
        disk.set(key, value);
      },
    },
    () => `operation-${++id}`,
  );
  const scope = { userId: "sam", spaceId: "sam-alex", editor: "note" };
  const create = () => ({ body: "", paper: "cream" as const });
  const valid = (value: unknown): value is ReturnType<typeof create> =>
    typeof (value as ReturnType<typeof create>)?.body === "string";
  const original = store.update(scope, create, valid, () => ({ body: "A", paper: "cream" as const }));
  // A committed, but the phone never received its response. B retries with A's stable operation ID.
  const edited = store.update(scope, create, valid, () => ({ body: "B", paper: "cream" as const }));
  expect(edited.id).toBe(original.id);
  expect(noteAcknowledges({ body: "A", paper: "cream" }, edited.value)).toBe(false);
  store.rebase(scope, edited, create, valid);
  const rebased = store.read(scope, create, valid);
  expect(rebased.value.body).toBe("B");
  expect(rebased.id).not.toBe(original.id);
  expect(noteAcknowledges({ body: "B", paper: "cream" }, rebased.value)).toBe(true);
  expect(store.acknowledge(scope, rebased, create, valid)).toBe(true);
  expect(store.read(scope, create, valid).value.body).toBe("");
});
const block: JournalBlock = {
  id: "block-a",
  authorId: "sam",
  kind: "text",
  body: "original",
  media: [],
  createdAt: "2026-11-02T00:00:00Z",
  version: 1,
};
const page: JournalPage = {
  id: "page-a",
  pageDate: "2026-11-02",
  title: "Our day",
  createdBy: "sam",
  blocks: [block],
  lovedBy: [],
  createdAt: block.createdAt,
  version: 1,
};
const sent = {
  id: page.id,
  blockId: block.id,
  pageDate: page.pageDate,
  title: page.title,
  body: block.body,
  mediaIds: [],
};
test("journal acknowledgments compare the submitted page, block and actual media IDs", () => {
  expect(pageAcknowledges(page, sent)).toBe(true);
  expect(pageAcknowledges(page, { ...sent, body: "new writing" })).toBe(false);
  expect(pageAcknowledges(page, { ...sent, title: "new title" })).toBe(false);
  expect(pageAcknowledges(page, { ...sent, pageDate: "2026-11-01" })).toBe(false);
  expect(pageAcknowledges(page, { ...sent, mediaIds: ["another-photo"] })).toBe(false);
  expect(blockAcknowledges(undefined, { id: block.id, body: block.body, mediaIds: [] })).toBe(false);
  expect(blockAcknowledges(block, { id: block.id, body: "newer reply", mediaIds: [] })).toBe(false);
});
test("rebasing retains edits while replacing already-attached photo identities", () => {
  const store = createDraftStore(
    { getSync: () => null, setSync: () => {} },
    (() => {
      let n = 0;
      return () => `new-${++n}`;
    })(),
  );
  const scope = { userId: "sam", spaceId: "space", editor: "journal" };
  const create = () => ({ body: "", photos: [] as string[] });
  const valid = (value: unknown): value is ReturnType<typeof create> =>
    typeof (value as ReturnType<typeof create>)?.body === "string";
  const record = store.update(scope, create, valid, () => ({ body: "keep this", photos: ["attached-old-id"] }));
  store.rebase(scope, record, create, valid, (value) => ({ ...value, photos: ["fresh-upload-id"] }));
  expect(store.read(scope, create, valid).value).toEqual({ body: "keep this", photos: ["fresh-upload-id"] });
});
