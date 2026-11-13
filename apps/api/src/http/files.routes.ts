import { Hono } from "hono";
import { readToken, safePath, writeLocal } from "../lib/storage";

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
    const maxBytes = claim.mx ?? 10 * 1024 * 1024;
    const declared = Number(c.req.header("content-length"));
    if (Number.isFinite(declared) && declared > maxBytes)
      return c.json({ error: { code: "VALIDATION_FAILED", message: "Too large" } }, 413);
    const reader = c.req.raw.body?.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    if (reader) {
      while (true) {
        const next = await reader.read();
        if (next.done) break;
        size += next.value.byteLength;
        if (size > maxBytes) {
          await reader.cancel();
          return c.json({ error: { code: "VALIDATION_FAILED", message: "Too large" } }, 413);
        }
        chunks.push(next.value);
      }
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    await writeLocal(claim.k, bytes.buffer);
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
