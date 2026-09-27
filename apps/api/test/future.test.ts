import { beforeEach, describe, expect, test } from "bun:test";
import { pairedCouple, resetDb } from "./helpers";

beforeEach(resetDb);
const item = (title: string) => ({ id: crypto.randomUUID(), title, category: "place" });

describe("our future", () => {
  test("add (newest on top), both see the same list", async () => {
    const { a, b, spaceId } = await pairedCouple();
    await a.req("POST", `/spaces/${spaceId}/future`, item("Visit Goa"));
    await b.req("POST", `/spaces/${spaceId}/future`, item("Visit Japan"));
    const list = (await a.req("GET", `/spaces/${spaceId}/future`)).json;
    expect(list.map((f: { title: string }) => f.title)).toEqual(["Visit Japan", "Visit Goa"]);
  });

  test("complete stamps it, grows the bond, is idempotent; uncomplete clears it", async () => {
    const { a, spaceId } = await pairedCouple();
    const f = (await a.req("POST", `/spaces/${spaceId}/future`, item("Watch sunrise"))).json;
    const done = (await a.req("POST", `/spaces/${spaceId}/future/${f.id}/complete`)).json;
    expect(done.completedAt).not.toBeNull();
    await a.req("POST", `/spaces/${spaceId}/future/${f.id}/complete`);
    const { sql } = await import("../src/db/client");
    const [p] = await sql`select bond from pets`;
    expect(p?.bond).toBe(10);
    const undone = (await a.req("POST", `/spaces/${spaceId}/future/${f.id}/uncomplete`)).json;
    expect(undone.completedAt).toBeNull();
  });

  test("stale edits get a 409 instead of silently overwriting", async () => {
    const { a, b, spaceId } = await pairedCouple();
    const f = (await a.req("POST", `/spaces/${spaceId}/future`, item("Adopt a dog"))).json;
    const okEdit = await a.req("PATCH", `/spaces/${spaceId}/future/${f.id}`, {
      title: "Adopt a corgi",
      version: f.version,
    });
    expect(okEdit.status).toBe(200);
    const stale = await b.req("PATCH", `/spaces/${spaceId}/future/${f.id}`, {
      title: "Adopt a cat",
      version: f.version,
    });
    expect(stale.status).toBe(409);
    expect(stale.json.error.code).toBe("VERSION_CONFLICT");
  });

  test("reorder moves an item between neighbours", async () => {
    const { a, spaceId } = await pairedCouple();
    for (const t of ["C", "B", "A"]) await a.req("POST", `/spaces/${spaceId}/future`, item(t));
    const [A, B, C] = (await a.req("GET", `/spaces/${spaceId}/future`)).json;
    // move A between B and C
    await a.req("PATCH", `/spaces/${spaceId}/future/${A.id}`, {
      after: B.position,
      before: C.position,
      version: A.version,
    });
    const order = (await a.req("GET", `/spaces/${spaceId}/future`)).json.map((f: { title: string }) => f.title);
    expect(order).toEqual(["B", "A", "C"]);
  });
});
