import { useQuery } from "@tanstack/react-query";
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
