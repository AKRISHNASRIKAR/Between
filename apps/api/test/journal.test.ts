import { beforeEach, describe, expect, test } from "bun:test";
import { app } from "../src/app";
import { placeholderPng } from "../src/modules/dev/png";
import { pairedCouple, resetDb } from "./helpers";

beforeEach(resetDb);
const today = () => new Date().toISOString().slice(0, 10);

/** Full upload flow via the local storage mock: intent → PUT both files → complete. */
async function upload(c: Awaited<ReturnType<typeof pairedCouple>>["a"], spaceId: string) {
  const full = placeholderPng(80, 60, [247, 215, 116], [244, 135, 110]);
  const thumb = placeholderPng(40, 30, [247, 215, 116], [244, 135, 110]);
  const id = crypto.randomUUID();
  const intent = (
    await c.req("POST", `/spaces/${spaceId}/media/uploads`, {
      id,
      mime: "image/png",
      bytes: full.byteLength,
      thumbBytes: thumb.byteLength,
      width: 80,
      height: 60,
    })
  ).json;
  const put = (url: string, data: Uint8Array<ArrayBuffer>) =>
    app.request(new URL(url).pathname, {
      method: "PUT",
      headers: { "content-type": "image/png" },
      body: new Blob([data]),
    });
  expect((await put(intent.uploadUrl, full)).status).toBe(200);
  expect((await put(intent.thumbUploadUrl, thumb)).status).toBe(200);
  const done = await c.req("POST", `/spaces/${spaceId}/media/${id}/complete`);
  expect(done.status).toBe(200);
  return { id, media: done.json };
}

describe("journal", () => {
  test("a page with a text block; partner adds their own block to the same page", async () => {
    const { a, b, spaceId } = await pairedCouple();
    const page = (
      await a.req("POST", `/spaces/${spaceId}/journal/pages`, {
        id: crypto.randomUUID(),
        pageDate: today(),
        title: "That café",
        block: { id: crypto.randomUUID(), body: "That café was terrible 😂", mediaIds: [] },
      })
    ).json;
    const after = (
      await b.req("POST", `/spaces/${spaceId}/journal/pages/${page.id}/blocks`, {
        id: crypto.randomUUID(),
        body: "YOU picked it.",
      })
    ).json;
    expect(after.blocks).toHaveLength(2);
    expect(after.blocks[0].body).toContain("terrible");
    const list = (await b.req("GET", `/spaces/${spaceId}/journal/pages`)).json;
    expect(list.items[0].title).toBe("That café");
  });

  test("only the author can edit or delete a block", async () => {
    const { a, b, spaceId } = await pairedCouple();
    const bid = crypto.randomUUID();
    const page = (
      await a.req("POST", `/spaces/${spaceId}/journal/pages`, {
        id: crypto.randomUUID(),
        pageDate: today(),
        block: { id: bid, body: "mine", mediaIds: [] },
      })
    ).json;
    expect(
      (await b.req("PATCH", `/spaces/${spaceId}/journal/blocks/${bid}`, { body: "hijack", version: 0 })).status,
    ).toBe(403);
    expect((await b.req("DELETE", `/spaces/${spaceId}/journal/blocks/${bid}`)).status).toBe(403);
    const edited = (
      await a.req("PATCH", `/spaces/${spaceId}/journal/blocks/${bid}`, { body: "mine, edited", version: 0 })
    ).json;
    expect(edited.blocks[0].body).toBe("mine, edited");
    expect((await a.req("DELETE", `/spaces/${spaceId}/journal/blocks/${bid}`)).status).toBe(204);
    // empty page disappears
    expect((await a.req("GET", `/spaces/${spaceId}/journal/pages/${page.id}`)).status).toBe(404);
  });

  test("photo upload via local storage → attached → appears in Memories with signed URLs", async () => {
    const { a, b, spaceId } = await pairedCouple();
    const { id } = await upload(a, spaceId);
    await a.req("POST", `/spaces/${spaceId}/journal/pages`, {
      id: crypto.randomUUID(),
      pageDate: today(),
      block: { id: crypto.randomUUID(), body: null, mediaIds: [id] },
    });
    const mem = (await b.req("GET", `/spaces/${spaceId}/memories`)).json;
    expect(mem.items).toHaveLength(1);
    const img = await app.request(new URL(mem.items[0].thumbUrl).pathname);
    expect(img.status).toBe(200);
    expect(img.headers.get("content-type")).toContain("image/png");
  });

  test("tampered or wrong-mode file tokens are rejected", async () => {
    const { a, spaceId } = await pairedCouple();
    const { media } = await upload(a, spaceId);
    const path = new URL(media.url).pathname;
    const tampered = `${path.slice(0, -3)}abc`;
    expect((await app.request(tampered)).status).toBe(404);
    // a GET token can't be used to upload
    expect(
      (await app.request(path, { method: "PUT", headers: { "content-type": "image/png" }, body: "x" })).status,
    ).toBe(404);
  });

  test("you can't attach someone else's (or another space's) media", async () => {
    const { a, b, spaceId } = await pairedCouple();
    const { id } = await upload(a, spaceId);
    const r = await b.req("POST", `/spaces/${spaceId}/journal/pages`, {
      id: crypto.randomUUID(),
      pageDate: today(),
      block: { id: crypto.randomUUID(), body: "steal", mediaIds: [id] },
    });
    expect(r.status).toBe(422);
    const other = await pairedCouple("other");
    const r2 = await other.a.req("POST", `/spaces/${other.spaceId}/journal/pages`, {
      id: crypto.randomUUID(),
      pageDate: today(),
      block: { id: crypto.randomUUID(), body: null, mediaIds: [id] },
    });
    expect(r2.status).toBe(422);
  });

  test("simulated partner can write and add a photo", async () => {
    const { a, spaceId } = await pairedCouple();
    await a.req("POST", "/dev/partner/act", { type: "journal.write", body: "hello from the sim" });
    await a.req("POST", "/dev/partner/act", { type: "journal.photo" });
    const list = (await a.req("GET", `/spaces/${spaceId}/journal/pages`)).json;
    expect(list.items).toHaveLength(1);
    expect(list.items[0].blocks).toHaveLength(2);
    expect(list.items[0].blocks[1].media).toHaveLength(1);
  });

  test("pagination follows page dates: backdated pages are neither skipped nor repeated", async () => {
    const { a, spaceId } = await pairedCouple();
    // Created in one order, dated in a shuffled order — 25 pages spans two result pages (20 each).
    for (let i = 0; i < 25; i++) {
      const day = String(((i * 7) % 25) + 1).padStart(2, "0");
      await a.req("POST", `/spaces/${spaceId}/journal/pages`, {
        id: crypto.randomUUID(),
        pageDate: `2026-03-${day}`,
        block: { id: crypto.randomUUID(), body: `page ${i}`, mediaIds: [] },
      });
    }
    const first = (await a.req("GET", `/spaces/${spaceId}/journal/pages`)).json;
    const second = (await a.req("GET", `/spaces/${spaceId}/journal/pages?cursor=${first.nextCursor}`)).json;
    const all = [...first.items, ...second.items];
    expect(new Set(all.map((p: { id: string }) => p.id)).size).toBe(25);
    const dates = all.map((p: { pageDate: string }) => p.pageDate);
    expect(dates).toEqual([...dates].sort().reverse());
    expect(second.nextCursor).toBeNull();
  });
});
