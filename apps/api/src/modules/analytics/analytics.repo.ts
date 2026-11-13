import { createHash } from "node:crypto";
import { db, type Tx } from "../../db/client";
import { analyticsEvents } from "../../db/schema";

/** Stable, namespaced UUID: retries cannot inflate transitions or collide across accounts. */
export function eventId(userId: string, spaceId: string | null, name: string, entityId: string | null) {
  const actor = name === "first_shared_interaction" ? null : userId;
  const bytes = createHash("sha256")
    .update(JSON.stringify([actor, spaceId, name, entityId]))
    .digest();
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x50;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = bytes.subarray(0, 16).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export const analyticsRepo = {
  async record(
    userId: string,
    spaceId: string | null,
    name: string,
    entityId: string | null = null,
    id?: string,
    tx: Tx = db,
  ) {
    await tx
      .insert(analyticsEvents)
      .values({
        userId,
        spaceId,
        name,
        entityId,
        id: eventId(userId, spaceId, name, id ?? entityId),
      })
      .onConflictDoNothing();
  },
};
