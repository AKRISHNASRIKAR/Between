import type { Pet, PetInteractionInput, PetNameInput } from "@lovenotes/contracts";
import { and, count, eq, gt, sql } from "drizzle-orm";
import { petInteractions, pets } from "../../db/schema";
import { AppError, conflict, notFound } from "../../lib/errors";
import type { SpaceScope } from "../../lib/scope";
import { DAY_MS } from "../../lib/time";
import { withTx } from "../../lib/tx";
import { activity } from "../activity/service";
import { toPetDto } from "../spaces/dto";
import { assertWritable } from "../spaces/service";
import { bondFor } from "./bond";

const LAST_FIELD = { feed: "lastFedAt", pet: "lastPettedAt", play: "lastPlayedAt" } as const;

export async function getPet(scope: SpaceScope): Promise<Pet> {
  return withTx(async (tx) => {
    const [pet] = await tx.select().from(pets).where(eq(pets.spaceId, scope.spaceId));
    if (!pet) throw notFound();
    return toPetDto(pet, scope.timezone);
  });
}

/** Idempotent on the client-supplied id: a retried interaction returns the current pet unchanged. */
export async function interact(scope: SpaceScope, input: PetInteractionInput): Promise<Pet> {
  assertWritable(scope);
  return withTx(async (tx, after) => {
    const [pet] = await tx.select().from(pets).where(eq(pets.spaceId, scope.spaceId)).for("update");
    if (!pet) throw notFound();
    if (pet.stage === "egg") throw conflict("PET_NOT_HATCHED");

    const since = new Date(Date.now() - DAY_MS);
    const [c] = await tx
      .select({ n: count() })
      .from(petInteractions)
      .where(
        and(
          eq(petInteractions.spaceId, scope.spaceId),
          eq(petInteractions.userId, scope.userId),
          eq(petInteractions.kind, input.kind),
          gt(petInteractions.createdAt, since),
        ),
      );
    const bondDelta = bondFor(`pet.${input.kind}`, c?.n ?? 0);

    const inserted = await tx
      .insert(petInteractions)
      .values({
        id: input.id,
        spaceId: scope.spaceId,
        petId: pet.id,
        userId: scope.userId,
        kind: input.kind,
        bondDelta,
      })
      .onConflictDoNothing()
      .returning({ id: petInteractions.id });
    if (inserted.length === 0) return toPetDto(pet, scope.timezone);

    const now = new Date();
    const [updated] = await tx
      .update(pets)
      .set({ [LAST_FIELD[input.kind]]: now, bond: sql`${pets.bond} + ${bondDelta}`, version: sql`${pets.version} + 1` })
      .where(eq(pets.id, pet.id))
      .returning();
    if (!updated) throw notFound();

    const dto = toPetDto(updated, scope.timezone);
    after(() =>
      activity.broadcast(scope.spaceId, {
        t: "pet.updated",
        pet: dto,
        interaction: { userId: scope.userId, kind: input.kind },
      }),
    );
    return dto;
  });
}

/** Naming together: one proposes, the other accepts. Also used for renames later. */
export async function nameStep(scope: SpaceScope, input: PetNameInput): Promise<Pet> {
  assertWritable(scope);
  return withTx(async (tx, after) => {
    const [pet] = await tx.select().from(pets).where(eq(pets.spaceId, scope.spaceId)).for("update");
    if (!pet) throw notFound();
    if (pet.stage === "egg") throw conflict("PET_NOT_HATCHED");

    let patch: Partial<typeof pets.$inferInsert>;
    if (input.action === "propose") {
      patch = { proposedName: input.name, proposedBy: scope.userId };
    } else {
      if (!pet.proposedName) throw conflict("PET_NAME_NOT_PROPOSED");
      if (pet.proposedBy === scope.userId)
        throw new AppError("PET_NAME_OWN_PROPOSAL", 409, "Your partner needs to agree on the name.");
      patch = { name: pet.proposedName, proposedName: null, proposedBy: null };
    }
    const [updated] = await tx
      .update(pets)
      .set({ ...patch, version: sql`${pets.version} + 1` })
      .where(eq(pets.id, pet.id))
      .returning();
    if (!updated) throw notFound();
    const dto = toPetDto(updated, scope.timezone);
    after(() => activity.broadcast(scope.spaceId, { t: "pet.updated", pet: dto }));
    return dto;
  });
}
