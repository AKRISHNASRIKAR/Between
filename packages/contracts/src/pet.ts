import { z } from "zod";
import { IsoDateTime } from "./common";

export const SpeciesId = z.enum(["dog"]);
export type SpeciesId = z.infer<typeof SpeciesId>;

export const PetStage = z.enum(["egg", "baby", "young", "grown"]);
export type PetStage = z.infer<typeof PetStage>;

/** Derived at read time from activity timestamps — never stored, never punitive. */
export const PetMood = z.enum(["sleepy", "content", "happy", "excited", "peckish"]);
export type PetMood = z.infer<typeof PetMood>;

export const PetInteractionKind = z.enum(["feed", "pet", "play"]);
export type PetInteractionKind = z.infer<typeof PetInteractionKind>;

export type SpeciesDef = {
  id: SpeciesId;
  defaultName: string;
  stages: readonly PetStage[];
};

export const SPECIES: Record<SpeciesId, SpeciesDef> = {
  dog: { id: "dog", defaultName: "Mochi", stages: ["egg", "baby"] },
};

export const Pet = z.object({
  id: z.uuid(),
  species: SpeciesId,
  name: z.string().nullable(),
  proposedName: z.string().nullable(),
  proposedById: z.uuid().nullable(),
  stage: PetStage,
  mood: PetMood,
  hatchedAt: IsoDateTime.nullable(),
  ageDays: z.number().int().nonnegative(),
});
export type Pet = z.infer<typeof Pet>;

export const PetInteractionInput = z.object({ id: z.uuid(), kind: PetInteractionKind });
export type PetInteractionInput = z.infer<typeof PetInteractionInput>;

export const PetNameInput = z.discriminatedUnion("action", [
  z.object({ action: z.literal("propose"), name: z.string().trim().min(1).max(24) }),
  z.object({ action: z.literal("accept") }),
]);
export type PetNameInput = z.infer<typeof PetNameInput>;
