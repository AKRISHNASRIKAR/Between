import type { ClientMessage, ServerEvent } from "@lovenotes/contracts";
import type { ServerWebSocket } from "bun";
import { upgradeWebSocket } from "hono/bun";
import { auth } from "../auth";
import { db } from "../db/client";
import { membersRepo } from "../modules/members";
import { realtime, topicFor } from "./hub";

const AUTH_TIMEOUT_MS = 5_000;

type Conn = { userId: string; spaceId: string } | null;

/**
 * WebSocket endpoint. The client authenticates with its first message (never via URL).
 * The server — not the client — decides which space's topic the socket joins.
 */
export const realtimeHandler = upgradeWebSocket((c) => {
  // Browsers send the session cookie with the upgrade; native clients send it in the auth message.
  const upgradeCookie = c.req.header("cookie") ?? "";
  let conn: Conn = null;
  let timer: ReturnType<typeof setTimeout> | undefined;

  return {
    onOpen(_evt, ws) {
      timer = setTimeout(() => ws.close(4401, "auth timeout"), AUTH_TIMEOUT_MS);
    },
    async onMessage(evt, ws) {
      let msg: ClientMessage;
      try {
        msg = JSON.parse(String(evt.data)) as ClientMessage;
      } catch {
        return;
      }
      if (msg.t === "ping") return;
      if (msg.t !== "auth" || conn) return;

      clearTimeout(timer);
      const session = await auth.api.getSession({ headers: new Headers({ cookie: msg.token || upgradeCookie }) });
      if (!session) return ws.close(4401, "unauthenticated");
      const spaceId = await membersRepo.activeSpaceId(db, session.user.id);
      if (!spaceId) return ws.close(4404, "no space");

      conn = { userId: session.user.id, spaceId };
      const raw = ws.raw as ServerWebSocket;
      raw.subscribe(topicFor(spaceId));
      const cameOnline = realtime.join(spaceId, conn.userId);
      const hello: ServerEvent = { t: "hello", spaceId, online: realtime.online(spaceId) };
      ws.send(JSON.stringify(hello));
      if (cameOnline) realtime.publish(spaceId, { t: "presence", userId: conn.userId, online: true });
    },
    onClose() {
      clearTimeout(timer);
      if (!conn) return;
      const wentOffline = realtime.leave(conn.spaceId, conn.userId);
      if (wentOffline) realtime.publish(conn.spaceId, { t: "presence", userId: conn.userId, online: false });
    },
  };
});
