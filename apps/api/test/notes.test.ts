import { beforeEach, describe, expect, test } from "bun:test";
import { pairedCouple, resetDb, signIn } from "./helpers";

beforeEach(resetDb);

const note = (body = "Good luck today", paper = "blush") => ({ id: crypto.randomUUID(), body, paper });

describe("notes", () => {
  test("A leaves a note for B; B sees it in the inbox, A in sent", async () => {
    const { a, b, spaceId } = await pairedCouple();
    const created = await a.req("POST", `/spaces/${spaceId}/notes`, note());
    expect(created.status).toBe(201);
    expect(created.json.openedAt).toBeNull();

    const inbox = await b.req("GET", `/spaces/${spaceId}/notes?box=inbox`);
    expect(inbox.json.items).toHaveLength(1);
    const sent = await a.req("GET", `/spaces/${spaceId}/notes?box=sent`);
    expect(sent.json.items).toHaveLength(1);
    const aInbox = await a.req("GET", `/spaces/${spaceId}/notes?box=inbox`);
    expect(aInbox.json.items).toHaveLength(0);
  });

  test("create is idempotent on the client id and grows the bond (capped)", async () => {
    const { a, spaceId } = await pairedCouple();
    const n = note();
    await a.req("POST", `/spaces/${spaceId}/notes`, n);
    await a.req("POST", `/spaces/${spaceId}/notes`, n);
    for (let i = 0; i < 4; i++) await a.req("POST", `/spaces/${spaceId}/notes`, note(`note ${i}`));
    const { sql } = await import("../src/db/client");
    const [c] = await sql`select count(*)::int as n from notes`;
    expect(c?.n).toBe(5);
    const [p] = await sql`select bond from pets`;
    expect(p?.bond).toBe(9); // 3 notes × 3, then capped
  });

  test("only the recipient opens/reacts; only the author edits (until opened) or deletes", async () => {
    const { a, b, spaceId } = await pairedCouple();
    const n = (await a.req("POST", `/spaces/${spaceId}/notes`, note())).json;
    expect((await a.req("POST", `/spaces/${spaceId}/notes/${n.id}/open`)).status).toBe(403);
    expect((await b.req("PATCH", `/spaces/${spaceId}/notes/${n.id}`, { body: "hijack" })).status).toBe(403);

    const edited = await a.req("PATCH", `/spaces/${spaceId}/notes/${n.id}`, { body: "Good luck, you!" });
    expect(edited.json.body).toBe("Good luck, you!");

    const opened = await b.req("POST", `/spaces/${spaceId}/notes/${n.id}/open`);
    expect(opened.json.openedAt).not.toBeNull();
    expect((await a.req("PATCH", `/spaces/${spaceId}/notes/${n.id}`, { body: "too late" })).status).toBe(409);

    const reacted = await b.req("PUT", `/spaces/${spaceId}/notes/${n.id}/reaction`);
    expect(reacted.json.reactedAt).not.toBeNull();

    expect((await b.req("DELETE", `/spaces/${spaceId}/notes/${n.id}`)).status).toBe(403);
    expect((await a.req("DELETE", `/spaces/${spaceId}/notes/${n.id}`)).status).toBe(204);
    expect((await b.req("GET", `/spaces/${spaceId}/notes/${n.id}`)).status).toBe(404);
  });

  test("pagination returns everything exactly once", async () => {
    const { a, b, spaceId } = await pairedCouple();
    for (let i = 0; i < 35; i++) await a.req("POST", `/spaces/${spaceId}/notes`, note(`n${i}`));
    const seen = new Set<string>();
    let cursor: string | null = null;
    do {
      const q = cursor ? `&cursor=${cursor}` : "";
      const page: { json: { items: { id: string }[]; nextCursor: string | null } } = await b.req(
        "GET",
        `/spaces/${spaceId}/notes?box=inbox${q}`,
      );
      for (const it of page.json.items) seen.add(it.id);
      cursor = page.json.nextCursor;
    } while (cursor);
    expect(seen.size).toBe(35);
  });

  test("can't leave a note before your person joins", async () => {
    const a = await signIn("solo@test.dev");
    const s = (await a.req("POST", "/spaces", { timezone: "UTC" })).json;
    const r = await a.req("POST", `/spaces/${s.id}/notes`, note());
    expect(r.status).toBe(409);
  });

  test("simulated partner can send, open and react", async () => {
    const { a, spaceId } = await pairedCouple();
    await a.req("POST", "/dev/partner/act", { type: "note.send", body: "hi from the sim" });
    const inbox = await a.req("GET", `/spaces/${spaceId}/notes?box=inbox`);
    expect(inbox.json.items[0].body).toBe("hi from the sim");
    await a.req("POST", `/spaces/${spaceId}/notes`, note("for the sim"));
    await a.req("POST", "/dev/partner/act", { type: "note.reactLatest" });
    const sent = await a.req("GET", `/spaces/${spaceId}/notes?box=sent`);
    expect(sent.json.items[0].reactedAt).not.toBeNull();
  });
});
