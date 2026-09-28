import { UpdateMeInput } from "@lovenotes/contracts";
import { Hono } from "hono";
import { validate } from "../../lib/validate";
import type { AppEnv } from "../../types";
import { notificationRoutes } from "../notifications";
import { deleteAccount, getMe, updateMe } from "./me.service";

/** Mounted under /v1/me: my profile, my account, and my notification settings. */
export const meRoutes = new Hono<AppEnv>()
  .get("/", async (c) => c.json(await getMe(c.get("user"))))
  .patch("/", validate("json", UpdateMeInput), async (c) => c.json(await updateMe(c.get("user"), c.req.valid("json"))))
  .delete("/", async (c) => {
    await deleteAccount(c.get("user"));
    return c.body(null, 204);
  })
  .route("/", notificationRoutes);
