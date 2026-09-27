import { websocket } from "hono/bun";
import { app } from "./app";
import { env } from "./env";
import { realtime } from "./realtime/hub";

const server = Bun.serve({ port: env.PORT, hostname: "0.0.0.0", fetch: app.fetch, websocket });
realtime.bind((topic, data) => server.publish(topic, data));

console.info(`💌 api listening on http://localhost:${server.port}`);
