import { expect, test } from "bun:test";
import { PushRegistration } from "./push-registration";

function deferred<T>() {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

function fixture(
  options: { prepare?: () => Promise<{ token: string }>; put?: () => Promise<void>; stored?: string } = {},
) {
  let stored: string | null = options.stored ?? null;
  const events: string[] = [];
  const client = new PushRegistration({
    prepare: options.prepare ?? (async () => ({ token: "device-token" })),
    load: async () => stored,
    save: async (token) => {
      stored = token;
      events.push("save");
    },
    clear: async () => {
      stored = null;
      events.push("clear");
    },
    put: async () => {
      events.push("put");
      await options.put?.();
    },
    delete: async (token) => {
      events.push(`delete:${token}`);
    },
  });
  return { client, events, stored: () => stored };
}

test("cold-launch sign-out revokes the persisted token without waiting for a permission prompt", async () => {
  const prepare = deferred<{ token: string }>();
  const f = fixture({ stored: "previous-token", prepare: () => prepare.promise });
  const registering = f.client.register();
  await f.client.unregister();
  expect(f.events).toEqual(["delete:previous-token", "clear"]);
  prepare.resolve({ token: "late-token" });
  expect(await registering).toBe("unavailable");
  expect(f.events).toEqual(["delete:previous-token", "clear"]);
  expect(f.stored()).toBeNull();
});

test("sign-out drains a pending registration PUT and deletes afterward", async () => {
  const pendingPut = deferred<void>();
  const f = fixture({ put: () => pendingPut.promise });
  const registering = f.client.register();
  // Allow token preparation and persisted-token write to complete.
  await Promise.resolve();
  await Promise.resolve();
  expect(f.events).toEqual(["save", "put"]);
  const removing = f.client.unregister();
  await Promise.resolve();
  expect(f.events).toEqual(["save", "put"]);
  pendingPut.resolve();
  await removing;
  expect(await registering).toBe("unavailable");
  expect(f.events).toEqual(["save", "put", "delete:device-token", "clear"]);
});

test("registration remains suspended until the next authenticated session starts", async () => {
  const f = fixture();
  await f.client.unregister();
  expect(await f.client.register()).toBe("unavailable");
  expect(f.events).toEqual([]);
  f.client.beginSession();
  expect(await f.client.register()).toBe("registered");
  expect(f.events).toEqual(["save", "put"]);
});

test("failed revocation retains the stored token for retry", async () => {
  let stored: string | null = "old-token";
  const client = new PushRegistration({
    prepare: async () => ({ status: "unavailable" }),
    load: async () => stored,
    save: async () => {},
    clear: async () => {
      stored = null;
    },
    put: async () => {},
    delete: async () => {
      throw new Error("offline");
    },
  });
  await expect(client.unregister()).rejects.toThrow("offline");
  expect(stored).toBe("old-token");
});
