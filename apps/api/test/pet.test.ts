import { beforeEach, describe, expect, test } from "bun:test";
import type { ServerEvent } from "@lovenotes/contracts";
import { WELLBEING_FLOOR } from "@lovenotes/contracts";
import { sql } from "../src/db/client";
import { pushOutbox } from "../src/modules/notifications/push-transport";
import { realtime } from "../src/realtime/hub";
import { pairedCouple, resetDb } from "./helpers";

beforeEach(async () => {
  await resetDb();
  pushOutbox.length = 0;
});

const care = (kind: "feed" | "pet" | "play") => ({ id: crypto.randomUUID(), kind });

/** Capture realtime events (tests have no sockets bound). */
function captureEvents() {
  const events: ServerEvent[] = [];
  realtime.bind((_topic, data) => events.push(JSON.parse(data)));
  return events;
}

describe("pet well-being", () => {
  test("never below the floor, and care fills it, recording who cared", async () => {
    const { a, b, spaceId } = await pairedCouple();
    const before = (await a.req("GET", `/spaces/${spaceId}/pet`)).json;
    for (const k of ["fullness", "energy", "love"] as const)
      expect(before.wellbeing[k].value).toBeGreaterThanOrEqual(WELLBEING_FLOOR);

    await b.req("POST", `/spaces/${spaceId}/pet/interactions`, care("feed"));
    const after = (await a.req("GET", `/spaces/${spaceId}/pet`)).json;
    expect(after.wellbeing.fullness.value).toBeGreaterThan(before.wellbeing.fullness.value);
    const bId = (await b.req("GET", "/me")).json.profile.id;
    expect(after.wellbeing.lastCare).toContainEqual(expect.objectContaining({ kind: "feed", byUserId: bId }));
  });
});

describe("pet milestones and timeline", () => {
  test("hatching is recorded once, when the second member joins", async () => {
    const { a, spaceId } = await pairedCouple();
    const t = (await a.req("GET", `/spaces/${spaceId}/pet/timeline`)).json;
    expect(t.milestones.map((m: { kind: string }) => m.kind)).toEqual(["hatched"]);
  });

  test("a first note and naming become milestones; the timeline shows care too", async () => {
    const { a, b, spaceId } = await pairedCouple();
    await a.req("POST", `/spaces/${spaceId}/notes`, { id: crypto.randomUUID(), body: "hi", paper: "cream" });
    await a.req("POST", `/spaces/${spaceId}/notes`, { id: crypto.randomUUID(), body: "again", paper: "cream" });
    await a.req("POST", `/spaces/${spaceId}/pet/name`, { action: "propose", name: "Biscuit" });
    await b.req("POST", `/spaces/${spaceId}/pet/name`, { action: "accept" });
    await b.req("POST", `/spaces/${spaceId}/pet/interactions`, care("pet"));

    const t = (await a.req("GET", `/spaces/${spaceId}/pet/timeline`)).json;
    const kinds = t.milestones.map((m: { kind: string }) => m.kind);
    expect(kinds).toEqual(expect.arrayContaining(["hatched", "first_note", "named"]));
    expect(kinds.filter((k: string) => k === "first_note")).toHaveLength(1);
    expect(t.items.some((i: { type: string; kind: string }) => i.type === "care" && i.kind === "pet")).toBe(true);
  });

  test("the timeline is space-scoped: a stranger gets 404", async () => {
    const one = await pairedCouple("one");
    const two = await pairedCouple("two");
    expect((await two.a.req("GET", `/spaces/${one.spaceId}/pet/timeline`)).status).toBe(404);
  });
});

describe("notices", () => {
  test("an online partner gets a live notice, not a push", async () => {
    const { a, b, spaceId } = await pairedCouple();
    const me = (await b.req("GET", "/me")).json;
    const events = captureEvents();
    realtime.join(spaceId, me.profile.id);
    try {
      await a.req("POST", `/spaces/${spaceId}/notes`, { id: crypto.randomUUID(), body: "hi", paper: "cream" });
    } finally {
      realtime.leave(spaceId, me.profile.id);
      realtime.bind(() => {});
    }
    const notice = events.find((e) => e.t === "notice");
    expect(notice).toMatchObject({ t: "notice", to: me.profile.id, notice: { type: "note.waiting", from: "Krishna" } });
    expect(pushOutbox.filter((p) => p.userId === me.profile.id)).toHaveLength(0);
  });

  test("an away partner gets a push in the pillar's voice", async () => {
    const { a, b, spaceId } = await pairedCouple();
    const bId = (await b.req("GET", "/me")).json.profile.id;
    await a.req("POST", `/spaces/${spaceId}/notes`, { id: crypto.randomUUID(), body: "hi", paper: "cream" });
    const push = pushOutbox.find((p) => p.userId === bId);
    expect(push?.url).toMatch(/^\/notes\//);
    expect(push?.body).toContain("Krishna");
  });

  test("switched-off kinds are not sent; pet updates are opt-in", async () => {
    const { a, b, spaceId } = await pairedCouple();
    const bId = (await b.req("GET", "/me")).json.profile.id;
    await b.req("PUT", "/me/notification-prefs", { notes: false });
    await a.req("POST", `/spaces/${spaceId}/notes`, { id: crypto.randomUUID(), body: "hi", paper: "cream" });
    expect(pushOutbox.filter((p) => p.userId === bId)).toHaveLength(0);

    // first_note is a milestone, but pet updates default off: no pet push for anyone.
    expect(pushOutbox.filter((p) => p.pillar === "pet")).toHaveLength(0);
    const [row] = await sql`select count(*)::int as n from pet_milestones where kind = 'first_note'`;
    expect(row?.n).toBe(1);
  });
});
