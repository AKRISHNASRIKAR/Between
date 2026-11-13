import type { NotificationPrefs } from "@lovenotes/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/design-system";
import { api, unwrap } from "@/lib/api";
import { sessionCookie } from "@/lib/auth";
import { API_URL } from "@/lib/config";
import { humanError } from "@/lib/errors";
import { shareArchive } from "@/lib/export-file";
import { signOut } from "@/lib/session";

/** A non-throwing event handler with sign-out loading and error feedback. */
export function useSignOut() {
  const toast = useToast();
  return useMutation({
    mutationKey: ["session", "sign-out"],
    mutationFn: signOut,
    retry: 0,
    onError: (error) => toast({ kind: "error", message: humanError(error) }),
  });
}

const prefsKey = ["me", "notification-prefs"] as const;

export function useRetainedSpaceExport(spaceId: string | undefined) {
  return useQuery({
    queryKey: ["space", spaceId, "retained-export"],
    queryFn: () => unwrap(api.spaces[":sid"].export.$get({ param: { sid: spaceId ?? "" } })),
    enabled: !!spaceId,
    // Archive contents and signed media URLs should never outlive their access window in storage.
    gcTime: 0,
    meta: { persist: false },
  });
}

export function useNotificationPrefs() {
  return useQuery({ queryKey: prefsKey, queryFn: () => unwrap(api.me["notification-prefs"].$get()) });
}

/** Optimistic toggles — the switch flips instantly. */
export function useUpdatePrefs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<NotificationPrefs>) => unwrap(api.me["notification-prefs"].$put({ json: patch })),
    onMutate: (patch) => {
      const prev = qc.getQueryData<NotificationPrefs>(prefsKey);
      if (prev) qc.setQueryData(prefsKey, { ...prev, ...patch });
      return { prev };
    },
    onError: (_e, _p, ctx) => ctx?.prev && qc.setQueryData(prefsKey, ctx.prev),
    onSuccess: (p) => qc.setQueryData(prefsKey, p),
  });
}

/** Export actual media with all authorized text/history in a portable streamed archive. */
export function useExport(spaceId: string | undefined) {
  return useMutation({
    mutationFn: async () => {
      if (!spaceId) throw new Error("Choose a space before exporting.");
      // Check access before handing a browser download off to its native attachment handler.
      await unwrap(api.spaces[":sid"].export.$get({ param: { sid: spaceId } }));
      await shareArchive(`${API_URL}/v1/spaces/${spaceId}/export/archive`, await sessionCookie());
    },
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: async () => {
      await unwrap(api.me.$delete());
      await signOut();
    },
  });
}
