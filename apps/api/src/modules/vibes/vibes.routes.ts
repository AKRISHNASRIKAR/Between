import { UpsertMoodInput } from "@lovenotes/contracts";
import { Hono } from "hono";
import { z } from "zod";
import { validate } from "../../lib/validate";
import type { AppEnv } from "../../types";
import { getVibe, upsertVibe, vibeMonth } from "./vibes.service";

const DateQ = z.object({ date: z.iso.date() });
const MonthQ = z.object({ month: z.string().regex(/^\d{4}-\d{2}$/) });

/** Mounted under /v1/spaces/:sid/vibe. */
export const vibeRoutes = new Hono<AppEnv>()
  .get("/", validate("query", DateQ), async (c) => c.json(await getVibe(c.get("scope"), c.req.valid("query").date)))
  .put("/:date", validate("param", DateQ), validate("json", UpsertMoodInput), async (c) =>
    c.json(await upsertVibe(c.get("scope"), c.req.valid("param").date, c.req.valid("json"))),
  )
  .get("/history", validate("query", MonthQ), async (c) =>
    c.json(await vibeMonth(c.get("scope"), c.req.valid("query").month)),
  );
