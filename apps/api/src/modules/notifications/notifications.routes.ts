import { PushTokenInput, UpdateNotificationPrefs } from "@lovenotes/contracts";
import { Hono } from "hono";
import { z } from "zod";
import { validate } from "../../lib/validate";
import type { AppEnv } from "../../types";
import { getPrefs, registerToken, removeToken, updatePrefs } from "./notifications.service";

const TokenParam = z.object({ token: z.string().min(10).max(300) });

/** Mounted under /v1/me. */
export const notificationRoutes = new Hono<AppEnv>()
  .get("/notification-prefs", async (c) => c.json(await getPrefs(c.get("user").id)))
  .put("/notification-prefs", validate("json", UpdateNotificationPrefs), async (c) =>
    c.json(await updatePrefs(c.get("user").id, c.req.valid("json"))),
  )
  .put("/push-tokens/:token", validate("param", TokenParam), validate("json", PushTokenInput), async (c) => {
    await registerToken(c.get("user").id, c.req.valid("param").token, c.req.valid("json").platform);
    return c.body(null, 204);
  })
  .delete("/push-tokens/:token", validate("param", TokenParam), async (c) => {
    await removeToken(c.get("user").id, c.req.valid("param").token);
    return c.body(null, 204);
  });
