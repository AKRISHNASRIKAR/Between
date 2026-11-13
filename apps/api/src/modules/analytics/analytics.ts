import { AnalyticsEventName, WidgetAnalyticsInput } from "@lovenotes/contracts";
import type { MiddlewareHandler } from "hono";
import { Hono } from "hono";
import { z } from "zod";
import type { Tx } from "../../db/client";
import { db } from "../../db/client";
import type { SpaceScope } from "../../lib/scope";
import { validate } from "../../lib/validate";
import type { AppEnv } from "../../types";
import { activeScope } from "../members";
import { analyticsRepo } from "./analytics.repo";

export async function recordEvent(
  userId: string,
  spaceId: string | null,
  name: string,
  entityId: string | null = null,
  id?: string,
) {
  if (!AnalyticsEventName.safeParse(name).success) return;
  await analyticsRepo.record(userId, spaceId, name, entityId, id);
}

/** Called within shared-write transactions, including when the optional pet is disabled. */
export async function recordSharedActivity(tx: Tx, scope: SpaceScope, kind: string, subjectId?: string) {
  const meaningful = new Set([
    "note.created",
    "journal.block_added",
    "media.added",
    "mood.shared",
    "quiz.completed_both",
    "daily.answered_both",
    "future.completed",
  ]);
  if (!scope.partnerId || !meaningful.has(kind)) return;
  await analyticsRepo.record(scope.userId, scope.spaceId, "first_shared_interaction", scope.spaceId, undefined, tx);
  // Future completion is recorded at its actual state transition, not every successful PATCH.
  if (kind === "future.completed" && subjectId)
    await analyticsRepo.record(scope.userId, scope.spaceId, "future_item_completed", subjectId, undefined, tx);
}

const uuid = (value: unknown) => (z.uuid().safeParse(value).success ? (value as string) : null);

/** Observe actual success routes; only whitelisted IDs (never bodies/content) are stored. */
export const observeEvents: MiddlewareHandler<AppEnv> = async (c, next) => {
  await next();
  if (c.res.status >= 300 || !c.get("user")) return;
  const path = c.req.path.replace(/\/$/, "");
  const method = c.req.method;
  const scope = c.get("scope");
  try {
    const value = c.res.status === 204 ? null : await c.res.clone().json();
    let name: string | undefined;
    let entity = uuid(value?.id);
    let spaceId: string | null = scope?.spaceId ?? null;
    if (method === "POST") {
      if (path === "/v1/spaces") {
        name = "space_created";
        spaceId = entity;
      } else if (/^\/v1\/spaces\/[^/]+\/invites$/.test(path)) name = "partner_invited";
      else if (/^\/v1\/invites\/[^/]+\/accept$/.test(path)) {
        name = "partner_joined";
        spaceId = entity;
      } else if (/^\/v1\/spaces\/[^/]+\/notes$/.test(path)) name = "note_created";
      else if (/^\/v1\/spaces\/[^/]+\/notes\/[^/]+\/open$/.test(path) && value?.openedAt) name = "note_opened";
      else if (/^\/v1\/spaces\/[^/]+\/quizzes$/.test(path)) name = "quiz_started";
      else if (/^\/v1\/spaces\/[^/]+\/quizzes\/[^/]+\/complete$/.test(path) && value?.myCompletedAt)
        name = "quiz_completed";
      else if (/^\/v1\/spaces\/[^/]+\/quizzes\/[^/]+\/seen$/.test(path)) {
        // The 204 route also accepts premature reads; verify reveal actually unlocked.
        const qid = uuid(path.split("/").at(-2));
        if (qid && scope) {
          const { getSession } = await import("../quizzes");
          const quiz = await getSession(scope, qid);
          if (quiz.readyAt) {
            name = "quiz_revealed";
            entity = qid;
          }
        }
      } else if (/^\/v1\/spaces\/[^/]+\/journal\/pages(?:\/[^/]+\/blocks)?$/.test(path)) {
        const input = await c.req.json();
        entity = uuid(path.endsWith("/blocks") ? input.id : input.block?.id);
        if (entity && value?.blocks?.some((block: { id: string }) => block.id === entity))
          name = "journal_entry_created";
      } else if (/^\/v1\/spaces\/[^/]+\/media\/[^/]+\/complete$/.test(path)) name = "memory_added";
    }
    if (method === "PUT" && /^\/v1\/spaces\/[^/]+\/vibe\/\d{4}-\d{2}-\d{2}$/.test(path)) {
      name = "mood_checked";
      entity = uuid(value?.me?.id);
      if (value?.me?.visibility === "shared" && entity)
        await recordEvent(c.get("user").id, spaceId, "mood_shared", entity);
    }
    if (name) await recordEvent(c.get("user").id, spaceId, name, entity);
  } catch {
    /* Analytics never changes the result of a successful action. */
  }
};

export const analyticsRoutes = new Hono<AppEnv>().post("/", validate("json", WidgetAnalyticsInput), async (c) => {
  const input = c.req.valid("json");
  try {
    const scope = await activeScope(db, c.get("user"));
    await recordEvent(c.get("user").id, scope?.writable ? scope.spaceId : null, input.name, null, input.id);
  } catch {
    /* Telemetry is best effort. */
  }
  return c.body(null, 204);
});
