import { kv } from "@/lib/kv";

/** An invite code from a deep link, kept until the user is signed in and ready to join. */
const KEY = "pending-invite";
export const pendingInvite = {
  set: (code: string) => kv.setItem(KEY, code),
  get: () => kv.getItem(KEY),
  clear: () => kv.removeItem(KEY),
};
