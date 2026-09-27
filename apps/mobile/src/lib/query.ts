import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./errors";
import { kv } from "./kv";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 24 * 60 * 60 * 1000,
      retry: (count, err) => !(err instanceof ApiError && err.status >= 400 && err.status < 500) && count < 2,
      networkMode: "offlineFirst",
    },
    mutations: { networkMode: "offlineFirst", retry: 0 },
  },
});

/** Cache persisted to SQLite so every screen opens instantly from cache (SPEC §12). */
export const persister = createAsyncStoragePersister({ storage: kv, key: "lovenotes-query-cache", throttleTime: 1000 });

/** Bump when cached shapes change so stale caches are discarded. */
export const CACHE_BUSTER = "v1";
