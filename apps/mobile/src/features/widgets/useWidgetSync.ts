import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { AppState } from "react-native";
import type { FlowState } from "@/features/space/flow";
import { api, unwrap } from "@/lib/api";
import { publishWidgets } from "./publish";

export const widgetKey = (sid: string) => ["space", sid, "widget"] as const;

/**
 * Keeps the home-screen widgets in step with the app (docs/architecture/10-widgets.md):
 *  - a fresh snapshot is published whenever it changes (realtime events invalidate it);
 *  - it's refetched as the app goes to the background, so a glance at the home screen is current;
 *  - signing out (or having no space) publishes `null`, which wipes everything personal.
 */
export function useWidgetSync(state: FlowState, spaceId: string | undefined) {
  const qc = useQueryClient();
  const active = state === "ready" && !!spaceId;
  const snapshot = useQuery({
    queryKey: widgetKey(spaceId ?? ""),
    queryFn: () => unwrap(api.spaces[":sid"].widget.$get({ param: { sid: spaceId ?? "" } })),
    enabled: active,
    staleTime: 0,
  });

  useEffect(() => {
    if (state === "loading") return;
    if (!active) publishWidgets(null).catch(() => {});
    else if (snapshot.data) publishWidgets(snapshot.data).catch(() => {});
  }, [state, active, snapshot.data]);

  useEffect(() => {
    if (!active || !spaceId) return;
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "background") qc.invalidateQueries({ queryKey: widgetKey(spaceId) });
    });
    return () => sub.remove();
  }, [active, spaceId, qc]);
}
