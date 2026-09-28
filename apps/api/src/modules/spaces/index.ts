/** Spaces: creating a space, invites and pairing, and leaving (closing) it. */
export { createSpaceRoutes, inviteRoutes, spaceRoutes } from "./spaces.routes";
export { acceptInvite, createInvite, leaveSpace, purgeExpiredSpaces } from "./spaces.service";
export { spaceView } from "./spaces.view";

import type { Tx } from "../../db/client";
import type { SpaceScope } from "../../lib/scope";
import { spacesRepo } from "./spaces.repo";

/** The space's own timezone (decides what "today" means for shared things like the Daily question). */
export async function spaceTimezone(tx: Tx, scope: SpaceScope): Promise<string> {
  return (await spacesRepo.get(tx, scope))?.timezone ?? "UTC";
}
