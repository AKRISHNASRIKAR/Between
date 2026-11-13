import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api";

export const petKeys = {
  timeline: (sid: string) => ["space", sid, "pet", "timeline"] as const,
};

/** The Pet timeline: Milestones and recent Care (refreshed on every `pet.updated`). */
export function usePetTimeline(spaceId: string | undefined) {
  return useQuery({
    queryKey: petKeys.timeline(spaceId ?? ""),
    queryFn: () => unwrap(api.spaces[":sid"].pet.timeline.$get({ param: { sid: spaceId ?? "" } })),
    enabled: !!spaceId,
  });
}

export function usePetDecision(spaceId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: import("zod").infer<typeof import("@lovenotes/contracts").PetDecisionInput>) =>
      unwrap(api.spaces[":sid"].pet.decision.$post({ param: { sid: spaceId ?? "" }, json: input })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] }),
  });
}
