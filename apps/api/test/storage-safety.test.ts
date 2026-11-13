import { beforeEach, expect, test } from "bun:test";
import { app } from "../src/app";
import { sql } from "../src/db/client";
import { readToken, storage, writeLocal } from "../src/lib/storage";
import { placeholderPng } from "../src/modules/dev/png";
import { MEDIA_QUOTA_BYTES } from "../src/modules/journal/media.service";
import { runStorageDeletions } from "../src/modules/storage-jobs";
import { pairedCouple, resetDb } from "./helpers";

beforeEach(async () => {
  await resetDb();
  await sql`truncate storage_deletion_jobs`;
});
const photo = () => placeholderPng(80, 60, [247, 215, 116], [244, 135, 110]);
async function reserve(c: Awaited<ReturnType<typeof pairedCouple>>["a"], sid: string, id = crypto.randomUUID()) {
  const data = photo();
  const input = { id, mime: "image/png", bytes: data.byteLength, thumbBytes: data.byteLength, width: 80, height: 60 };
  const result = await c.req("POST", `/spaces/${sid}/media/uploads`, input);
  return { id, input, data, intent: result.json, status: result.status };
}
async function put(url: string, bytes: Uint8Array) {
  return app.request(new URL(url).pathname, {
    method: "PUT",
    headers: { "content-type": "image/png" },
    body: new Blob([new Uint8Array(bytes)]),
  });
}

test("only the uploader completes, read-only spaces cannot complete, final bytes cannot be overwritten by staging URLs", async () => {
  const { a, b, spaceId } = await pairedCouple();
  const upload = await reserve(a, spaceId);
  expect(upload.status).toBe(201);
  expect((await b.req("POST", `/spaces/${spaceId}/media/${upload.id}/complete`)).status).toBe(403);
  expect((await b.req("POST", `/spaces/${spaceId}/media/uploads`, upload.input)).status).toBe(409);
  expect((await put(upload.intent.uploadUrl, upload.data)).status).toBe(200);
  expect((await put(upload.intent.thumbUploadUrl, upload.data)).status).toBe(200);
  const complete = await a.req("POST", `/spaces/${spaceId}/media/${upload.id}/complete`);
  expect(complete.status).toBe(200);
  const different = placeholderPng(80, 60, [1, 2, 3], [4, 5, 6]);
  expect((await put(upload.intent.uploadUrl, different)).status).toBe(200);
  const read = await app.request(new URL(complete.json.url).pathname);
  expect(Buffer.from(await read.arrayBuffer())).toEqual(Buffer.from(upload.data));
  const retry = await a.req("POST", `/spaces/${spaceId}/media/uploads`, upload.input);
  expect(retry.status).toBe(201);
  expect(readToken(retry.json.uploadUrl.split("/").at(-1), "put")?.k).toContain("-upload.");
  await a.req("POST", `/spaces/${spaceId}/leave`);
  expect((await a.req("POST", `/spaces/${spaceId}/media/${upload.id}/complete`)).status).toBe(403);
});

test("completion independently rejects oversized bucket objects and MIME-spoofed bytes", async () => {
  const { a, spaceId } = await pairedCouple();
  const upload = await reserve(a, spaceId);
  const mainKey = readToken(upload.intent.uploadUrl.split("/").at(-1), "put")?.k;
  const thumbKey = readToken(upload.intent.thumbUploadUrl.split("/").at(-1), "put")?.k;
  if (!mainKey || !thumbKey) throw new Error("Missing upload keys");
  await writeLocal(mainKey, new Uint8Array(upload.input.bytes + 1).buffer);
  await writeLocal(thumbKey, upload.data.buffer);
  expect((await a.req("POST", `/spaces/${spaceId}/media/${upload.id}/complete`)).status).toBe(413);
  await writeLocal(mainKey, new Uint8Array(upload.input.bytes).fill(1).buffer);
  expect((await a.req("POST", `/spaces/${spaceId}/media/${upload.id}/complete`)).status).toBe(422);
});

test("parallel reservations cannot spend the same remaining quota and retries do not charge twice", async () => {
  const { a, spaceId } = await pairedCouple();
  const first = await reserve(a, spaceId);
  const budget = first.input.bytes + first.input.thumbBytes;
  // Leave exactly one additional upload's budget, distributed across valid integer-sized rows.
  const remainingUsed = MEDIA_QUOTA_BYTES - 2 * budget;
  for (const bytes of [2_000_000_000, 2_000_000_000, remainingUsed - 4_000_000_000]) {
    await sql`insert into media (id, space_id, uploaded_by, storage_key, thumb_key, mime, bytes, width, height)
      select gen_random_uuid(), ${spaceId}, uploaded_by, storage_key, thumb_key, mime, ${bytes}, width, height from media where id = ${first.id}`;
  }
  const results = await Promise.all([reserve(a, spaceId), reserve(a, spaceId)]);
  expect(results.map((r) => r.status).sort()).toEqual([201, 413]);
  expect((await a.req("POST", `/spaces/${spaceId}/media/uploads`, first.input)).status).toBe(201);
});

test("account deletion leaves retry metadata after a storage failure and cleanup eventually removes it", async () => {
  const { a, spaceId } = await pairedCouple();
  const upload = await reserve(a, spaceId);
  const original = storage.deletePrefix;
  storage.deletePrefix = async () => {
    throw new Error("temporary storage outage");
  };
  try {
    expect((await a.req("DELETE", "/me")).status).toBe(204);
  } finally {
    storage.deletePrefix = original;
  }
  const [job] = await sql`select prefix from storage_deletion_jobs`;
  expect(job?.prefix).toContain(upload.id);
  const [count] = await sql`select count(*)::int as n from media where id = ${upload.id}`;
  expect(count?.n).toBe(0);
  expect(await runStorageDeletions(new Date(Date.now() + 7 * 60_000))).toBe(1);
  const [left] = await sql`select count(*)::int as n from storage_deletion_jobs`;
  expect(left?.n).toBe(0);
});

test("portable archive includes actual photos, all pack history and Daily without leaking private partner moods", async () => {
  const { a, b, spaceId } = await pairedCouple();
  const { syncQuizContent } = await import("../src/modules/quizzes");
  await syncQuizContent();
  const userId = (await a.req("GET", "/me")).json.profile.id;
  const [question] = await sql`select id, pack_id from quiz_questions where pack_id is not null limit 1`;
  if (!question) throw new Error("Missing synced question");
  for (let i = 0; i < 51; i++) {
    await sql`insert into quiz_sessions (id, space_id, pack_id, kind, question_ids, started_by, ready_at)
      values (gen_random_uuid(), ${spaceId}, ${question.pack_id}, 'pack', ARRAY[${question.id}::uuid], ${userId}, now())`;
  }
  const daily = (await a.req("GET", `/spaces/${spaceId}/daily`)).json;
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  await b.req("PUT", `/spaces/${spaceId}/vibe/${date}`, {
    id: crypto.randomUUID(),
    mood: "calm",
    note: "private partner thought",
    visibility: "private",
  });
  const upload = await reserve(a, spaceId);
  await put(upload.intent.uploadUrl, upload.data);
  await put(upload.intent.thumbUploadUrl, upload.data);
  expect((await a.req("POST", `/spaces/${spaceId}/media/${upload.id}/complete`)).status).toBe(200);
  await a.req("POST", `/spaces/${spaceId}/journal/pages`, {
    id: crypto.randomUUID(),
    pageDate: date,
    block: { id: crypto.randomUUID(), mediaIds: [upload.id] },
  });
  const raw = await app.request(`/v1/spaces/${spaceId}/export/archive`, { headers: { cookie: a.cookie } });
  expect(raw.status).toBe(200);
  expect(raw.headers.get("content-type")).toBe("application/x-tar");
  expect(raw.headers.get("content-disposition")).toContain(".tar");
  const bytes = new Uint8Array(await raw.arrayBuffer());
  const files = new Map<string, Uint8Array>();
  let offset = 0;
  while (offset + 512 <= bytes.length && bytes[offset] !== 0) {
    const header = bytes.subarray(offset, offset + 512);
    const path = Buffer.from(header.subarray(0, 100)).toString().split("\0")[0] ?? "";
    const size = Number.parseInt(Buffer.from(header.subarray(124, 136)).toString(), 8);
    files.set(path, bytes.subarray(offset + 512, offset + 512 + size));
    offset += 512 + Math.ceil(size / 512) * 512;
  }
  const text = Buffer.from(files.get("between.json") ?? []).toString();
  const metadata = JSON.parse(text);
  expect(metadata.quizzes).toHaveLength(52);
  expect(metadata.quizzes.find((q: { id: string }) => q.id === daily.id).partnerAnswers).toBeNull();
  expect(text).not.toContain("private partner thought");
  expect(text).not.toContain("/v1/files/");
  const relativePath = metadata.journal[0].blocks[0].media[0].url;
  expect(Buffer.from(files.get(relativePath) ?? [])).toEqual(Buffer.from(upload.data));
  expect(files.size).toBe(4);
  // Validate interoperability with the platform's standard archive tool, not just our parser.
  const { mkdtemp, rm } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const directory = await mkdtemp(`${tmpdir()}/between-tar-`);
  try {
    const path = `${directory}/export.tar`;
    await Bun.write(path, bytes);
    const process = Bun.spawn(["tar", "-tf", path], { stdout: "pipe", stderr: "pipe" });
    expect(await process.exited).toBe(0);
    expect(await new Response(process.stdout).text()).toContain(relativePath);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
  await a.req("POST", `/spaces/${spaceId}/leave`);
  expect((await app.request(`/v1/spaces/${spaceId}/export/archive`, { headers: { cookie: b.cookie } })).status).toBe(
    200,
  );
});
