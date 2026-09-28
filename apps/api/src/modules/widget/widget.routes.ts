import { Hono } from "hono";
import type { AppEnv } from "../../types";
import { widgetSnapshot } from "./widget.service";

/** Mounted under /v1/spaces/:sid/widget. */
export const widgetRoutes = new Hono<AppEnv>().get("/", async (c) => c.json(await widgetSnapshot(c.get("scope"))));
