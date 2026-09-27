import { Hono } from "hono";
import { readToken, safePath, writeLocal } from "./lib/storage";

/**
 * Local-storage file endpoints (dev). Auth is the signed, expiring token itself — like an S3
 * presigned URL — so the image component can load it without cookies.
 */
export const fileRoutes = new Hono()
  .put("/:token", async (c) => {
    const claim = readToken(c.req.param("token"), "put");
    if (!claim) return c.json({ error: { code: "NOT_FOUND", message: "Link expired" } }, 404);
    if (claim.ct && c.req.header("content-type") !== claim.ct)
      return c.json({ error: { code: "VALIDATION_FAILED", message: "Wrong content type" } }, 422);
    const body = await c.req.arrayBuffer();
    if (claim.mx && body.byteLength > claim.mx)
      return c.json({ error: { code: "VALIDATION_FAILED", message: "Too large" } }, 413);
    await writeLocal(claim.k, body);
    return c.body(null, 200);
  })
  .get("/:token", async (c) => {
    const claim = readToken(c.req.param("token"), "get");
    if (!claim) return c.json({ error: { code: "NOT_FOUND", message: "Link expired" } }, 404);
    const file = Bun.file(safePath(claim.k));
    if (!(await file.exists())) return c.json({ error: { code: "NOT_FOUND", message: "Not found" } }, 404);
    c.header("Cache-Control", "private, max-age=3600");
    return new Response(file.stream(), {
      headers: { "Content-Type": file.type, "Cache-Control": "private, max-age=3600" },
    });
  });
