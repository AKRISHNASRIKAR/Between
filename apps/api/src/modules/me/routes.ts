import { UpdateMeInput } from "@lovenotes/contracts";
import { Hono } from "hono";
import { validate } from "../../lib/validate";
import type { AppEnv } from "../../types";
import { deleteAccount } from "../lifecycle/service";
import { notificationRoutes } from "../notifications/routes";
import { getMe, updateMe } from "./service";

export const meRoutes = new Hono<AppEnv>()
  .get("/", async (c) => c.json(await getMe(c.get("user"))))
  .patch("/", validate("json", UpdateMeInput), async (c) => c.json(await updateMe(c.get("user"), c.req.valid("json"))))
  .delete("/", async (c) => {
    await deleteAccount(c.get("user"));
    return c.body(null, 204);
  })
  .route("/", notificationRoutes);
