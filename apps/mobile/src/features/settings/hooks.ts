import type { NotificationPrefs } from "@lovenotes/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { File, Paths } from "expo-file-system";
import { Share } from "react-native";
import { api, unwrap } from "@/lib/api";
import { signOut } from "@/lib/session";

const prefsKey = ["me", "notification-prefs"] as const;

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

/** Download everything as JSON and hand it to the share sheet (Save to Files, AirDrop, …). */
export function useExport(spaceId: string | undefined) {
  return useMutation({
    mutationFn: async () => {
      const data = await unwrap(api.spaces[":sid"].export.$get({ param: { sid: spaceId ?? "" } }));
      const file = new File(Paths.cache, `love-notes-export-${new Date().toISOString().slice(0, 10)}.json`);
      if (file.exists) file.delete();
      file.create();
      file.write(JSON.stringify(data, null, 2));
      await Share.share({ url: file.uri, title: "Love Notes export" });
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
