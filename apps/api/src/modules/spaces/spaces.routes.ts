import { CreateSpaceInput, InviteCode, UpdateSpaceInput } from "@lovenotes/contracts";
import { Hono } from "hono";
import { z } from "zod";
import { validate } from "../../lib/validate";
import type { AppEnv } from "../../types";
import {
  acceptInvite,
  createInvite,
  createSpace,
  getSpace,
  leaveSpace,
  previewInvite,
  revokeInvites,
  updateSpace,
} from "./spaces.service";

/** POST /v1/spaces — create a space (no membership yet, so not behind the space gate). */
export const createSpaceRoutes = new Hono<AppEnv>().post("/", validate("json", CreateSpaceInput), async (c) =>
  c.json(await createSpace(c.get("user"), c.req.valid("json")), 201),
);

/** Mounted under /v1/spaces/:sid (behind requireSpaceMember). */
export const spaceRoutes = new Hono<AppEnv>()
  .get("/", async (c) => c.json(await getSpace(c.get("scope"))))
  .patch("/", validate("json", UpdateSpaceInput), async (c) =>
    c.json(await updateSpace(c.get("scope"), c.req.valid("json"))),
  )
  .post("/invites", async (c) => c.json(await createInvite(c.get("scope")), 201))
  .delete("/invites/current", async (c) => {
    await revokeInvites(c.get("scope"));
    return c.body(null, 204);
  })
  .post("/leave", async (c) => {
    await leaveSpace(c.get("scope"));
    return c.body(null, 204);
  });

const CodeParam = z.object({ code: InviteCode });

/** Mounted under /v1/invites. */
export const inviteRoutes = new Hono<AppEnv>()
  .get("/:code", validate("param", CodeParam), async (c) =>
    c.json(await previewInvite(c.get("user"), c.req.valid("param").code)),
  )
  .post("/:code/accept", validate("param", CodeParam), async (c) =>
    c.json(await acceptInvite(c.get("user"), c.req.valid("param").code)),
  );
