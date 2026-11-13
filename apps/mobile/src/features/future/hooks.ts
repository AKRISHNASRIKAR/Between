import type { FutureCategory, FutureItem } from "@lovenotes/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api";
import { newId } from "@/lib/ids";
import { rollbackOptimistic } from "@/lib/optimistic";

export const futureKeys = { list: (sid: string) => ["space", sid, "future"] as const };

export function useFuture(spaceId: string | undefined) {
  return useQuery({
    queryKey: futureKeys.list(spaceId ?? ""),
    queryFn: () => unwrap(api.spaces[":sid"].future.$get({ param: { sid: spaceId ?? "" } })),
    enabled: !!spaceId,
  });
}

export function useAddFuture(spaceId: string | undefined, myId: string | undefined) {
  const qc = useQueryClient();
  const key = futureKeys.list(spaceId ?? "");
  return useMutation({
    mutationKey: key,
    scope: { id: key.join(":") },
    mutationFn: (v: { title: string; category: FutureCategory; emoji?: string | null }) =>
      unwrap(api.spaces[":sid"].future.$post({ param: { sid: spaceId ?? "" }, json: { id: newId(), ...v } })),
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<FutureItem[]>(key);
      const optimistic: FutureItem = {
        id: `optimistic-${newId()}`,
        title: v.title,
        emoji: v.emoji ?? null,
        note: null,
        category: v.category,
        position: "",
        createdBy: myId ?? "",
        completedAt: null,
        completedBy: null,
        createdAt: new Date().toISOString(),
        version: 0,
      };
      qc.setQueryData<FutureItem[]>(key, (l) => [optimistic, ...(l ?? [])]);
      return { prev, optimistic: qc.getQueryData<FutureItem[]>(key) };
    },
    onError: (_error, _input, ctx) => rollbackOptimistic(qc, key, ctx),
    onSettled: () => {
      if (qc.isMutating({ mutationKey: key }) === 1) return qc.invalidateQueries({ queryKey: key });
    },
  });
}

export function useToggleFuture(spaceId: string | undefined) {
  const qc = useQueryClient();
  const key = futureKeys.list(spaceId ?? "");
  return useMutation({
    mutationKey: key,
    scope: { id: key.join(":") },
    mutationFn: ({ id, done }: { id: string; done: boolean }) =>
      done
        ? unwrap(api.spaces[":sid"].future[":fid"].complete.$post({ param: { sid: spaceId ?? "", fid: id } }))
        : unwrap(api.spaces[":sid"].future[":fid"].uncomplete.$post({ param: { sid: spaceId ?? "", fid: id } })),
    onMutate: async ({ id, done }) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<FutureItem[]>(key);
      qc.setQueryData<FutureItem[]>(key, (l) =>
        l?.map((f) => (f.id === id ? { ...f, completedAt: done ? new Date().toISOString() : null } : f)),
      );
      return { prev, optimistic: qc.getQueryData<FutureItem[]>(key) };
    },
    onError: (_error, _input, ctx) => rollbackOptimistic(qc, key, ctx),
    onSettled: () => {
      if (qc.isMutating({ mutationKey: key }) === 1) return qc.invalidateQueries({ queryKey: key });
    },
  });
}

export function useDeleteFuture(spaceId: string | undefined) {
  const qc = useQueryClient();
  const key = futureKeys.list(spaceId ?? "");
  return useMutation({
    mutationKey: key,
    scope: { id: key.join(":") },
    mutationFn: (id: string) =>
      unwrap(api.spaces[":sid"].future[":fid"].$delete({ param: { sid: spaceId ?? "", fid: id } })),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<FutureItem[]>(key);
      qc.setQueryData<FutureItem[]>(key, (l) => l?.filter((f) => f.id !== id));
      return { prev, optimistic: qc.getQueryData<FutureItem[]>(key) };
    },
    onError: (_error, _input, ctx) => rollbackOptimistic(qc, key, ctx),
    onSettled: () => {
      if (qc.isMutating({ mutationKey: key }) === 1) return qc.invalidateQueries({ queryKey: key });
    },
  });
}
