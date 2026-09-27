import { beforeEach, describe, expect, test } from "bun:test";
import { pairedCouple, resetDb } from "./helpers";

beforeEach(resetDb);

const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
const checkin = (mood: string, visibility: "private" | "shared", note?: string) => ({
  id: crypto.randomUUID(),
  mood,
  visibility,
  ...(note && { note }),
});

describe("vibe privacy (SPEC D11)", () => {
  test("a private mood is invisible to the partner — indistinguishable from none", async () => {
    const { a, b, spaceId } = await pairedCouple();
    await a.req("PUT", `/spaces/${spaceId}/vibe/${today()}`, checkin("hurt", "private", "rough day"));

    const bView = await b.req("GET", `/spaces/${spaceId}/vibe?date=${today()}`);
    expect(bView.json.partner).toBeNull();
    expect(JSON.stringify(bView.json)).not.toContain("hurt");
    expect(JSON.stringify(bView.json)).not.toContain("rough day");

    const history = await b.req("GET", `/spaces/${spaceId}/vibe/history?month=${today().slice(0, 7)}`);
    expect(history.json.partner).toHaveLength(0);
    expect(JSON.stringify(history.json)).not.toContain("hurt");

    // …and the pet doesn't react to it either
    const pet = await b.req("GET", `/spaces/${spaceId}/pet`);
    const { sql } = await import("../src/db/client");
    const [ev] = await sql`select count(*)::int as n from activity_events where kind = 'mood.shared'`;
    expect(ev?.n).toBe(0);
    expect(pet.status).toBe(200);
  });

  test("sharing reveals it, with an observation once both have shared", async () => {
    const { a, b, spaceId } = await pairedCouple();
    await a.req("PUT", `/spaces/${spaceId}/vibe/${today()}`, checkin("tired", "shared"));
    const b1 = await b.req("GET", `/spaces/${spaceId}/vibe?date=${today()}`);
    expect(b1.json.partner.mood).toBe("tired");
    expect(b1.json.observation).toBeNull(); // b hasn't shared yet

    const b2 = await b.req("PUT", `/spaces/${spaceId}/vibe/${today()}`, checkin("tired", "shared"));
    expect(b2.json.observation).toBe("A quiet day for both of you.");
  });

  test("unsharing hides it again; one check-in per day is updated in place", async () => {
    const { a, b, spaceId } = await pairedCouple();
    await a.req("PUT", `/spaces/${spaceId}/vibe/${today()}`, checkin("joyful", "shared"));
    await a.req("PUT", `/spaces/${spaceId}/vibe/${today()}`, checkin("calm", "private"));
    const bView = await b.req("GET", `/spaces/${spaceId}/vibe?date=${today()}`);
    expect(bView.json.partner).toBeNull();
    const mine = await a.req("GET", `/spaces/${spaceId}/vibe?date=${today()}`);
    expect(mine.json.me.mood).toBe("calm");
    const { sql } = await import("../src/db/client");
    const [rows] = await sql`select count(*)::int as n from mood_checkins`;
    expect(rows?.n).toBe(1);
  });

  test("sharing grows the bond only once per day", async () => {
    const { a, spaceId } = await pairedCouple();
    await a.req("PUT", `/spaces/${spaceId}/vibe/${today()}`, checkin("joyful", "shared"));
    await a.req("PUT", `/spaces/${spaceId}/vibe/${today()}`, checkin("joyful", "private"));
    await a.req("PUT", `/spaces/${spaceId}/vibe/${today()}`, checkin("joyful", "shared"));
    const { sql } = await import("../src/db/client");
    const [p] = await sql`select bond from pets`;
    expect(p?.bond).toBe(2);
  });

  test("can't check in for another day", async () => {
    const { a, spaceId } = await pairedCouple();
    const r = await a.req("PUT", `/spaces/${spaceId}/vibe/2020-01-01`, checkin("calm", "shared"));
    expect(r.status).toBe(422);
  });
});

describe("dev simulated partner", () => {
  test("creates a partner who joins and hatches the egg, then acts", async () => {
    const { signIn } = await import("./helpers");
    const a = await signIn("solo@test.dev", "Krishna");
    const s = (await a.req("POST", "/spaces", { timezone: "Asia/Kolkata" })).json;
    const created = await a.req("POST", "/dev/partner", { name: "Ananya" });
    expect(created.json.partner.displayName).toBe("Ananya");
    const space = (await a.req("GET", `/spaces/${s.id}`)).json;
    expect(space.members).toHaveLength(2);
    expect(space.pet.stage).toBe("baby");

    await a.req("POST", "/dev/partner/act", { type: "mood", mood: "joyful", visibility: "shared" });
    const vibe = await a.req("GET", `/spaces/${s.id}/vibe?date=${today()}`);
    expect(vibe.json.partner.mood).toBe("joyful");

    const online = await a.req("POST", "/dev/partner/act", { type: "online" });
    expect(online.json.partner.online).toBe(true);
  });
});
