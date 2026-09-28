import { AddBlockInput, CreatePageInput, UploadIntentInput } from "@lovenotes/contracts";
import { Hono } from "hono";
import { z } from "zod";
import { validate } from "../../lib/validate";
import type { AppEnv } from "../../types";
import { addBlock, createPage, deleteBlock, editBlock, getPage, listPages, lovePage } from "./journal.service";
import { completeUpload, createUpload, listMemories } from "./media.service";

const PageP = z.object({ pid: z.uuid() });
const BlockP = z.object({ bid: z.uuid() });
const MediaP = z.object({ mid: z.uuid() });
const Cursor = z.object({ cursor: z.string().optional() });
const EditBlock = z.object({ body: z.string().trim().min(1).max(5000), version: z.number().int() });

/** Mounted under /v1/spaces/:sid/journal. */
export const journalRoutes = new Hono<AppEnv>()
  .get("/pages", validate("query", Cursor), async (c) =>
    c.json(await listPages(c.get("scope"), c.req.valid("query").cursor)),
  )
  .post("/pages", validate("json", CreatePageInput), async (c) =>
    c.json(await createPage(c.get("scope"), c.req.valid("json")), 201),
  )
  .get("/pages/:pid", validate("param", PageP), async (c) =>
    c.json(await getPage(c.get("scope"), c.req.valid("param").pid)),
  )
  .post("/pages/:pid/blocks", validate("param", PageP), validate("json", AddBlockInput), async (c) =>
    c.json(await addBlock(c.get("scope"), c.req.valid("param").pid, c.req.valid("json"))),
  )
  .put("/pages/:pid/reaction", validate("param", PageP), async (c) =>
    c.json(await lovePage(c.get("scope"), c.req.valid("param").pid, true)),
  )
  .delete("/pages/:pid/reaction", validate("param", PageP), async (c) =>
    c.json(await lovePage(c.get("scope"), c.req.valid("param").pid, false)),
  )
  .patch("/blocks/:bid", validate("param", BlockP), validate("json", EditBlock), async (c) => {
    const j = c.req.valid("json");
    return c.json(await editBlock(c.get("scope"), c.req.valid("param").bid, j.body, j.version));
  })
  .delete("/blocks/:bid", validate("param", BlockP), async (c) => {
    await deleteBlock(c.get("scope"), c.req.valid("param").bid);
    return c.body(null, 204);
  });

/** Mounted under /v1/spaces/:sid/media. */
export const mediaRoutes = new Hono<AppEnv>()
  .post("/uploads", validate("json", UploadIntentInput), async (c) =>
    c.json(await createUpload(c.get("scope"), c.req.valid("json")), 201),
  )
  .post("/:mid/complete", validate("param", MediaP), async (c) =>
    c.json(await completeUpload(c.get("scope"), c.req.valid("param").mid)),
  );

/** Mounted under /v1/spaces/:sid/memories. */
export const memoryRoutes = new Hono<AppEnv>().get("/", validate("query", Cursor), async (c) =>
  c.json(await listMemories(c.get("scope"), c.req.valid("query").cursor)),
);
