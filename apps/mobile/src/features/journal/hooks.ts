import type { JournalPage } from "@lovenotes/contracts";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api";
import { newId } from "@/lib/ids";

export const journalKeys = {
  all: (sid: string) => ["space", sid, "journal"] as const,
  pages: (sid: string) => ["space", sid, "journal", "pages"] as const,
  page: (sid: string, id: string) => ["space", sid, "journal", "page", id] as const,
  memories: (sid: string) => ["space", sid, "journal", "memories"] as const,
};

export function usePages(spaceId: string | undefined) {
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
    enabled: !!spaceId,
  });
}

export function usePage(spaceId: string | undefined, id: string) {
  return useQuery({
    queryKey: journalKeys.page(spaceId ?? "", id),
    queryFn: () => unwrap(api.spaces[":sid"].journal.pages[":pid"].$get({ param: { sid: spaceId ?? "", pid: id } })),
    enabled: !!spaceId && !!id,
  });
}

export function useMemories(spaceId: string | undefined) {
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
    enabled: !!spaceId,
  });
}

const invalidateAll = (qc: ReturnType<typeof useQueryClient>, sid: string) =>
  qc.invalidateQueries({ queryKey: journalKeys.all(sid) });

export function useCreatePage(spaceId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { pageDate: string; title: string | null; body: string | null; mediaIds: string[] }) =>
      unwrap(
        api.spaces[":sid"].journal.pages.$post({
          param: { sid: spaceId ?? "" },
          json: {
            id: newId(),
            pageDate: v.pageDate,
            title: v.title,
            block: { id: newId(), body: v.body, mediaIds: v.mediaIds },
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
    mutationFn: (v: { body: string | null; mediaIds: string[] }) =>
      unwrap(
        api.spaces[":sid"].journal.pages[":pid"].blocks.$post({
          param: { sid: spaceId ?? "", pid: pageId },
          json: { id: newId(), ...v },
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
    mutationFn: (on: boolean) =>
      on
        ? unwrap(api.spaces[":sid"].journal.pages[":pid"].reaction.$put({ param: { sid: spaceId ?? "", pid: pageId } }))
        : unwrap(
            api.spaces[":sid"].journal.pages[":pid"].reaction.$delete({ param: { sid: spaceId ?? "", pid: pageId } }),
          ),
    onMutate: (on) =>
      qc.setQueryData<JournalPage>(key, (p) =>
        p ? { ...p, lovedBy: on ? [...p.lovedBy, myId ?? ""] : p.lovedBy.filter((u) => u !== myId) } : p,
      ),
    onSuccess: (p) => qc.setQueryData(key, p),
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
