import { beforeEach, describe, expect, test } from "bun:test";
import { WidgetSnapshot } from "@lovenotes/contracts";
import { pairedCouple, resetDb } from "./helpers";

beforeEach(resetDb);

const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

describe("widget snapshot", () => {
  test("shows counts and shared vibes only — never note text or a private vibe", async () => {
    const { a, b, spaceId } = await pairedCouple();
    await b.req("POST", `/spaces/${spaceId}/notes`, { id: crypto.randomUUID(), body: "secret words", paper: "cream" });
    await b.req("PUT", `/spaces/${spaceId}/vibe/${today()}`, {
      id: crypto.randomUUID(),
      mood: "tired",
      visibility: "private",
    });
    await a.req("PUT", `/spaces/${spaceId}/vibe/${today()}`, {
      id: crypto.randomUUID(),
      mood: "joyful",
      visibility: "shared",
    });

    const r = await a.req("GET", `/spaces/${spaceId}/widget`);
    expect(r.status).toBe(200);
    const snap = WidgetSnapshot.parse(r.json);
    expect(snap.notesWaiting).toBe(1);
    expect(snap.you.vibe?.mood).toBe("joyful");
    expect(snap.partner?.name).toBe("Ananya");
    expect(snap.partner?.vibe).toBeNull(); // private is indistinguishable from none
    expect(JSON.stringify(r.json)).not.toContain("secret words");
    expect(snap.state).toBe("ready");
  });

  test("the partner sees the shared vibe, and no waiting notes of their own", async () => {
    const { a, b, spaceId } = await pairedCouple();
    await a.req("PUT", `/spaces/${spaceId}/vibe/${today()}`, {
      id: crypto.randomUUID(),
      mood: "calm",
      visibility: "shared",
    });
    await b.req("POST", `/spaces/${spaceId}/notes`, { id: crypto.randomUUID(), body: "hi", paper: "cream" });
    const snap = WidgetSnapshot.parse((await b.req("GET", `/spaces/${spaceId}/widget`)).json);
    expect(snap.partner?.vibe).toEqual({ mood: "calm", label: "Calm" });
    expect(snap.notesWaiting).toBe(0);
    expect(["yours", "waiting", "ready", "done"]).toContain(snap.daily);
  });

  test("a closed space reports itself as closed", async () => {
    const { a, spaceId } = await pairedCouple();
    await a.req("POST", `/spaces/${spaceId}/leave`);
    const snap = WidgetSnapshot.parse((await a.req("GET", `/spaces/${spaceId}/widget`)).json);
    expect(snap.state).toBe("closed");
    expect(snap.daily).toBe("none");
  });
});
