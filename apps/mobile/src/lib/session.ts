import { authClient } from "./auth";
import { beginPushSession, suspendPushRegistration, unregisterPush } from "./push";
import { persister, queryClient } from "./query";
import { realtime } from "./realtime";

/** Sign out and wipe every cached byte of the previous user's space from this device. */
export async function signOut() {
  suspendPushRegistration();
  realtime.stop();
  // Drain any earlier registration before revocation, while the old session is authenticated.
  await unregisterPush().catch(() => {});
  try {
    const result = await authClient.signOut();
    if (result.error) throw new Error(result.error.message ?? "Could not sign out");
  } catch (error) {
    // The session is still signed in, so keep its local state usable and allow a retry.
    beginPushSession();
    realtime.start();
    throw error;
  }
  queryClient.clear();
  await persister.removeClient();
}
