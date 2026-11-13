import type { ServerEvent } from "@lovenotes/contracts";

type Listener = (e: ServerEvent) => void;
type Status = "idle" | "connecting" | "open";

/**
 * One socket per app session, foreground only. Auth goes in the first message (never the URL).
 * On every (re)connect, `onReconnect` lets the app refetch — we don't replay missed events.
 */
type RealtimeDependencies = {
  initialState: string | null;
  onStateChange: (listener: (state: string) => void) => void;
  cookie: () => Promise<string> | string;
  socket: () => WebSocket;
};

export class RealtimeClient {
  private ws: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private reconnectListeners = new Set<() => void>();
  private attempt = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private ping: ReturnType<typeof setInterval> | undefined;
  private wanted = false;
  private foreground: boolean;
  status: Status = "idle";

  constructor(private readonly deps: RealtimeDependencies) {
    this.foreground = deps.initialState === null || deps.initialState === "active";
    deps.onStateChange((s) => {
      this.foreground = s === "active";
      if (this.foreground && this.wanted) this.open();
      else this.close();
    });
  }

  start() {
    this.wanted = true;
    this.open();
  }

  stop() {
    this.wanted = false;
    this.close();
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
    if (this.ws || !this.wanted || !this.foreground) return;
    clearTimeout(this.timer);
    this.timer = undefined;
    this.status = "connecting";
    const ws = this.deps.socket();
    this.ws = ws;
    ws.onopen = async () => {
      try {
        const token = await this.deps.cookie();
        // Authentication may finish after stop(), backgrounding, or another socket opening.
        if (this.ws !== ws || !this.wanted || !this.foreground || ws.readyState !== 1) return;
        ws.send(JSON.stringify({ t: "auth", token }));
        this.ping = setInterval(() => {
          if (this.ws === ws && ws.readyState === 1) ws.send(JSON.stringify({ t: "ping" }));
        }, 25_000);
      } catch {
        if (this.ws === ws) ws.close();
      }
    };
    ws.onmessage = (m) => {
      if (this.ws !== ws || !this.wanted || !this.foreground) return;
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
      if (this.ws !== ws) return;
      clearInterval(this.ping);
      this.ping = undefined;
      this.ws = null;
      this.status = "idle";
      // 4401/4404: not signed in / no space — don't hammer the server.
      if (!this.wanted || !this.foreground || e.code === 4401 || e.code === 4404) return;
      const delay = Math.min(30_000, 1000 * 2 ** this.attempt) * (0.7 + Math.random() * 0.6);
      this.attempt++;
      this.timer = setTimeout(() => this.open(), delay);
    };
  }

  private close() {
    clearTimeout(this.timer);
    this.timer = undefined;
    clearInterval(this.ping);
    this.ping = undefined;
    const ws = this.ws;
    this.ws = null;
    this.status = "idle";
    // Detach ownership first: its delayed close callback cannot affect the next socket.
    ws?.close();
  }
}
