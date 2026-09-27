import type { PetInteractionKind, ServerEvent } from "@lovenotes/contracts";
import { useQueryClient } from "@tanstack/react-query";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { realtime } from "@/lib/realtime";
import { setCachedPet } from "./hooks";
import { keys } from "./keys";

type PartnerInteraction = { userId: string; kind: PetInteractionKind; at: number };
type RealtimeState = { online: string[]; lastInteraction: PartnerInteraction | null };

const Ctx = createContext<RealtimeState>({ online: [], lastInteraction: null });
export const useRealtime = () => useContext(Ctx);

/** One socket for the signed-in app; routes events into the query cache (SPEC §11). */
export function RealtimeProvider({ active, children }: { active: boolean; children: ReactNode }) {
  const qc = useQueryClient();
  const [state, setState] = useState<RealtimeState>({ online: [], lastInteraction: null });

  useEffect(() => {
    if (!active) return;
    realtime.start();
    const offEvents = realtime.subscribe((e: ServerEvent) => {
      switch (e.t) {
        case "hello":
          setState((s) => ({ ...s, online: e.online }));
          break;
        case "presence":
          setState((s) => ({
            ...s,
            online: e.online ? [...new Set([...s.online, e.userId])] : s.online.filter((u) => u !== e.userId),
          }));
          break;
        case "pet.updated":
          setCachedPet(qc, e.pet);
          if (e.interaction) {
            const interaction = e.interaction;
            setState((s) => ({ ...s, lastInteraction: { ...interaction, at: Date.now() } }));
          }
          break;
        case "space.member_joined":
        case "space.updated":
        case "space.closed":
          qc.invalidateQueries({ queryKey: keys.me });
          break;
      }
    });
    const offReconnect = realtime.onReconnect(() => qc.invalidateQueries());
    return () => {
      offEvents();
      offReconnect();
      realtime.stop();
    };
  }, [active, qc]);

  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}
