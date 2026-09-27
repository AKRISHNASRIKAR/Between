/**
 * Authorization matrix: for every space-scoped route, a member of space A using space B's id
 * must get 404 SPACE_NOT_FOUND. Add every new /spaces/:sid route to ROUTES.
 */
import { beforeAll, describe, expect, test } from "bun:test";
import { type Client, pairedCouple, resetDb, signIn } from "./helpers";

const ROUTES: Array<[method: string, path: string, body?: unknown]> = [
  ["GET", ""],
  ["PATCH", "", { name: "hacked" }],
  ["POST", "/invites"],
  ["DELETE", "/invites/current"],
  ["POST", "/leave"],
  ["GET", "/pet"],
  ["POST", "/pet/interactions", { id: "0192f000-0000-7000-8000-000000000000", kind: "feed" }],
  ["POST", "/pet/name", { action: "propose", name: "x" }],
];

let intruder: Client;
let victimSpace: string;

beforeAll(async () => {
  await resetDb();
  const victims = await pairedCouple("victim");
  victimSpace = victims.spaceId;
  const other = await pairedCouple("intruder");
  intruder = other.a;
  // a user with no space at all
  await signIn("loner@test.dev");
});

describe("cross-space access is impossible", () => {
  for (const [method, path, body] of ROUTES) {
    test(`${method} /spaces/:sid${path}`, async () => {
      const r = await intruder.req(method, `/spaces/${victimSpace}${path}`, body);
      expect(r.status).toBe(404);
      expect(r.json.error.code).toBe("SPACE_NOT_FOUND");
    });
  }

  test("malformed space ids are 404 too", async () => {
    const r = await intruder.req("GET", "/spaces/not-a-uuid");
    expect(r.status).toBe(404);
  });

  test("victim space is untouched", async () => {
    const { sql } = await import("../src/db/client");
    const [s] = await sql`select name, status from spaces where id = ${victimSpace}`;
    expect(s?.name).not.toBe("hacked");
    expect(s?.status).toBe("active");
  });
});
