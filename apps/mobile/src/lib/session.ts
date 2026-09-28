import { authClient } from "./auth";
import { unregisterPush } from "./push";
import { persister, queryClient } from "./query";
import { realtime } from "./realtime";

/** Sign out and wipe every cached byte of the previous user's space from this device. */
export async function signOut() {
  realtime.stop();
  await unregisterPush(); // while still signed in, so the API accepts it
  await authClient.signOut().catch(() => {});
  queryClient.clear();
  await persister.removeClient();
}
