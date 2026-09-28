import { PetInteractionInput, PetNameInput } from "@lovenotes/contracts";
import { Hono } from "hono";
import { validate } from "../../lib/validate";
import type { AppEnv } from "../../types";
import { care, getPet, nameStep, timeline } from "./pet.service";

/** Mounted under /v1/spaces/:sid/pet. */
export const petRoutes = new Hono<AppEnv>()
  .get("/", async (c) => c.json(await getPet(c.get("scope"))))
  .get("/timeline", async (c) => c.json(await timeline(c.get("scope"))))
  .post("/interactions", validate("json", PetInteractionInput), async (c) =>
    c.json(await care(c.get("scope"), c.req.valid("json"))),
  )
  .post("/name", validate("json", PetNameInput), async (c) =>
    c.json(await nameStep(c.get("scope"), c.req.valid("json"))),
  );
