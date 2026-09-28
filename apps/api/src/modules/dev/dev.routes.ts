import { DevPartnerAction, DevPartnerInput } from "@lovenotes/contracts";
import { Hono } from "hono";
import { validate } from "../../lib/validate";
import type { AppEnv } from "../../types";
import { assertDevTools, devCreatePartner, devPartnerAct, devStatus } from "./dev.service";

/** Dev-only simulated partner. 404 unless DEV_TOOLS=true (and never in production). */
export const devRoutes = new Hono<AppEnv>()
  .use(async (_c, next) => {
    assertDevTools();
    await next();
  })
  .get("/partner", async (c) => c.json(await devStatus(c.get("user"))))
  .post("/partner", validate("json", DevPartnerInput), async (c) =>
    c.json(await devCreatePartner(c.get("user"), c.req.valid("json").name)),
  )
  .post("/partner/act", validate("json", DevPartnerAction), async (c) =>
    c.json(await devPartnerAct(c.get("user"), c.req.valid("json"))),
  );
