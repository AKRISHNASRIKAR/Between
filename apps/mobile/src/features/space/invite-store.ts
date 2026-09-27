import type { Invite } from "@lovenotes/contracts";
import { kv } from "@/lib/kv";

/**
 * Invite codes are stored hashed server-side, so the plaintext only exists on this device.
 * Keep it locally so reopening the app shows the same code instead of revoking it.
 */
const key = (spaceId: string) => `invite:${spaceId}`;

export const inviteStore = {
  async get(spaceId: string): Promise<Invite | null> {
    const raw = await kv.getItem(key(spaceId));
    if (!raw) return null;
    try {
      const inv = JSON.parse(raw) as Invite;
      return new Date(inv.expiresAt).getTime() > Date.now() + 60_000 ? inv : null;
    } catch {
      return null;
    }
  },
  set: (spaceId: string, inv: Invite) => kv.setItem(key(spaceId), JSON.stringify(inv)),
};
