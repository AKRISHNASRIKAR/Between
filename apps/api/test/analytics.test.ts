import { beforeEach, describe, expect, test } from "bun:test";
import { sql } from "../src/db/client";
import { pairedCouple, resetDb, signIn } from "./helpers";

beforeEach(resetDb);
async function events(name?: string) {
  return name ? sql`select * from analytics_events where name = ${name}` : sql`select * from analytics_events`;
}

describe("content-free product analytics", () => {
  test("account creation is a signup event, not every sign-in; pairing carries space scope", async () => {
    const { a, spaceId } = await pairedCouple();
    expect(await events("account_created")).toHaveLength(2);
    await signIn("c-a@test.dev");
    expect(await events("account_created")).toHaveLength(2);
    const joins = await events("partner_joined");
    expect(joins).toHaveLength(1);
    expect(joins[0]?.space_id).toBe(spaceId);
    expect(await events("space_created")).toHaveLength(1);
    expect(await events("first_shared_interaction")).toHaveLength(0);
    const id = crypto.randomUUID();
    await a.req("POST", `/spaces/${spaceId}/notes`, { id, body: "private message", paper: "cream" });
    await a.req("POST", `/spaces/${spaceId}/notes`, { id, body: "private message", paper: "cream" });
    expect(await events("note_created")).toHaveLength(1);
    expect(await events("first_shared_interaction")).toHaveLength(1);
    expect(JSON.stringify(await events())).not.toContain("private message");
  });

  test("fetching a note is not opening; opening retries count once", async () => {
    const { a, b, spaceId } = await pairedCouple();
    const id = crypto.randomUUID();
    await a.req("POST", `/spaces/${spaceId}/notes`, { id, body: "secret", paper: "cream" });
    await b.req("GET", `/spaces/${spaceId}/notes/${id}`);
    expect(await events("note_opened")).toHaveLength(0);
    expect((await b.req("POST", `/spaces/${spaceId}/notes/${id}/open`)).status).toBe(200);
    await b.req("POST", `/spaces/${spaceId}/notes/${id}/open`);
    expect(await events("note_opened")).toHaveLength(1);
  });

  test("private mood content never reaches events; edits and re-sharing don't inflate checks", async () => {
    const { a, spaceId } = await pairedCouple();
    const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
    const id = crypto.randomUUID();
    const path = `/spaces/${spaceId}/vibe/${date}`;
    await a.req("PUT", path, { id, mood: "hurt", note: "sensitive confession", visibility: "private" });
    expect(await events("mood_checked")).toHaveLength(1);
    expect(await events("mood_shared")).toHaveLength(0);
    expect(await events("first_shared_interaction")).toHaveLength(0);
    await a.req("PUT", path, { id, mood: "hurt", visibility: "shared" });
    await a.req("PUT", path, { id, mood: "hurt", visibility: "private" });
    await a.req("PUT", path, { id, mood: "hurt", visibility: "shared" });
    expect(await events("mood_checked")).toHaveLength(1);
    expect(await events("mood_shared")).toHaveLength(1);
    expect(await events("first_shared_interaction")).toHaveLength(1);
    expect(JSON.stringify(await events())).not.toMatch(/sensitive confession|hurt|private/);
  });

  test("journal blocks count individually and retry doesn't double count", async () => {
    const { a, b, spaceId } = await pairedCouple();
    const page = crypto.randomUUID();
    const first = crypto.randomUUID();
    const second = crypto.randomUUID();
    const date = new Date().toISOString().slice(0, 10);
    await a.req("POST", `/spaces/${spaceId}/journal/pages`, {
      id: page,
      pageDate: date,
      block: { id: first, body: "first", mediaIds: [] },
    });
    const path = `/spaces/${spaceId}/journal/pages/${page}/blocks`;
    await b.req("POST", path, { id: second, body: "second", mediaIds: [] });
    await b.req("POST", path, { id: second, body: "second", mediaIds: [] });
    expect(await events("journal_entry_created")).toHaveLength(2);
    expect(await events("first_shared_interaction")).toHaveLength(1);
  });

  test("widget payloads cannot spoof content or server events and dedupe per account", async () => {
    const { a, b, spaceId } = await pairedCouple();
    const id = crypto.randomUUID();
    await a.req("POST", "/analytics", { id, name: "widget_opened", body: "discard this" });
    await a.req("POST", "/analytics", { id, name: "widget_opened" });
    await b.req("POST", "/analytics", { id, name: "widget_opened" });
    const widget = await events("widget_opened");
    expect(widget).toHaveLength(2);
    expect(widget.every((event) => event.space_id === spaceId)).toBe(true);
    expect(JSON.stringify(widget)).not.toContain("discard this");
    expect((await a.req("POST", "/analytics", { id: crypto.randomUUID(), name: "account_created" })).status).toBe(422);
  });
});
