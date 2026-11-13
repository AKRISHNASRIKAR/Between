import { expect, test } from "bun:test";
import { createDraftStore, draftKey } from "./draft-store";

const scope = { userId: "a", spaceId: "our-space", editor: "note" };
const create = () => ({ body: "" });
const valid = (value: unknown): value is { body: string } => typeof (value as { body?: unknown })?.body === "string";
function setup() {
  const disk = new Map<string, string>();
  let id = 0;
  const storage = {
    getSync: (key: string) => disk.get(key) ?? null,
    setSync: (key: string, value: string) => {
      disk.set(key, value);
    },
  };
  return { disk, storage, newId: () => `id-${++id}` };
}
test("drafts survive a fresh store, retaining operation ID and exact text", () => {
  const { storage, newId } = setup();
  const store = createDraftStore(storage, newId);
  const record = store.update(scope, create, valid, () => ({ body: "private thought\nnext line" }));
  expect(createDraftStore(storage, newId).read(scope, create, valid)).toEqual(record);
});
test("account, space and editor boundaries never reuse another draft", () => {
  const { storage, newId } = setup();
  const store = createDraftStore(storage, newId);
  store.update(scope, create, valid, () => ({ body: "only mine" }));
  for (const other of [
    { ...scope, userId: "b" },
    { ...scope, spaceId: "elsewhere" },
    { ...scope, editor: "journal" },
  ])
    expect(store.read(other, create, valid).value.body).toBe("");
});
test("only the acknowledged revision is cleared; late success preserves newer edits", () => {
  const { storage, newId } = setup();
  const store = createDraftStore(storage, newId);
  const sent = store.update(scope, create, valid, () => ({ body: "sent" }));
  const newer = store.update(scope, create, valid, () => ({ body: "newer" }));
  expect(store.acknowledge(scope, sent, create, valid)).toBe(false);
  expect(store.read(scope, create, valid).value).toEqual(newer.value);
  expect(store.read(scope, create, valid).id).not.toBe(sent.id);
  const current = store.read(scope, create, valid);
  expect(store.acknowledge(scope, current, create, valid)).toBe(true);
  expect(createDraftStore(storage, newId).read(scope, create, valid).value.body).toBe("");
  expect(store.acknowledge(scope, newer, create, valid)).toBe(false);
});
test("corrupt/versioned/malformed data recovers safely; storage failure is reported", () => {
  const { storage, disk, newId } = setup();
  for (const raw of ["{broken", '{"version":2}', '{"version":1,"id":"x","revision":0,"value":{"body":7}}']) {
    disk.set(draftKey(scope), raw);
    expect(createDraftStore(storage, newId).read(scope, create, valid).value.body).toBe("");
  }
  const store = createDraftStore(
    {
      getSync: () => null,
      setSync: () => {
        throw Error("disk full");
      },
    },
    newId,
  );
  store.update(scope, create, valid, () => ({ body: "still in memory" }));
  expect(store.failed(scope)).toBe(true);
  expect(store.read(scope, create, valid).value.body).toBe("still in memory");
});

test("a read exception is never reported as a locally saved draft", () => {
  const store = createDraftStore(
    {
      getSync: () => {
        throw Error("unavailable");
      },
      setSync: () => {},
    },
    () => "temporary",
  );
  store.read(scope, create, valid);
  expect(store.failed(scope)).toBe(true);
});
