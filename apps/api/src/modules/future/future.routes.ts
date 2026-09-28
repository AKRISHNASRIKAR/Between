import { CreateFutureInput, UpdateFutureInput } from "@lovenotes/contracts";
import { Hono } from "hono";
import { z } from "zod";
import { validate } from "../../lib/validate";
import type { AppEnv } from "../../types";
import { addFuture, deleteFuture, listFuture, setFutureDone, updateFuture } from "./future.service";

const P = z.object({ fid: z.uuid() });

/** Mounted under /v1/spaces/:sid/future. */
export const futureRoutes = new Hono<AppEnv>()
  .get("/", async (c) => c.json(await listFuture(c.get("scope"))))
  .post("/", validate("json", CreateFutureInput), async (c) =>
    c.json(await addFuture(c.get("scope"), c.req.valid("json")), 201),
  )
  .patch("/:fid", validate("param", P), validate("json", UpdateFutureInput), async (c) =>
    c.json(await updateFuture(c.get("scope"), c.req.valid("param").fid, c.req.valid("json"))),
  )
  .post("/:fid/complete", validate("param", P), async (c) =>
    c.json(await setFutureDone(c.get("scope"), c.req.valid("param").fid, true)),
  )
  .post("/:fid/uncomplete", validate("param", P), async (c) =>
    c.json(await setFutureDone(c.get("scope"), c.req.valid("param").fid, false)),
  )
  .delete("/:fid", validate("param", P), async (c) => {
    await deleteFuture(c.get("scope"), c.req.valid("param").fid);
    return c.body(null, 204);
  });
