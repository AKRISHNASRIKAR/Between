import { authClient } from "./auth";
import { persister, queryClient } from "./query";
import { realtime } from "./realtime";

/** Sign out and wipe every cached byte of the previous user's space from this device. */
export async function signOut() {
  realtime.stop();
  await authClient.signOut().catch(() => {});
  queryClient.clear();
  await persister.removeClient();
}
