import { createMiddleware } from "hono/factory";
import { auth } from "../auth";
import { unauthenticated } from "../lib/errors";
import type { AppEnv } from "../types";

export const requireUser = createMiddleware<AppEnv>(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) throw unauthenticated();
  const u = session.user as typeof session.user & { timezone?: string };
  c.set("user", { id: u.id, email: u.email, name: u.name, image: u.image ?? null, timezone: u.timezone ?? "UTC" });
  await next();
});
