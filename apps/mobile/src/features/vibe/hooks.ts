import type { MoodId, MoodVisibility, Vibe } from "@lovenotes/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api";
import { localDateString } from "@/lib/date";
import { newId } from "@/lib/ids";

export const vibeKeys = {
  all: (sid: string) => ["space", sid, "vibe"] as const,
  day: (sid: string, date: string) => ["space", sid, "vibe", "day", date] as const,
  month: (sid: string, month: string) => ["space", sid, "vibe", "month", month] as const,
};

export function useVibe(spaceId: string | undefined) {
  const date = localDateString();
  return useQuery({
    queryKey: vibeKeys.day(spaceId ?? "", date),
    queryFn: () => unwrap(api.spaces[":sid"].vibe.$get({ param: { sid: spaceId ?? "" }, query: { date } })),
    enabled: !!spaceId,
  });
}

type CheckinInput = { mood: MoodId; note: string | null; visibility: MoodVisibility };

/** Optimistic: the card updates instantly; the server response (with observation) replaces it. */
export function useCheckin(spaceId: string | undefined, myId: string | undefined) {
  const qc = useQueryClient();
  const date = localDateString();
  const key = vibeKeys.day(spaceId ?? "", date);
  return useMutation({
    mutationFn: (input: CheckinInput) =>
      unwrap(
        api.spaces[":sid"].vibe[":date"].$put({
          param: { sid: spaceId ?? "", date },
          json: { id: newId(), ...input },
        }),
      ),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Vibe>(key);
      const now = new Date().toISOString();
      qc.setQueryData<Vibe>(key, (v) => ({
        date,
        partner: v?.partner ?? null,
        observation: input.visibility === "shared" ? (v?.observation ?? null) : null,
        me: {
          id: v?.me?.id ?? "optimistic",
          userId: myId ?? "",
          localDate: date,
          mood: input.mood,
          note: input.note,
          visibility: input.visibility,
          sharedAt: input.visibility === "shared" ? now : null,
          updatedAt: now,
        },
      }));
      return { prev };
    },
    onError: (_e, _i, ctx) => ctx?.prev && qc.setQueryData(key, ctx.prev),
    onSuccess: (vibe) => {
      qc.setQueryData(key, vibe);
      qc.invalidateQueries({ queryKey: ["space", spaceId ?? "", "vibe", "month"] });
    },
  });
}

export function useVibeMonth(spaceId: string | undefined, month: string) {
  return useQuery({
    queryKey: vibeKeys.month(spaceId ?? "", month),
    queryFn: () => unwrap(api.spaces[":sid"].vibe.history.$get({ param: { sid: spaceId ?? "" }, query: { month } })),
    enabled: !!spaceId,
  });
}
