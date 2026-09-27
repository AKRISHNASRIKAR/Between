import { and, eq, gt, isNull, ne, or } from "drizzle-orm";
import { createMiddleware } from "hono/factory";
import { z } from "zod";
import { db } from "../db/client";
import { spaceMembers, spaces } from "../db/schema";
import { notFound } from "../lib/errors";
import { makeSpaceScope } from "../lib/scope";
import type { AppEnv } from "../types";

const SpaceIdParam = z.uuid();

/**
 * The single gate for every /spaces/:sid/* route.
 * Non-members (and malformed ids) get 404 — never 403 — so space ids can't be probed.
 * Members of a closed space keep read-only access until the purge date.
 */
export const requireSpaceMember = createMiddleware<AppEnv>(async (c, next) => {
  const parsed = SpaceIdParam.safeParse(c.req.param("sid"));
  if (!parsed.success) throw notFound("SPACE_NOT_FOUND");
  const spaceId = parsed.data;
  const user = c.get("user");

  const [row] = await db
    .select({ status: spaces.status, leftAt: spaceMembers.leftAt })
    .from(spaceMembers)
    .innerJoin(spaces, eq(spaces.id, spaceMembers.spaceId))
    .where(
      and(
        eq(spaceMembers.spaceId, spaceId),
        eq(spaceMembers.userId, user.id),
        or(isNull(spaceMembers.leftAt), and(eq(spaces.status, "closed"), gt(spaces.purgeAfter, new Date()))),
      ),
    )
    .limit(1);
  if (!row) throw notFound("SPACE_NOT_FOUND");

  const [partner] = await db
    .select({ userId: spaceMembers.userId })
    .from(spaceMembers)
    .where(and(eq(spaceMembers.spaceId, spaceId), ne(spaceMembers.userId, user.id)))
    .limit(1);

  c.set(
    "scope",
    makeSpaceScope({
      spaceId,
      userId: user.id,
      partnerId: partner?.userId ?? null,
      writable: row.status === "active" && row.leftAt === null,
      timezone: user.timezone,
    }),
  );
  await next();
});
