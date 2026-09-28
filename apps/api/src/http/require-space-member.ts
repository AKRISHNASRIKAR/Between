import { createMiddleware } from "hono/factory";
import { z } from "zod";
import { db } from "../db/client";
import { notFound } from "../lib/errors";
import { makeSpaceScope } from "../lib/scope";
import { membersRepo } from "../modules/members";
import type { AppEnv } from "../types";

const SpaceIdParam = z.uuid();

/**
 * The single gate for every /spaces/:sid/* route (ADR 0002). Non-members and malformed ids
 * get 404 — never 403 — so space ids can't be probed.
 */
export const requireSpaceMember = createMiddleware<AppEnv>(async (c, next) => {
  const parsed = SpaceIdParam.safeParse(c.req.param("sid"));
  if (!parsed.success) throw notFound("SPACE_NOT_FOUND");
  const user = c.get("user");
  const access = await membersRepo.access(db, parsed.data, user.id);
  if (!access) throw notFound("SPACE_NOT_FOUND");
  c.set("scope", makeSpaceScope({ spaceId: parsed.data, userId: user.id, timezone: user.timezone, ...access }));
  await next();
});
