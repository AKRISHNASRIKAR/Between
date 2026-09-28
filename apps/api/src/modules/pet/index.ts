/**
 * Pet: the creature both members look after. Other modules grow it with `growPet` inside
 * their transaction and hand the result to `announcePet` after commit.
 */

export { petRepo } from "./pet.repo";
export { petRoutes } from "./pet.routes";
export {
  announcePet,
  care as careForPet,
  growPet,
  hatchPet,
  mergePetOutcomes,
  nameStep as petNameStep,
  type PetOutcome,
  petView,
} from "./pet.service";

import type { Tx } from "../../db/client";
import type { SpaceScope } from "../../lib/scope";
import { petRepo as repo } from "./pet.repo";
import { petName } from "./pet.view";

/** The pet's display name (for notifications written in its voice). */
export async function petNameFor(tx: Tx, scope: SpaceScope): Promise<string> {
  const row = await repo.get(tx, scope);
  return row ? petName(row) : "Your pet";
}
