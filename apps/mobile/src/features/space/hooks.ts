import type { CreateSpaceInput, Me, Pet, PetInteractionKind, Space } from "@lovenotes/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api";
import { newId } from "@/lib/ids";
import { deviceTimezone } from "@/lib/time";
import { keys } from "./keys";

export function useMe(enabled = true) {
  return useQuery({ queryKey: keys.me, queryFn: () => unwrap(api.me.$get()), enabled });
}

/** Patch the space inside the cached `me` (single source for M1 screens). */
export function setCachedSpace(qc: ReturnType<typeof useQueryClient>, update: (s: Space) => Space) {
  qc.setQueryData<Me>(keys.me, (me) => (me?.space ? { ...me, space: update(me.space) } : me));
}

export function setCachedPet(qc: ReturnType<typeof useQueryClient>, pet: Pet) {
  setCachedSpace(qc, (s) => ({ ...s, pet }));
}

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (displayName: string) => unwrap(api.me.$patch({ json: { displayName, timezone: deviceTimezone() } })),
    onSuccess: (me) => qc.setQueryData(keys.me, me),
  });
}

export function useCreateSpace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<CreateSpaceInput, "timezone">) =>
      unwrap(api.spaces.$post({ json: { ...input, timezone: deviceTimezone() } })),
    onSuccess: (space) => qc.setQueryData<Me>(keys.me, (me) => (me ? { ...me, space } : me)),
  });
}

export function useCreateInvite(spaceId: string | undefined) {
  return useMutation({
    mutationFn: () => unwrap(api.spaces[":sid"].invites.$post({ param: { sid: spaceId ?? "" } })),
  });
}

export function useInvitePreview(code: string | null) {
  return useQuery({
    queryKey: keys.invitePreview(code ?? ""),
    queryFn: () => unwrap(api.invites[":code"].$get({ param: { code: code ?? "" } })),
    enabled: !!code,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
}

export function useAcceptInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => unwrap(api.invites[":code"].accept.$post({ param: { code } })),
    onSuccess: (space) => qc.setQueryData<Me>(keys.me, (me) => (me ? { ...me, space } : me)),
  });
}

export function usePetInteract(spaceId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (kind: PetInteractionKind) =>
      unwrap(api.spaces[":sid"].pet.interactions.$post({ param: { sid: spaceId ?? "" }, json: { id: newId(), kind } })),
    onSuccess: (pet) => setCachedPet(qc, pet),
  });
}

export function usePetName(spaceId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { action: "propose"; name: string } | { action: "accept" }) =>
      unwrap(api.spaces[":sid"].pet.name.$post({ param: { sid: spaceId ?? "" }, json: input })),
    onSuccess: (pet) => setCachedPet(qc, pet),
  });
}

export function useLeaveSpace(spaceId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => unwrap(api.spaces[":sid"].leave.$post({ param: { sid: spaceId ?? "" } })),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.me }),
  });
}

export const partnerOf = (space: Space | null | undefined, myId: string | undefined) =>
  space?.members.find((m) => m.id !== myId) ?? null;
