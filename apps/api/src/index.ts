import { websocket } from "hono/bun";
import { app } from "./app";
import { env } from "./env";
import { runCleanup } from "./modules/lifecycle/service";
import { syncQuizContent } from "./modules/quizzes/content-sync";
import { realtime } from "./realtime/hub";

const server = Bun.serve({ port: env.PORT, hostname: "0.0.0.0", fetch: app.fetch, websocket });
realtime.bind((topic, data) => server.publish(topic, data));

// Quiz content lives in the repo; keep the DB in sync on every boot (idempotent, ~ms).
syncQuizContent()
  .then((r) => console.info(`📚 quiz content: ${r.packs} packs, ${r.questions} questions`))
  .catch((e) => console.error("quiz content sync failed", e));

// Hourly housekeeping: purge closed spaces past their 30 days, remove abandoned uploads.
const cleanup = () =>
  runCleanup()
    .then((r) => (r.spacesPurged || r.uploadsRemoved) && console.info("🧹 cleanup", r))
    .catch((e) => console.error("cleanup failed", e));
setTimeout(cleanup, 10_000);
setInterval(cleanup, 60 * 60 * 1000);

console.info(`💌 api listening on http://localhost:${server.port}`);
