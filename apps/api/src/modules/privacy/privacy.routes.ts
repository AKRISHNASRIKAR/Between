import { Hono } from "hono";
import type { AppEnv } from "../../types";
import { exportSpace } from "./privacy.service";

/** Mounted under /v1/spaces/:sid/export. */
export const exportRoutes = new Hono<AppEnv>().get("/", async (c) => c.json(await exportSpace(c.get("scope"))));
