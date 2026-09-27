import type { FutureCategory, FutureItem } from "@lovenotes/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api";
import { newId } from "@/lib/ids";

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
    mutationFn: (v: { title: string; category: FutureCategory; emoji?: string | null }) =>
      unwrap(api.spaces[":sid"].future.$post({ param: { sid: spaceId ?? "" }, json: { id: newId(), ...v } })),
    onMutate: (v) => {
      const optimistic: FutureItem = {
        id: `optimistic-${Date.now()}`,
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
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}

export function useToggleFuture(spaceId: string | undefined) {
  const qc = useQueryClient();
  const key = futureKeys.list(spaceId ?? "");
  return useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) =>
      done
        ? unwrap(api.spaces[":sid"].future[":fid"].complete.$post({ param: { sid: spaceId ?? "", fid: id } }))
        : unwrap(api.spaces[":sid"].future[":fid"].uncomplete.$post({ param: { sid: spaceId ?? "", fid: id } })),
    onMutate: ({ id, done }) => {
      qc.setQueryData<FutureItem[]>(key, (l) =>
        l?.map((f) => (f.id === id ? { ...f, completedAt: done ? new Date().toISOString() : null } : f)),
      );
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}

export function useDeleteFuture(spaceId: string | undefined) {
  const qc = useQueryClient();
  const key = futureKeys.list(spaceId ?? "");
  return useMutation({
    mutationFn: (id: string) =>
      unwrap(api.spaces[":sid"].future[":fid"].$delete({ param: { sid: spaceId ?? "", fid: id } })),
    onMutate: (id) => qc.setQueryData<FutureItem[]>(key, (l) => l?.filter((f) => f.id !== id)),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}
