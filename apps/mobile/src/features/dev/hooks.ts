import type { DevPartnerAction } from "@lovenotes/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { keys } from "@/features/space/keys";
import { api, unwrap } from "@/lib/api";

/** Dev-only simulated partner (API /v1/dev). All effects arrive through normal realtime events. */
export const devKeys = { partner: ["dev", "partner"] as const };

export function useDevPartner() {
  return useQuery({
    queryKey: devKeys.partner,
    queryFn: () => unwrap(api.dev.partner.$get()),
    enabled: __DEV__,
    retry: false,
    refetchInterval: 5000,
  });
}

export function useCreateDevPartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name?: string) => unwrap(api.dev.partner.$post({ json: { name } })),
    onSuccess: (s) => {
      qc.setQueryData(devKeys.partner, s);
      qc.invalidateQueries({ queryKey: keys.me });
    },
  });
}

export function useDevPartnerAct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (action: DevPartnerAction) => unwrap(api.dev.partner.act.$post({ json: action })),
    onSuccess: (s) => qc.setQueryData(devKeys.partner, s),
  });
}
