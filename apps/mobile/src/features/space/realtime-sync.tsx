import type { Me, PetInteractionKind, ServerEvent } from "@lovenotes/contracts";
import { useQueryClient } from "@tanstack/react-query";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { noteKeys, patchNoteCaches } from "@/features/notes/hooks";
import { petKeys } from "@/features/pet/hooks";
import { widgetKey } from "@/features/widgets/useWidgetSync";
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
      // Anything but presence can change what the home-screen widget shows.
      if (e.t !== "presence" && e.t !== "hello" && e.t !== "notice") {
        const sid = qc.getQueryData<Me>(keys.me)?.space?.id;
        if (sid) qc.invalidateQueries({ queryKey: widgetKey(sid) });
      }
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
        case "pet.updated": {
          setCachedPet(qc, e.pet);
          const sid = qc.getQueryData<Me>(keys.me)?.space?.id;
          if (sid) qc.invalidateQueries({ queryKey: petKeys.timeline(sid) });
          if (e.interaction) {
            const interaction = e.interaction;
            setState((s) => ({ ...s, lastInteraction: { ...interaction, at: Date.now() } }));
          }
          break;
        }
        case "note.created":
        case "note.updated":
        case "note.deleted": {
          const sid = qc.getQueryData<Me>(keys.me)?.space?.id;
          if (!sid) break;
          if (e.t === "note.updated") patchNoteCaches(qc, sid, e.note);
          qc.invalidateQueries({ queryKey: noteKeys.all(sid) });
          break;
        }
        case "quiz.updated": {
          const sid = qc.getQueryData<Me>(keys.me)?.space?.id;
          if (sid) qc.invalidateQueries({ queryKey: ["space", sid, "quiz"] });
          break;
        }
        case "future.changed": {
          const sid = qc.getQueryData<Me>(keys.me)?.space?.id;
          if (sid) qc.invalidateQueries({ queryKey: ["space", sid, "future"] });
          break;
        }
        case "journal.changed": {
          const sid = qc.getQueryData<Me>(keys.me)?.space?.id;
          if (sid) qc.invalidateQueries({ queryKey: ["space", sid, "journal"] });
          break;
        }
        case "mood.shared":
        case "mood.unshared": {
          const sid = qc.getQueryData<Me>(keys.me)?.space?.id;
          if (sid) qc.invalidateQueries({ queryKey: ["space", sid, "vibe"] });
          break;
        }
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
