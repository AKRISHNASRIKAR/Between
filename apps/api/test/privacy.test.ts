import { beforeEach, describe, expect, test } from "bun:test";
import { runCleanup } from "../src/modules/privacy";
import { pairedCouple, resetDb, signIn } from "./helpers";

beforeEach(resetDb);

describe("account deletion", () => {
  test("closes the space, removes my data, partner keeps read-only access to their own things", async () => {
    const { a, b, spaceId } = await pairedCouple();
    await a.req("POST", `/spaces/${spaceId}/notes`, { id: crypto.randomUUID(), body: "from a", paper: "cream" });
    await b.req("POST", `/spaces/${spaceId}/notes`, { id: crypto.randomUUID(), body: "from b", paper: "cream" });

    expect((await a.req("DELETE", "/me")).status).toBe(204);
    expect((await a.req("GET", "/me")).status).toBe(401); // session gone

    const space = await b.req("GET", `/spaces/${spaceId}`);
    expect(space.json.status).toBe("closed");
    expect((await b.req("GET", "/me")).json.retainedSpaces[0].id).toBe(spaceId);
    const notes = (await b.req("GET", `/spaces/${spaceId}/notes`)).json.items;
    expect(notes.map((n: { body: string }) => n.body)).toEqual(["from b"]);
    const { sql } = await import("../src/db/client");
    const [u] = await sql`select count(*)::int as n from users where email = 'c-a@test.dev'`;
    expect(u?.n).toBe(0);
  });

  test("works for someone who never joined a space", async () => {
    const { signIn } = await import("./helpers");
    const solo = await signIn("solo@test.dev");
    expect((await solo.req("DELETE", "/me")).status).toBe(204);
  });
});

describe("export", () => {
  test("closed-space discovery remains scoped and exportable after starting a new space", async () => {
    const { a, b, spaceId } = await pairedCouple();
    const stranger = await signIn("stranger@test.dev");
    await a.req("POST", `/spaces/${spaceId}/notes`, { id: crypto.randomUUID(), body: "keep this", paper: "cream" });
    expect((await a.req("POST", `/spaces/${spaceId}/leave`)).status).toBe(204);
    for (const member of [a, b]) {
      const me = (await member.req("GET", "/me")).json;
      expect(me.space).toBeNull();
      expect(me.retainedSpaces.map((s: { id: string }) => s.id)).toEqual([spaceId]);
      expect((await member.req("GET", `/spaces/${spaceId}/export`)).json.notes[0].body).toBe("keep this");
      expect(
        (
          await member.req("POST", `/spaces/${spaceId}/notes`, {
            id: crypto.randomUUID(),
            body: "blocked",
            paper: "cream",
          })
        ).status,
      ).toBe(403);
    }
    expect((await stranger.req("GET", "/me")).json.retainedSpaces).toEqual([]);
    expect((await stranger.req("GET", `/spaces/${spaceId}/export`)).status).toBe(404);
    const newSpace = (await a.req("POST", "/spaces", { timezone: "Asia/Kolkata" })).json;
    const me = (await a.req("GET", "/me")).json;
    expect(me.space.id).toBe(newSpace.id);
    expect(me.retainedSpaces[0].id).toBe(spaceId);
    const { sql } = await import("../src/db/client");
    await sql`update spaces set purge_after = now() - interval '1 day' where id = ${spaceId}`;
    expect((await a.req("GET", "/me")).json.retainedSpaces).toEqual([]);
    expect((await a.req("GET", `/spaces/${spaceId}/export`)).status).toBe(404);
  });

  test("contains my notes, journal and future, and never the partner's private moods", async () => {
    const { a, b, spaceId } = await pairedCouple();
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
    await b.req("PUT", `/spaces/${spaceId}/vibe/${today}`, {
      id: crypto.randomUUID(),
      mood: "hurt",
      visibility: "private",
    });
    await a.req("POST", `/spaces/${spaceId}/notes`, { id: crypto.randomUUID(), body: "hello", paper: "cream" });
    await a.req("POST", `/spaces/${spaceId}/future`, { id: crypto.randomUUID(), title: "Visit Goa" });
    const ex = (await a.req("GET", `/spaces/${spaceId}/export`)).json;
    expect(ex.format).toBe("love-notes-export/1");
    expect(ex.notes).toHaveLength(1);
    expect(ex.future[0].title).toBe("Visit Goa");
    expect(JSON.stringify(ex)).not.toContain("hurt");
  });
});

describe("cleanup", () => {
  test("purges closed spaces past their retention date, keeps recent ones", async () => {
    const { b, spaceId } = await pairedCouple();
    await b.req("POST", `/spaces/${spaceId}/leave`);
    const { sql } = await import("../src/db/client");
    expect((await runCleanup()).spacesPurged).toBe(0);
    await sql`update spaces set purge_after = now() - interval '1 day' where id = ${spaceId}`;
    expect((await runCleanup()).spacesPurged).toBe(1);
    const [s] = await sql`select count(*)::int as n from spaces`;
    expect(s?.n).toBe(0);
  });
});
