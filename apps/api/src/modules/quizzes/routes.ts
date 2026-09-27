import { AnswerInput, StartQuizInput } from "@lovenotes/contracts";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../../db/client";
import { validate } from "../../lib/validate";
import type { AppEnv } from "../../types";
import { answer, complete, getDaily, getSession, listPacks, listSessions, markRevealSeen, startPack } from "./service";

const Q = z.object({ qid: z.uuid() });
const QA = z.object({ qid: z.uuid(), questionId: z.uuid() });

/** Global catalog (auth required, not space-scoped). */
export const quizPackRoutes = new Hono<AppEnv>().get("/", async (c) => c.json(await listPacks(db)));

export const quizRoutes = new Hono<AppEnv>()
  .get("/", async (c) => c.json(await listSessions(c.get("scope"))))
  .post("/", validate("json", StartQuizInput), async (c) =>
    c.json(await startPack(c.get("scope"), c.req.valid("json")), 201),
  )
  .get("/:qid", validate("param", Q), async (c) => c.json(await getSession(c.get("scope"), c.req.valid("param").qid)))
  .put("/:qid/answers/:questionId", validate("param", QA), validate("json", AnswerInput), async (c) => {
    const p = c.req.valid("param");
    return c.json(await answer(c.get("scope"), p.qid, p.questionId, c.req.valid("json")));
  })
  .post("/:qid/complete", validate("param", Q), async (c) =>
    c.json(await complete(c.get("scope"), c.req.valid("param").qid)),
  )
  .post("/:qid/seen", validate("param", Q), async (c) => {
    await markRevealSeen(c.get("scope"), c.req.valid("param").qid);
    return c.body(null, 204);
  });

export const dailyRoutes = new Hono<AppEnv>().get("/", async (c) => c.json(await getDaily(c.get("scope"))));
