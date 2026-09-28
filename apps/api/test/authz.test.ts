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
  ["GET", `/vibe?date=${new Date().toISOString().slice(0, 10)}`],
  [
    "PUT",
    `/vibe/${new Date().toISOString().slice(0, 10)}`,
    { id: "0192f000-0000-7000-8000-000000000001", mood: "calm", visibility: "shared" },
  ],
  ["GET", `/vibe/history?month=${new Date().toISOString().slice(0, 7)}`],
  ["GET", "/notes"],
  ["POST", "/notes", { id: "0192f000-0000-7000-8000-000000000002", body: "hi", paper: "cream" }],
  ["GET", "/notes/0192f000-0000-7000-8000-000000000003"],
  ["POST", "/notes/0192f000-0000-7000-8000-000000000003/open"],
  ["GET", "/quizzes"],
  ["GET", "/quizzes/0192f000-0000-7000-8000-000000000004"],
  ["POST", "/quizzes/0192f000-0000-7000-8000-000000000004/complete"],
  ["GET", "/daily"],
  ["GET", "/future"],
  ["POST", "/future", { id: "0192f000-0000-7000-8000-000000000005", title: "x" }],
  ["POST", "/future/0192f000-0000-7000-8000-000000000006/complete"],
  ["GET", "/journal/pages"],
  ["POST", "/journal/pages", { id: "0192f000-0000-7000-8000-000000000007", pageDate: "2026-01-01" }],
  ["GET", "/journal/pages/0192f000-0000-7000-8000-000000000008"],
  ["GET", "/memories"],
  ["GET", "/export"],
  ["GET", "/widget"],
  [
    "POST",
    "/media/uploads",
    { id: "0192f000-0000-7000-8000-000000000009", mime: "image/png", bytes: 10, thumbBytes: 10, width: 1, height: 1 },
  ],
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
