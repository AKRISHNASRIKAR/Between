import type { QueryClient, QueryKey } from "@tanstack/react-query";

export type OptimisticSnapshot<T> = { prev: T | undefined; optimistic: T | undefined };

/** Restore only while this mutation still owns the cache, including a previously absent query. */
export function rollbackOptimistic<T>(qc: QueryClient, key: QueryKey, ctx: OptimisticSnapshot<T> | undefined) {
  if (!ctx || qc.getQueryData(key) !== ctx.optimistic) return;
  if (ctx.prev === undefined) qc.removeQueries({ queryKey: key, exact: true });
  else qc.setQueryData(key, ctx.prev);
}
