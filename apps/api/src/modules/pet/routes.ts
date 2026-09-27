import { PetInteractionInput, PetNameInput } from "@lovenotes/contracts";
import { Hono } from "hono";
import { validate } from "../../lib/validate";
import type { AppEnv } from "../../types";
import { getPet, interact, nameStep } from "./service";

export const petRoutes = new Hono<AppEnv>()
  .get("/", async (c) => c.json(await getPet(c.get("scope"))))
  .post("/interactions", validate("json", PetInteractionInput), async (c) =>
    c.json(await interact(c.get("scope"), c.req.valid("json"))),
  )
  .post("/name", validate("json", PetNameInput), async (c) =>
    c.json(await nameStep(c.get("scope"), c.req.valid("json"))),
  );
