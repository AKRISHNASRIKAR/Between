import type { Space } from "@lovenotes/contracts";
import type { Tx } from "../../db/client";
import { notFound } from "../../lib/errors";
import type { SpaceScope } from "../../lib/scope";
import { membersRepo } from "../members";
import { petRepo, petView } from "../pet";
import { spacesRepo } from "./spaces.repo";

/** The whole space as one viewer sees it: members and pet. */
export async function spaceView(tx: Tx, scope: SpaceScope): Promise<Space> {
  const [space, pet, members] = await Promise.all([
    spacesRepo.get(tx, scope),
    petRepo.get(tx, scope),
    membersRepo.of(tx, scope),
  ]);
  if (!space || !pet) throw notFound("SPACE_NOT_FOUND");
  return {
    id: space.id,
    name: space.name,
    togetherSince: space.togetherSince,
    timezone: space.timezone,
    status: space.status,
    createdAt: space.createdAt.toISOString(),
    members: members
      .filter((m) => space.status === "closed" || m.leftAt === null)
      .map((m) => ({
        id: m.id,
        displayName: m.name,
        avatarUrl: m.image,
        role: m.role,
        joinedAt: m.joinedAt.toISOString(),
      })),
    pet: await petView(tx, scope, pet),
  };
}
