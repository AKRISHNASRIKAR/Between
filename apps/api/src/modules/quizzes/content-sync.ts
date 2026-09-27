import { DailyPoolContent, PackContent } from "@lovenotes/contracts";
import { Glob } from "bun";
import { notInArray, sql } from "drizzle-orm";
import { db } from "../../db/client";
import { quizPacks, quizQuestions } from "../../db/schema";
import { newId } from "../../lib/ids";

const CONTENT_DIR = new URL("../../../../../content/quizzes", import.meta.url).pathname;

/**
 * Upsert quiz packs + questions from /content/quizzes/*.json (validated by contracts).
 * Idempotent. Questions/packs removed from content are unpublished, never deleted —
 * old sessions keep pointing at them.
 */
export async function syncQuizContent(dir = CONTENT_DIR): Promise<{ packs: number; questions: number }> {
  const seenPacks: string[] = [];
  const seenQuestions: string[] = [];

  for await (const file of new Glob("*.json").scan(dir)) {
    const raw = JSON.parse(await Bun.file(`${dir}/${file}`).text());
    if (file === "daily.json") {
      const pool = DailyPoolContent.parse(raw);
      for (const [i, q] of pool.questions.entries()) {
        seenQuestions.push(q.slug);
        const values = {
          kind: q.kind,
          promptSelf: q.promptSelf,
          promptGuess: q.promptGuess ?? null,
          options: q.options ?? null,
          position: i,
          isDaily: true,
          isPublished: true,
          packId: null,
        };
        await db
          .insert(quizQuestions)
          .values({ id: newId(), slug: q.slug, ...values })
          .onConflictDoUpdate({ target: quizQuestions.slug, set: values });
      }
      continue;
    }
    const pack = PackContent.parse(raw);
    seenPacks.push(pack.slug);
    const packValues = {
      category: pack.category,
      title: pack.title,
      subtitle: pack.subtitle,
      sort: pack.sort,
      isPublished: true,
    };
    const [row] = await db
      .insert(quizPacks)
      .values({ id: newId(), slug: pack.slug, ...packValues })
      .onConflictDoUpdate({ target: quizPacks.slug, set: packValues })
      .returning({ id: quizPacks.id });
    if (!row) continue;
    for (const [i, q] of pack.questions.entries()) {
      seenQuestions.push(q.slug);
      const values = {
        kind: q.kind,
        promptSelf: q.promptSelf,
        promptGuess: q.promptGuess ?? null,
        options: q.options ?? null,
        position: i,
        isDaily: false,
        isPublished: true,
        packId: row.id,
      };
      await db
        .insert(quizQuestions)
        .values({ id: newId(), slug: q.slug, ...values })
        .onConflictDoUpdate({ target: quizQuestions.slug, set: values });
    }
  }

  if (seenPacks.length)
    await db.update(quizPacks).set({ isPublished: false }).where(notInArray(quizPacks.slug, seenPacks));
  if (seenQuestions.length)
    await db.update(quizQuestions).set({ isPublished: false }).where(notInArray(quizQuestions.slug, seenQuestions));
  const [c] = await db.select({ n: sql<number>`count(*)::int` }).from(quizQuestions);
  return { packs: seenPacks.length, questions: c?.n ?? 0 };
}

if (import.meta.main) {
  const r = await syncQuizContent();
  console.log(`quiz content synced: ${r.packs} packs, ${r.questions} questions`);
  process.exit(0);
}
