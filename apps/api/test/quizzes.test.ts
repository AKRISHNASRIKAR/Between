import { beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { syncQuizContent } from "../src/modules/quizzes";
import { pairedCouple, resetDb } from "./helpers";

beforeAll(async () => {
  await resetDb();
});
beforeEach(async () => {
  await resetDb();
  await syncQuizContent();
});

async function startChaos(a: Awaited<ReturnType<typeof pairedCouple>>["a"], spaceId: string) {
  const packs = (await a.req("GET", "/quiz-packs")).json as Array<{ id: string; slug: string }>;
  const pack = packs.find((p) => p.slug === "chaos-couple");
  if (!pack) throw new Error("no pack");
  return (await a.req("POST", `/spaces/${spaceId}/quizzes`, { id: crypto.randomUUID(), packId: pack.id })).json;
}

async function answerAll(
  c: Awaited<ReturnType<typeof pairedCouple>>["a"],
  spaceId: string,
  session: { id: string; questions: Array<{ id: string; kind: string; options: Array<{ id: string }> | null }> },
  who: "me" | "partner" = "me",
) {
  for (const q of session.questions) {
    const body =
      q.kind === "choice"
        ? { choice: q.options?.[0]?.id, guess: q.options?.[1]?.id }
        : q.kind === "who"
          ? { who }
          : { text: "a secret answer" };
    const r = await c.req("PUT", `/spaces/${spaceId}/quizzes/${session.id}/answers/${q.id}`, body);
    expect(r.status).toBe(200);
  }
}

describe("quiz catalog", () => {
  test("packs come from content with question counts", async () => {
    const { a } = await pairedCouple();
    const packs = (await a.req("GET", "/quiz-packs")).json;
    expect(packs.length).toBeGreaterThanOrEqual(5);
    expect(packs.every((p: { questionCount: number }) => p.questionCount >= 3)).toBe(true);
  });
});

describe("quiz secrecy (SPEC §8.3)", () => {
  test("partner answers are hidden until BOTH complete, then revealed with a result", async () => {
    const { a, b, spaceId } = await pairedCouple();
    const s = await startChaos(a, spaceId);
    await answerAll(a, spaceId, s, "me");
    const done = (await a.req("POST", `/spaces/${spaceId}/quizzes/${s.id}/complete`)).json;
    expect(done.readyAt).toBeNull();

    // B sees A's progress, never A's answers
    const bView = (await b.req("GET", `/spaces/${spaceId}/quizzes/${s.id}`)).json;
    expect(bView.partnerAnsweredCount).toBe(s.questions.length);
    expect(bView.partnerAnswers).toBeNull();
    expect(bView.result).toBeNull();
    expect(JSON.stringify(bView)).not.toContain("secret");

    await answerAll(b, spaceId, bView, "partner");
    const ready = (await b.req("POST", `/spaces/${spaceId}/quizzes/${s.id}/complete`)).json;
    expect(ready.readyAt).not.toBeNull();
    expect(ready.partnerAnswers).toHaveLength(s.questions.length);
    expect(ready.result.label).toBe("chaos_couple");
    // "me" from A and "partner" from B point at the same person → full agreement
    expect(ready.result.agreed).toBe(s.questions.length);

    const aView = (await a.req("GET", `/spaces/${spaceId}/quizzes/${s.id}`)).json;
    expect(aView.partnerAnswers).toHaveLength(s.questions.length);
  });

  test("answers are locked after completing, and completing needs every answer", async () => {
    const { a, spaceId } = await pairedCouple();
    const s = await startChaos(a, spaceId);
    const early = await a.req("POST", `/spaces/${spaceId}/quizzes/${s.id}/complete`);
    expect(early.status).toBe(422);
    await answerAll(a, spaceId, s);
    await a.req("POST", `/spaces/${spaceId}/quizzes/${s.id}/complete`);
    const change = await a.req("PUT", `/spaces/${spaceId}/quizzes/${s.id}/answers/${s.questions[0].id}`, {
      who: "partner",
    });
    expect(change.status).toBe(409);
  });

  test("starting the same pack twice resumes the active session", async () => {
    const { a, b, spaceId } = await pairedCouple();
    const s1 = await startChaos(a, spaceId);
    const s2 = await startChaos(b, spaceId);
    expect(s2.id).toBe(s1.id);
  });

  test("choice answers are validated against the options", async () => {
    const { a, spaceId } = await pairedCouple();
    const packs = (await a.req("GET", "/quiz-packs")).json as Array<{ id: string; slug: string }>;
    const pack = packs.find((p) => p.slug === "favorites-round");
    const s = (await a.req("POST", `/spaces/${spaceId}/quizzes`, { id: crypto.randomUUID(), packId: pack?.id })).json;
    const choiceQ = s.questions.find((q: { kind: string }) => q.kind === "choice");
    const r = await a.req("PUT", `/spaces/${spaceId}/quizzes/${s.id}/answers/${choiceQ.id}`, {
      choice: "not-an-option",
    });
    expect(r.status).toBe(422);
  });
});

describe("daily question", () => {
  test("is the same session for both of you today, and reveals when both answer", async () => {
    const { a, b, spaceId } = await pairedCouple();
    const da = (await a.req("GET", `/spaces/${spaceId}/daily`)).json;
    const db = (await b.req("GET", `/spaces/${spaceId}/daily`)).json;
    expect(da.id).toBe(db.id);
    expect(da.questions).toHaveLength(1);
    await answerAll(a, spaceId, da);
    await a.req("POST", `/spaces/${spaceId}/quizzes/${da.id}/complete`);
    await answerAll(b, spaceId, db);
    const done = (await b.req("POST", `/spaces/${spaceId}/quizzes/${db.id}/complete`)).json;
    expect(done.readyAt).not.toBeNull();
  });
});

describe("simulated partner", () => {
  test("answers everything open so you can see a reveal", async () => {
    const { a, spaceId } = await pairedCouple();
    const s = await startChaos(a, spaceId);
    await answerAll(a, spaceId, s);
    await a.req("POST", `/spaces/${spaceId}/quizzes/${s.id}/complete`);
    await a.req("POST", "/dev/partner/act", { type: "quiz.answerAll" });
    const after = (await a.req("GET", `/spaces/${spaceId}/quizzes/${s.id}`)).json;
    expect(after.readyAt).not.toBeNull();
    expect(after.result).not.toBeNull();
  });
});
