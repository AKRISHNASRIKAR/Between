import type { ServerEvent } from "@lovenotes/contracts";

/**
 * Realtime publisher. Services never touch sockets — they call `publish` after commit.
 * Today: in-process Bun pub/sub (single instance). Swappable for Postgres NOTIFY or a
 * per-space Durable Object without changing callers.
 */
type Publisher = (topic: string, data: string) => void;

let publisher: Publisher | null = null;
const presence = new Map<string, Map<string, number>>();

export const topicFor = (spaceId: string) => `space:${spaceId}`;

export const realtime = {
  bind(p: Publisher) {
    publisher = p;
  },
  publish(spaceId: string, event: ServerEvent) {
    publisher?.(topicFor(spaceId), JSON.stringify(event));
  },
  online(spaceId: string): string[] {
    return [...(presence.get(spaceId)?.keys() ?? [])];
  },
  isOnline(spaceId: string, userId: string) {
    return (presence.get(spaceId)?.get(userId) ?? 0) > 0;
  },
  /** Returns true if this is the user's first connection (they just came online). */
  join(spaceId: string, userId: string): boolean {
    const room = presence.get(spaceId) ?? new Map<string, number>();
    presence.set(spaceId, room);
    const n = (room.get(userId) ?? 0) + 1;
    room.set(userId, n);
    return n === 1;
  },
  /** Returns true if the user has no connections left (they went offline). */
  leave(spaceId: string, userId: string): boolean {
    const room = presence.get(spaceId);
    const n = (room?.get(userId) ?? 1) - 1;
    if (!room) return false;
    if (n <= 0) room.delete(userId);
    else room.set(userId, n);
    if (room.size === 0) presence.delete(spaceId);
    return n <= 0;
  },
};
