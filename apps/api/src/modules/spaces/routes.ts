import { CreateSpaceInput, InviteCode, UpdateSpaceInput } from "@lovenotes/contracts";
import { Hono } from "hono";
import { z } from "zod";
import { validate } from "../../lib/validate";
import { requireSpaceMember } from "../../middleware/space";
import type { AppEnv } from "../../types";
import { futureRoutes } from "../future/routes";
import { journalRoutes, mediaRoutes, memoryRoutes } from "../journal/routes";
import { vibeRoutes } from "../moods/routes";
import { noteRoutes } from "../notes/routes";
import { petRoutes } from "../pet/routes";
import { dailyRoutes, quizRoutes } from "../quizzes/routes";
import {
  acceptInvite,
  createInvite,
  createSpace,
  getSpace,
  leaveSpace,
  previewInvite,
  revokeInvites,
  updateSpace,
} from "./service";

const spaceScoped = new Hono<AppEnv>()
  .use(requireSpaceMember)
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
  })
  .route("/pet", petRoutes)
  .route("/vibe", vibeRoutes)
  .route("/notes", noteRoutes)
  .route("/quizzes", quizRoutes)
  .route("/daily", dailyRoutes)
  .route("/future", futureRoutes)
  .route("/journal", journalRoutes)
  .route("/media", mediaRoutes)
  .route("/memories", memoryRoutes);

export const spaceRoutes = new Hono<AppEnv>()
  .post("/", validate("json", CreateSpaceInput), async (c) =>
    c.json(await createSpace(c.get("user"), c.req.valid("json")), 201),
  )
  .route("/:sid", spaceScoped);

const CodeParam = z.object({ code: InviteCode });

export const inviteRoutes = new Hono<AppEnv>()
  .get("/:code", validate("param", CodeParam), async (c) =>
    c.json(await previewInvite(c.get("user"), c.req.valid("param").code)),
  )
  .post("/:code/accept", validate("param", CodeParam), async (c) =>
    c.json(await acceptInvite(c.get("user"), c.req.valid("param").code)),
  );
