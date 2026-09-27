import type { Note, NoteBox, NotePage, Paper } from "@lovenotes/contracts";
import { type InfiniteData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api";
import { newId } from "@/lib/ids";

export const noteKeys = {
  all: (sid: string) => ["space", sid, "notes"] as const,
  list: (sid: string, box: NoteBox) => ["space", sid, "notes", "list", box] as const,
  one: (sid: string, id: string) => ["space", sid, "notes", "one", id] as const,
};

export function useNotes(spaceId: string | undefined, box: NoteBox) {
  return useInfiniteQuery({
    queryKey: noteKeys.list(spaceId ?? "", box),
    queryFn: ({ pageParam }) =>
      unwrap(
        api.spaces[":sid"].notes.$get({
          param: { sid: spaceId ?? "" },
          query: { box, ...(pageParam ? { cursor: pageParam } : {}) },
        }),
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    enabled: !!spaceId,
  });
}

export function useNote(spaceId: string | undefined, id: string) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: noteKeys.one(spaceId ?? "", id),
    queryFn: () => unwrap(api.spaces[":sid"].notes[":nid"].$get({ param: { sid: spaceId ?? "", nid: id } })),
    enabled: !!spaceId && !!id,
    // Show instantly from any cached list page.
    initialData: () => {
      for (const [, data] of qc.getQueriesData<InfiniteData<NotePage>>({ queryKey: noteKeys.all(spaceId ?? "") })) {
        const hit = data?.pages?.flatMap((p) => p.items).find((n) => n.id === id);
        if (hit) return hit;
      }
      return undefined;
    },
  });
}

/** Replace/insert a note across every cached list and detail. */
export function patchNoteCaches(qc: ReturnType<typeof useQueryClient>, sid: string, note: Note) {
  qc.setQueryData(noteKeys.one(sid, note.id), note);
  qc.setQueriesData<InfiniteData<NotePage>>({ queryKey: [...noteKeys.all(sid), "list"] }, (data) =>
    data
      ? { ...data, pages: data.pages.map((p) => ({ ...p, items: p.items.map((n) => (n.id === note.id ? note : n)) })) }
      : data,
  );
}

export function useSendNote(spaceId: string | undefined, myId: string | undefined, partnerId: string | undefined) {
  const qc = useQueryClient();
  const sid = spaceId ?? "";
  return useMutation({
    mutationFn: (input: { id: string; body: string; paper: Paper }) =>
      unwrap(api.spaces[":sid"].notes.$post({ param: { sid }, json: input })),
    onMutate: async (input) => {
      const now = new Date().toISOString();
      const optimistic: Note = {
        ...input,
        authorId: myId ?? "",
        recipientId: partnerId ?? "",
        openedAt: null,
        reactedAt: null,
        createdAt: now,
        updatedAt: now,
      };
      for (const box of ["all", "sent"] as const) {
        qc.setQueryData<InfiniteData<NotePage>>(noteKeys.list(sid, box), (data) =>
          data
            ? { ...data, pages: data.pages.map((p, i) => (i === 0 ? { ...p, items: [optimistic, ...p.items] } : p)) }
            : data,
        );
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: noteKeys.all(sid) }),
  });
}

export const draftNoteId = () => newId();

export function useOpenNote(spaceId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      unwrap(api.spaces[":sid"].notes[":nid"].open.$post({ param: { sid: spaceId ?? "", nid: id } })),
    onSuccess: (note) => patchNoteCaches(qc, spaceId ?? "", note),
  });
}

export function useReactNote(spaceId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, on }: { id: string; on: boolean }) =>
      on
        ? unwrap(api.spaces[":sid"].notes[":nid"].reaction.$put({ param: { sid: spaceId ?? "", nid: id } }))
        : unwrap(api.spaces[":sid"].notes[":nid"].reaction.$delete({ param: { sid: spaceId ?? "", nid: id } })),
    onSuccess: (note) => patchNoteCaches(qc, spaceId ?? "", note),
  });
}

export function useDeleteNote(spaceId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      unwrap(api.spaces[":sid"].notes[":nid"].$delete({ param: { sid: spaceId ?? "", nid: id } })),
    onSuccess: () => qc.invalidateQueries({ queryKey: noteKeys.all(spaceId ?? "") }),
  });
}
