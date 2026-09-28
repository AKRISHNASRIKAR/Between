import type { ApiErrorBody } from "@lovenotes/contracts";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import { auth } from "./auth";
import { env, isDev } from "./env";
import { fileRoutes } from "./http/files.routes";
import { requireSpaceMember } from "./http/require-space-member";
import { requireUser } from "./http/require-user";
import { AppError } from "./lib/errors";
import { devRoutes } from "./modules/dev";
import { futureRoutes } from "./modules/future";
import { journalRoutes, mediaRoutes, memoryRoutes } from "./modules/journal";
import { meRoutes } from "./modules/me";
import { noteRoutes } from "./modules/notes";
import { petRoutes } from "./modules/pet";
import { exportRoutes } from "./modules/privacy";
import { dailyRoutes, quizPackRoutes, quizRoutes } from "./modules/quizzes";
import { createSpaceRoutes, inviteRoutes, spaceRoutes } from "./modules/spaces";
import { vibeRoutes } from "./modules/vibes";
import { widgetRoutes } from "./modules/widget";
import { realtimeHandler } from "./realtime/ws";
import type { AppEnv } from "./types";

/**
 * Everything under /v1/spaces/:sid. The membership gate runs first and puts a SpaceScope on
 * the context; feature routers only ever read `c.get("scope")` (ADR 0002).
 */
const spaceScoped = new Hono<AppEnv>()
  .use(requireSpaceMember)
  .route("/", spaceRoutes)
  .route("/pet", petRoutes)
  .route("/vibe", vibeRoutes)
  .route("/notes", noteRoutes)
  .route("/quizzes", quizRoutes)
  .route("/daily", dailyRoutes)
  .route("/future", futureRoutes)
  .route("/journal", journalRoutes)
  .route("/media", mediaRoutes)
  .route("/memories", memoryRoutes)
  .route("/export", exportRoutes)
  .route("/widget", widgetRoutes);

/** Authenticated JSON API. Its type drives the mobile app's typed client. */
export const v1 = new Hono<AppEnv>()
  .use(requireUser)
  .route("/me", meRoutes)
  .route("/spaces", createSpaceRoutes)
  .route("/spaces/:sid", spaceScoped)
  .route("/invites", inviteRoutes)
  .route("/quiz-packs", quizPackRoutes)
  .route("/dev", devRoutes);

export const app = new Hono<AppEnv>();

app.use(requestId());
if (isDev) app.use(cors({ origin: (o) => o, credentials: true }));
app.use("*", async (c, next) => {
  await next();
  if (!c.req.path.startsWith("/v1/files/")) c.header("Cache-Control", "no-store");
});

app.get("/health", (c) => c.json({ ok: true }));
app.on(["GET", "POST"], "/v1/auth/*", (c) => auth.handler(c.req.raw));
app.get("/v1/realtime", realtimeHandler);
// Local disk storage endpoints exist only when not using a real bucket.
if (env.STORAGE_DRIVER === "local") app.route("/v1/files", fileRoutes);
app.route("/v1", v1);

app.notFound((c) => c.json<ApiErrorBody>({ error: { code: "NOT_FOUND", message: "Not found" } }, 404));
app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json<ApiErrorBody>(
      { error: { code: err.code, message: err.message, ...(err.fields && { fields: err.fields }) } },
      err.status,
    );
  }
  // Never log request bodies — they may contain private content.
  console.error(`[${c.get("requestId")}] ${c.req.method} ${c.req.path}`, err);
  return c.json<ApiErrorBody>({ error: { code: "INTERNAL", message: "Something went wrong" } }, 500);
});
