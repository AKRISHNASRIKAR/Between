import { Hono } from "hono";
import type { AppEnv } from "../../types";
import { exportArchive } from "./archive.service";
import { exportSpace } from "./privacy.service";

/** Mounted under /v1/spaces/:sid/export. */
export const exportRoutes = new Hono<AppEnv>()
  .get("/", async (c) => c.json(await exportSpace(c.get("scope"))))
  .get(
    "/archive",
    async (c) =>
      new Response(await exportArchive(c.get("scope")), {
        headers: {
          "Content-Type": "application/x-tar",
          "Content-Disposition": `attachment; filename="between-export-${new Date().toISOString().slice(0, 10)}.tar"`,
          "Cache-Control": "no-store",
        },
      }),
  );
