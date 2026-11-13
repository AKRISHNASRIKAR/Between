import { beforeEach, describe, expect, test } from "bun:test";
import type { ServerEvent } from "@lovenotes/contracts";
import { WELLBEING_FLOOR } from "@lovenotes/contracts";
import { sql } from "../src/db/client";
import { notify } from "../src/modules/notifications";
import { pushOutbox } from "../src/modules/notifications/push-transport";
import { realtime } from "../src/realtime/hub";
import { type Client, pairedCouple, resetDb, signIn } from "./helpers";

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
    await b.req("POST", `/spaces/${spaceId}/pet/name`, { action: "accept", name: "Biscuit" });
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

async function proposal(client: Client, sid: string, enabled: boolean) {
  const result = await client.req("POST", `/spaces/${sid}/pet/decision`, { action: "propose", enabled });
  expect(result.status).toBe(200);
  return result.json.decisionId as string;
}

async function agree(client: Client, sid: string, decisionId: string) {
  return client.req("POST", `/spaces/${sid}/pet/decision`, { action: "accept", decisionId });
}

describe("optional pet consent", () => {
  test("joining never opts into a pet; inactive care and shared activity earn no pet bond", async () => {
    const a = await signIn("optional-a@test.dev");
    const b = await signIn("optional-b@test.dev");
    const created = await a.req("POST", "/spaces", { timezone: "Asia/Kolkata" });
    const sid = created.json.id;
    const invite = await a.req("POST", `/spaces/${sid}/invites`);
    await b.req("POST", `/invites/${invite.json.code}/accept`);
    const initial = await a.req("GET", `/spaces/${sid}/pet`);
    expect(initial.json).toMatchObject({ status: "NONE", stage: "egg", bond: 0, hatchedAt: null });
    expect((await a.req("POST", `/spaces/${sid}/pet/interactions`, care("feed"))).status).toBe(409);
    await a.req("POST", `/spaces/${sid}/notes`, { id: crypto.randomUUID(), body: "hello", paper: "cream" });
    expect((await a.req("GET", `/spaces/${sid}/pet`)).json.bond).toBe(0);
    expect((await a.req("GET", `/spaces/${sid}/pet/timeline`)).json.milestones).toEqual([]);
    const id = await proposal(a, sid, true);
    expect((await agree(a, sid, id)).status).toBe(409);
    expect((await agree(b, sid, id)).json).toMatchObject({ status: "ACTIVE", stage: "baby", bond: 0 });
    expect((await agree(b, sid, id)).status).toBe(409);
    const timeline = (await a.req("GET", `/spaces/${sid}/pet/timeline`)).json;
    expect(timeline.milestones.filter((m: { kind: string }) => m.kind === "hatched")).toHaveLength(1);
  });

  test("stale accept and decline cannot act on a replaced proposal", async () => {
    const { a, b, spaceId } = await pairedCouple();
    const old = await proposal(a, spaceId, false);
    const latest = await proposal(a, spaceId, true);
    expect(latest).not.toBe(old);
    expect((await agree(b, spaceId, old)).json.error.code).toBe("PET_DECISION_CHANGED");
    expect(
      (await b.req("POST", `/spaces/${spaceId}/pet/decision`, { action: "decline", decisionId: old })).status,
    ).toBe(409);
    expect((await a.req("GET", `/spaces/${spaceId}/pet`)).json).toMatchObject({ status: "ACTIVE", decisionId: latest });
    expect((await agree(b, spaceId, latest)).status).toBe(200);
  });

  test("repeated pause decisions preserve the original freeze and resume keeps age and stats", async () => {
    const { a, b, spaceId } = await pairedCouple();
    await agree(b, spaceId, await proposal(a, spaceId, false));
    await sql`update pets set paused_at = now() - interval '30 days', hatched_at = now() - interval '40 days',
      last_fed_at = now() - interval '30 days 2 hours', last_played_at = now() - interval '30 days 1 hour',
      last_petted_at = now() - interval '30 days 4 hours' where space_id = ${spaceId}`;
    const [beforeRow] = await sql`select paused_at from pets where space_id = ${spaceId}`;
    const before = (await a.req("GET", `/spaces/${spaceId}/pet`)).json;
    await agree(b, spaceId, await proposal(a, spaceId, false));
    const [afterRow] = await sql`select paused_at from pets where space_id = ${spaceId}`;
    expect(afterRow?.paused_at).toEqual(beforeRow?.paused_at);
    expect((await a.req("POST", `/spaces/${spaceId}/pet/interactions`, care("play"))).status).toBe(409);
    const resumed = await agree(b, spaceId, await proposal(a, spaceId, true));
    expect(resumed.json.status).toBe("ACTIVE");
    expect(resumed.json.ageDays).toBe(before.ageDays);
    for (const key of ["fullness", "energy", "love"] as const)
      expect(resumed.json.wellbeing[key].value).toBe(before.wellbeing[key].value);
    expect((await a.req("GET", `/spaces/${spaceId}/pet/timeline`)).json.milestones).toHaveLength(1);
  });

  test("stale naming acceptance cannot agree to a revised name", async () => {
    const { a, b, spaceId } = await pairedCouple();
    await a.req("POST", `/spaces/${spaceId}/pet/name`, { action: "propose", name: "Biscuit" });
    await a.req("POST", `/spaces/${spaceId}/pet/name`, { action: "propose", name: "Mochi" });
    expect(
      (await b.req("POST", `/spaces/${spaceId}/pet/name`, { action: "accept", name: "Biscuit" })).json.error.code,
    ).toBe("PET_NAME_CHANGED");
    expect((await b.req("POST", `/spaces/${spaceId}/pet/name`, { action: "accept", name: "Mochi" })).json.name).toBe(
      "Mochi",
    );
  });
});

describe("care concurrency and retries", () => {
  test("concurrent duplicate requests earn bond and analytics only once, including retries after pause", async () => {
    const { a, b, spaceId } = await pairedCouple();
    const input = care("feed");
    const replies = await Promise.all([
      a.req("POST", `/spaces/${spaceId}/pet/interactions`, input),
      a.req("POST", `/spaces/${spaceId}/pet/interactions`, input),
    ]);
    expect(replies.map((r) => r.status)).toEqual([200, 200]);
    expect((await a.req("GET", `/spaces/${spaceId}/pet`)).json.bond).toBe(1);
    const [events] = await sql`select count(*)::int as n from analytics_events where id = ${input.id}`;
    expect(events?.n).toBe(1);
    expect((await b.req("POST", `/spaces/${spaceId}/pet/interactions`, input)).status).toBe(409);
    expect((await a.req("POST", `/spaces/${spaceId}/pet/interactions`, { ...input, kind: "play" })).status).toBe(409);
    await agree(b, spaceId, await proposal(a, spaceId, false));
    expect((await a.req("POST", `/spaces/${spaceId}/pet/interactions`, input)).status).toBe(200);
    const [rows] = await sql`select count(*)::int as n from pet_interactions where id = ${input.id}`;
    expect(rows?.n).toBe(1);
  });

  test("both partners can care together while one member cannot bypass the cooldown", async () => {
    const { a, b, spaceId } = await pairedCouple();
    const replies = await Promise.all([
      a.req("POST", `/spaces/${spaceId}/pet/interactions`, care("feed")),
      b.req("POST", `/spaces/${spaceId}/pet/interactions`, care("feed")),
    ]);
    expect(replies.map((r) => r.status)).toEqual([200, 200]);
    expect((await a.req("GET", `/spaces/${spaceId}/pet`)).json.bond).toBe(2);
    const rapid = await Promise.all([
      a.req("POST", `/spaces/${spaceId}/pet/interactions`, care("play")),
      a.req("POST", `/spaces/${spaceId}/pet/interactions`, care("play")),
    ]);
    expect(rapid.map((r) => r.status).sort()).toEqual([200, 409]);
    const [rows] = await sql`select count(*)::int as n from pet_interactions where space_id = ${spaceId}`;
    expect(rows?.n).toBe(3);
  });

  test("rolling care caps permit care without extra bond and reset after 24 hours", async () => {
    const { a, spaceId } = await pairedCouple();
    for (let i = 0; i < 4; i++) {
      await sql`update pet_interactions set created_at = created_at - interval '1 minute' where space_id = ${spaceId}`;
      expect((await a.req("POST", `/spaces/${spaceId}/pet/interactions`, care("pet"))).status).toBe(200);
    }
    expect((await a.req("GET", `/spaces/${spaceId}/pet`)).json.bond).toBe(3);
    await sql`update pet_interactions set created_at = created_at - interval '25 hours' where space_id = ${spaceId}`;
    expect((await a.req("POST", `/spaces/${spaceId}/pet/interactions`, care("pet"))).status).toBe(200);
    expect((await a.req("GET", `/spaces/${spaceId}/pet`)).json.bond).toBe(4);
    const [events] =
      await sql`select count(*)::int as n from analytics_events where space_id = ${spaceId} and name = 'pet_petted'`;
    expect(events?.n).toBe(5);
  });

  test("undoing and repeating the same future goal does not farm pet bond", async () => {
    const { a, b, spaceId } = await pairedCouple();
    const id = crypto.randomUUID();
    await a.req("POST", `/spaces/${spaceId}/future`, { id, title: "Picnic", category: "goal" });
    expect((await a.req("POST", `/spaces/${spaceId}/future/${id}/complete`)).status).toBe(200);
    expect((await a.req("GET", `/spaces/${spaceId}/pet`)).json.bond).toBe(10);
    await a.req("POST", `/spaces/${spaceId}/future/${id}/uncomplete`);
    await b.req("POST", `/spaces/${spaceId}/future/${id}/complete`);
    expect((await a.req("GET", `/spaces/${spaceId}/pet`)).json.bond).toBe(10);
  });
});

test("paused pets disappear from widgets and suppress even a stale milestone notification", async () => {
  const { a, b, spaceId } = await pairedCouple();
  const bId = (await b.req("GET", "/me")).json.profile.id;
  await b.req("PUT", "/me/notification-prefs", { petUpdates: true });
  await b.req("PUT", "/me/push-tokens/ExponentPushToken[test-paused-pet]", { platform: "ios" });
  await agree(b, spaceId, await proposal(a, spaceId, false));
  expect((await a.req("GET", `/spaces/${spaceId}/widget`)).json.pet).toBeNull();
  await notify({ spaceId, to: bId, notice: { type: "pet.milestone", kind: "bond_50" }, petName: "Mochi" });
  expect(pushOutbox).toHaveLength(0);
});
