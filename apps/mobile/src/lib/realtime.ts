import type { ServerEvent } from "@lovenotes/contracts";
import { AppState } from "react-native";
import { sessionCookie } from "./auth";
import { API_URL } from "./config";

type Listener = (e: ServerEvent) => void;
type Status = "idle" | "connecting" | "open";

/**
 * One socket per app session, foreground only. Auth goes in the first message (never the URL).
 * On every (re)connect, `onReconnect` lets the app refetch — we don't replay missed events.
 */
class RealtimeClient {
  private ws: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private reconnectListeners = new Set<() => void>();
  private attempt = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private ping: ReturnType<typeof setInterval> | undefined;
  private wanted = false;
  status: Status = "idle";

  constructor() {
    AppState.addEventListener("change", (s) => {
      if (s === "active" && this.wanted) this.open();
      if (s === "background") this.close(false);
    });
  }

  start() {
    this.wanted = true;
    this.open();
  }

  stop() {
    this.wanted = false;
    this.close(true);
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  onReconnect(fn: () => void) {
    this.reconnectListeners.add(fn);
    return () => this.reconnectListeners.delete(fn);
  }

  private open() {
    if (this.ws || !this.wanted) return;
    this.status = "connecting";
    const ws = new WebSocket(`${API_URL.replace(/^http/, "ws")}/v1/realtime`);
    this.ws = ws;
    ws.onopen = async () => {
      ws.send(JSON.stringify({ t: "auth", token: await sessionCookie() }));
      this.ping = setInterval(() => ws.readyState === 1 && ws.send(JSON.stringify({ t: "ping" })), 25_000);
    };
    ws.onmessage = (m) => {
      let evt: ServerEvent;
      try {
        evt = JSON.parse(String(m.data)) as ServerEvent;
      } catch {
        return;
      }
      if (evt.t === "hello") {
        this.status = "open";
        this.attempt = 0;
        for (const fn of this.reconnectListeners) fn();
      }
      for (const fn of this.listeners) fn(evt);
    };
    ws.onclose = (e) => {
      clearInterval(this.ping);
      this.ws = null;
      this.status = "idle";
      // 4401/4404: not signed in / no space — don't hammer the server.
      if (!this.wanted || e.code === 4401 || e.code === 4404) return;
      const delay = Math.min(30_000, 1000 * 2 ** this.attempt) * (0.7 + Math.random() * 0.6);
      this.attempt++;
      this.timer = setTimeout(() => this.open(), delay);
    };
  }

  private close(clearTimer: boolean) {
    if (clearTimer) clearTimeout(this.timer);
    clearInterval(this.ping);
    this.ws?.close();
    this.ws = null;
  }
}

export const realtime = new RealtimeClient();
