import { beforeEach, describe, expect, test } from "bun:test";
import { pairedCouple, resetDb, signIn } from "./helpers";

beforeEach(resetDb);

describe("auth", () => {
  test("unauthenticated requests get 401", async () => {
    const { app } = await import("../src/app");
    const res = await app.request("/v1/me");
    expect(res.status).toBe(401);
    expect((await res.json()).error.code).toBe("UNAUTHENTICATED");
  });

  test("OTP sign-in then /me", async () => {
    const a = await signIn("solo@test.dev", "Krishna");
    const me = await a.req("GET", "/me");
    expect(me.status).toBe(200);
    expect(me.json.profile.displayName).toBe("Krishna");
    expect(me.json.space).toBeNull();
  });
});

describe("pairing", () => {
  test("create → invite → accept hatches the egg for both", async () => {
    const a = await signIn("a@test.dev", "Krishna");
    const b = await signIn("b@test.dev", "Ananya");

    const created = await a.req("POST", "/spaces", { timezone: "Asia/Kolkata" });
    expect(created.status).toBe(201);
    expect(created.json.pet.stage).toBe("egg");

    const invite = await a.req("POST", `/spaces/${created.json.id}/invites`);
    expect(invite.status).toBe(201);
    expect(invite.json.code).toMatch(/^[2-9A-Z]{4}-[2-9A-Z]{4}$/);

    const preview = await b.req("GET", `/invites/${invite.json.code}`);
    expect(preview.json.inviter.displayName).toBe("Krishna");

    // lowercase + no dash is accepted too
    const joined = await b.req("POST", `/invites/${invite.json.code.replace("-", "").toLowerCase()}/accept`);
    expect(joined.status).toBe(200);
    expect(joined.json.members).toHaveLength(2);
    expect(joined.json.pet.stage).toBe("baby");
    expect(joined.json.pet.mood).toBe("excited");

    const aMe = await a.req("GET", "/me");
    expect(aMe.json.space.pet.stage).toBe("baby");
  });

  test("invite codes are single-use and a third person can't join", async () => {
    const { a } = await pairedCouple();
    const c = await signIn("c@test.dev");
    const me = (await a.req("GET", "/me")).json;
    const invite = await a.req("POST", `/spaces/${me.space.id}/invites`);
    expect(invite.status).toBe(409);
    expect(invite.json.error.code).toBe("SPACE_FULL");
    const bad = await c.req("POST", "/invites/ABCD-EFGH/accept");
    expect(bad.json.error.code).toBe("INVITE_INVALID");
  });

  test("can't accept your own invite or join a second space", async () => {
    const a = await signIn("a@test.dev");
    const b = await signIn("b@test.dev");
    const sa = (await a.req("POST", "/spaces", { timezone: "UTC" })).json;
    await b.req("POST", "/spaces", { timezone: "UTC" });
    const inv = (await a.req("POST", `/spaces/${sa.id}/invites`)).json;
    expect((await a.req("POST", `/invites/${inv.code}/accept`)).json.error.code).toBe("INVITE_OWN_SPACE");
    expect((await b.req("POST", `/invites/${inv.code}/accept`)).json.error.code).toBe("ALREADY_IN_SPACE");
    expect((await a.req("POST", "/spaces", { timezone: "UTC" })).json.error.code).toBe("ALREADY_IN_SPACE");
  });

  test("regenerating an invite revokes the old code", async () => {
    const a = await signIn("a@test.dev");
    const b = await signIn("b@test.dev");
    const s = (await a.req("POST", "/spaces", { timezone: "UTC" })).json;
    const first = (await a.req("POST", `/spaces/${s.id}/invites`)).json;
    await a.req("POST", `/spaces/${s.id}/invites`);
    expect((await b.req("POST", `/invites/${first.code}/accept`)).json.error.code).toBe("INVITE_INVALID");
  });
});

describe("pet", () => {
  test("naming together requires the partner to accept", async () => {
    const { a, b, spaceId } = await pairedCouple();
    await a.req("POST", `/spaces/${spaceId}/pet/name`, { action: "propose", name: "Mochi" });
    const own = await a.req("POST", `/spaces/${spaceId}/pet/name`, { action: "accept" });
    expect(own.json.error.code).toBe("PET_NAME_OWN_PROPOSAL");
    const ok = await b.req("POST", `/spaces/${spaceId}/pet/name`, { action: "accept" });
    expect(ok.json.name).toBe("Mochi");
    expect(ok.json.proposedName).toBeNull();
  });

  test("interactions are idempotent on client id", async () => {
    const { a, spaceId } = await pairedCouple();
    const id = crypto.randomUUID();
    const first = await a.req("POST", `/spaces/${spaceId}/pet/interactions`, { id, kind: "feed" });
    const again = await a.req("POST", `/spaces/${spaceId}/pet/interactions`, { id, kind: "feed" });
    expect(first.status).toBe(200);
    expect(again.status).toBe(200);
    const { sql } = await import("../src/db/client");
    const [row] = await sql`select count(*)::int as n from pet_interactions`;
    expect(row?.n).toBe(1);
  });

  test("egg can't be fed", async () => {
    const a = await signIn("a@test.dev");
    const s = (await a.req("POST", "/spaces", { timezone: "UTC" })).json;
    const r = await a.req("POST", `/spaces/${s.id}/pet/interactions`, { id: crypto.randomUUID(), kind: "feed" });
    expect(r.json.error.code).toBe("PET_NOT_HATCHED");
  });
});

describe("leaving", () => {
  test("leave closes the space for both: read-only, and both can start fresh", async () => {
    const { a, b, spaceId } = await pairedCouple();
    expect((await b.req("POST", `/spaces/${spaceId}/leave`)).status).toBe(204);
    const read = await a.req("GET", `/spaces/${spaceId}`);
    expect(read.status).toBe(200);
    expect(read.json.status).toBe("closed");
    const write = await a.req("POST", `/spaces/${spaceId}/pet/interactions`, { id: crypto.randomUUID(), kind: "pet" });
    expect(write.json.error.code).toBe("SPACE_CLOSED");
    expect((await a.req("GET", "/me")).json.space).toBeNull();
    expect((await a.req("POST", "/spaces", { timezone: "UTC" })).status).toBe(201);
  });
});
