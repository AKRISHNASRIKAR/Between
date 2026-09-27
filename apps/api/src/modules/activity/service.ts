import type { ServerEvent } from "@lovenotes/contracts";
import type { Tx } from "../../db/client";
import { activityEvents } from "../../db/schema";
import { newId } from "../../lib/ids";
import { realtime } from "../../realtime/hub";

type RecordInput = {
  spaceId: string;
  actorId: string;
  kind: string;
  subjectId?: string;
  bondDelta?: number;
};

/**
 * The one place shared activity flows through. Feature services call `record` inside their
 * transaction and `broadcast` after commit. Push fan-out hooks in here later (M3).
 */
export const activity = {
  async record(tx: Tx, input: RecordInput) {
    await tx.insert(activityEvents).values({
      id: newId(),
      spaceId: input.spaceId,
      actorId: input.actorId,
      kind: input.kind,
      subjectId: input.subjectId ?? null,
      bondDelta: input.bondDelta ?? 0,
    });
  },
  broadcast(spaceId: string, event: ServerEvent) {
    realtime.publish(spaceId, event);
  },
};
