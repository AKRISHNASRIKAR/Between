import { expect, test } from "bun:test";
import { QueryClient } from "@tanstack/react-query";
import {
  type PersistedClient,
  persistQueryClientRestore,
  persistQueryClientSave,
} from "@tanstack/react-query-persist-client";
import { cacheBuster, shouldPersistQuery } from "./query-cache-policy";

function memoryPersister() {
  let stored: PersistedClient | undefined;
  return {
    persistClient: async (client: PersistedClient) => {
      stored = client;
    },
    restoreClient: async () => stored,
    removeClient: async () => {
      stored = undefined;
    },
  };
}

test("disk cache restores for its owner and is rejected for a different account", async () => {
  const persister = memoryPersister();
  const original = new QueryClient();
  original.setQueryData(["me"], { privateDraft: "Only Alice should see this" });
  await persistQueryClientSave({ queryClient: original, persister, buster: cacheBuster("alice") });
  const sameAccount = new QueryClient();
  await persistQueryClientRestore({ queryClient: sameAccount, persister, buster: cacheBuster("alice") });
  expect(sameAccount.getQueryData<{ privateDraft: string }>(["me"])).toEqual({
    privateDraft: "Only Alice should see this",
  });
  const otherAccount = new QueryClient();
  await persistQueryClientRestore({ queryClient: otherAccount, persister, buster: cacheBuster("bob") });
  expect(otherAccount.getQueryData<{ privateDraft: string }>(["me"])).toBeUndefined();
  expect(await persister.restoreClient()).toBeUndefined();
  original.clear();
  sameAccount.clear();
  otherAccount.clear();
});

test("retained archive contents stay in memory and are excluded from disk persistence", async () => {
  const queryClient = new QueryClient();
  const persister = memoryPersister();
  await queryClient.fetchQuery({
    queryKey: ["archive"],
    queryFn: async () => "signed media URL",
    meta: { persist: false },
  });
  queryClient.setQueryData(["active-space"], "regular cached content");
  await persistQueryClientSave({
    queryClient,
    persister,
    buster: cacheBuster("alice"),
    dehydrateOptions: { shouldDehydrateQuery: shouldPersistQuery },
  });
  const restored = new QueryClient();
  await persistQueryClientRestore({ queryClient: restored, persister, buster: cacheBuster("alice") });
  expect(queryClient.getQueryData<string>(["archive"])).toBe("signed media URL");
  expect(restored.getQueryData<string>(["archive"])).toBeUndefined();
  expect(restored.getQueryData<string>(["active-space"])).toBe("regular cached content");
  queryClient.clear();
  restored.clear();
});
