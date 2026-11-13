import { expect, test } from "bun:test";
import { RealtimeClient } from "./realtime-client";

class Socket {
  readyState = 1;
  sent: string[] = [];
  onopen: (() => Promise<void>) | null = null;
  onclose: ((e: { code: number }) => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  send(s: string) {
    this.sent.push(s);
  }
  close() {
    this.readyState = 3;
  }
}

function fixture(initialState = "active") {
  const sockets: Socket[] = [];
  let stateChange = (_state: string) => {};
  let resolveCookie = (_cookie: string) => {};
  const client = new RealtimeClient({
    initialState,
    onStateChange: (listener) => {
      stateChange = listener;
    },
    cookie: () =>
      new Promise<string>((resolve) => {
        resolveCookie = resolve;
      }),
    socket: () => {
      const socket = new Socket();
      sockets.push(socket);
      return socket as unknown as WebSocket;
    },
  });
  return {
    client,
    sockets,
    stateChange: (s: string) => stateChange(s),
    resolveCookie: (s: string) => resolveCookie(s),
  };
}

test("delayed authentication and callbacks from a closed socket cannot affect its replacement", async () => {
  const f = fixture();
  try {
    f.client.start();
    const old = f.sockets[0];
    if (!old?.onopen || !old.onclose || !old.onmessage) throw new Error("Socket callbacks were not installed");
    const authenticating = old.onopen();
    f.stateChange("background");
    expect(f.client.status).toBe("idle");
    f.client.start();
    expect(f.sockets.length).toBe(1);
    f.stateChange("active");
    f.resolveCookie("cookie");
    await authenticating;
    expect(old.sent).toEqual([]);
    old.onclose({ code: 1006 });
    old.onmessage({ data: JSON.stringify({ t: "hello", online: [] }) });
    expect(f.client.status).toBe("connecting");
    f.client.start();
    expect(f.sockets.length).toBe(2);
  } finally {
    f.client.stop();
  }
});

test("inactive app does not connect until foreground and stop prevents foreground reconnect", () => {
  const f = fixture("background");
  f.client.start();
  expect(f.sockets).toHaveLength(0);
  f.stateChange("active");
  expect(f.sockets).toHaveLength(1);
  f.client.stop();
  f.stateChange("background");
  f.stateChange("active");
  expect(f.sockets).toHaveLength(1);
  expect(f.client.status).toBe("idle");
});

test("background transition cancels a pending reconnect timer", async () => {
  const f = fixture();
  f.client.start();
  const socket = f.sockets[0];
  if (!socket?.onclose) throw new Error("Socket close callback was not installed");
  socket.onclose({ code: 1006 });
  f.stateChange("background");
  await new Promise((resolve) => setTimeout(resolve, 1700));
  expect(f.sockets).toHaveLength(1);
  f.client.stop();
});
