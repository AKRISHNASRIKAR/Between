/** Notifications: member settings, device tokens, and `notify` (live notice or push). */

export { notificationRoutes } from "./notifications.routes";
export { notify } from "./notifications.service";

import type { Notice } from "@lovenotes/contracts";
import type { SpaceScope } from "../../lib/scope";
import { notify } from "./notifications.service";

/** Convenience for the common case: tell the caller's partner (no-op when alone). */
export async function notifyPartner(scope: SpaceScope, notice: Notice, petName: string) {
  if (scope.partnerId) await notify({ spaceId: scope.spaceId, to: scope.partnerId, notice, petName });
}
