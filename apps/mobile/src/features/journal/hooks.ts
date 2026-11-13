import type { JournalPage } from "@lovenotes/contracts";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api";
import { rollbackOptimistic } from "@/lib/optimistic";

export const journalKeys = {
  all: (sid: string) => ["space", sid, "journal"] as const,
  pages: (sid: string) => ["space", sid, "journal", "pages"] as const,
  page: (sid: string, id: string) => ["space", sid, "journal", "page", id] as const,
  memories: (sid: string) => ["space", sid, "journal", "memories"] as const,
};

export function usePages(spaceId: string | undefined, enabled = true) {
  return useInfiniteQuery({
    queryKey: journalKeys.pages(spaceId ?? ""),
    queryFn: ({ pageParam }) =>
      unwrap(
        api.spaces[":sid"].journal.pages.$get({
          param: { sid: spaceId ?? "" },
          query: pageParam ? { cursor: pageParam } : {},
        }),
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (l) => l.nextCursor,
    enabled: !!spaceId && enabled,
  });
}

export function usePage(spaceId: string | undefined, id: string) {
  return useQuery({
    queryKey: journalKeys.page(spaceId ?? "", id),
    queryFn: () => unwrap(api.spaces[":sid"].journal.pages[":pid"].$get({ param: { sid: spaceId ?? "", pid: id } })),
    enabled: !!spaceId && !!id,
  });
}

export function useMemories(spaceId: string | undefined, enabled = true) {
  return useInfiniteQuery({
    queryKey: journalKeys.memories(spaceId ?? ""),
    queryFn: ({ pageParam }) =>
      unwrap(
        api.spaces[":sid"].memories.$get({
          param: { sid: spaceId ?? "" },
          query: pageParam ? { cursor: pageParam } : {},
        }),
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (l) => l.nextCursor,
    enabled: !!spaceId && enabled,
  });
}

const invalidateAll = (qc: ReturnType<typeof useQueryClient>, sid: string) =>
  qc.invalidateQueries({ queryKey: journalKeys.all(sid) });

export function useCreatePage(spaceId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: {
      id: string;
      blockId: string;
      pageDate: string;
      title: string | null;
      body: string | null;
      mediaIds: string[];
    }) =>
      unwrap(
        api.spaces[":sid"].journal.pages.$post({
          param: { sid: spaceId ?? "" },
          json: {
            id: v.id,
            pageDate: v.pageDate,
            title: v.title,
            block: { id: v.blockId, body: v.body, mediaIds: v.mediaIds },
          },
        }),
      ),
    onSuccess: (p) => {
      qc.setQueryData(journalKeys.page(spaceId ?? "", p.id), p);
      invalidateAll(qc, spaceId ?? "");
    },
  });
}

export function useAddBlock(spaceId: string | undefined, pageId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; body: string | null; mediaIds: string[] }) =>
      unwrap(
        api.spaces[":sid"].journal.pages[":pid"].blocks.$post({
          param: { sid: spaceId ?? "", pid: pageId },
          json: v,
        }),
      ),
    onSuccess: (p) => {
      qc.setQueryData(journalKeys.page(spaceId ?? "", pageId), p);
      invalidateAll(qc, spaceId ?? "");
    },
  });
}

export function useLovePage(spaceId: string | undefined, pageId: string, myId: string | undefined) {
  const qc = useQueryClient();
  const key = journalKeys.page(spaceId ?? "", pageId);
  return useMutation({
    mutationKey: key,
    scope: { id: key.join(":") },
    mutationFn: (on: boolean) =>
      on
        ? unwrap(api.spaces[":sid"].journal.pages[":pid"].reaction.$put({ param: { sid: spaceId ?? "", pid: pageId } }))
        : unwrap(
            api.spaces[":sid"].journal.pages[":pid"].reaction.$delete({ param: { sid: spaceId ?? "", pid: pageId } }),
          ),
    onMutate: async (on) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<JournalPage>(key);
      qc.setQueryData<JournalPage>(key, (p) =>
        p && myId
          ? { ...p, lovedBy: on ? [...new Set([...p.lovedBy, myId])] : p.lovedBy.filter((u) => u !== myId) }
          : p,
      );
      return { prev, optimistic: qc.getQueryData<JournalPage>(key) };
    },
    onError: (_error, _on, ctx) => rollbackOptimistic(qc, key, ctx),
    onSuccess: (p, _on, ctx) => {
      if (qc.getQueryData(key) === ctx?.optimistic) qc.setQueryData(key, p);
    },
    onSettled: () => {
      if (qc.isMutating({ mutationKey: key }) === 1) return invalidateAll(qc, spaceId ?? "");
    },
  });
}

export function useDeleteBlock(spaceId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (blockId: string) =>
      unwrap(api.spaces[":sid"].journal.blocks[":bid"].$delete({ param: { sid: spaceId ?? "", bid: blockId } })),
    onSuccess: () => invalidateAll(qc, spaceId ?? ""),
  });
}
