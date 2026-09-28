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

/** Soft well-being state, 0.35 (calm) … 1 (full of it). Never lower than calm (ADR 0003). */
export const WELLBEING_FLOOR = 0.35;
export const WellbeingState = z.object({
  value: z.number().min(WELLBEING_FLOOR).max(1),
  word: z.string(),
});
export const PetWellbeing = z.object({
  fullness: WellbeingState,
  energy: WellbeingState,
  love: WellbeingState,
  /** Why the pet feels this way, in plain words ("Fed by Ananya this morning"). */
  reasons: z.array(z.string()),
});
export type PetWellbeing = z.infer<typeof PetWellbeing>;

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
  wellbeing: PetWellbeing,
});
export type Pet = z.infer<typeof Pet>;

export const PetInteractionInput = z.object({ id: z.uuid(), kind: PetInteractionKind });
export type PetInteractionInput = z.infer<typeof PetInteractionInput>;

export const PetNameInput = z.discriminatedUnion("action", [
  z.object({ action: z.literal("propose"), name: z.string().trim().min(1).max(24) }),
  z.object({ action: z.literal("accept") }),
]);
export type PetNameInput = z.infer<typeof PetNameInput>;

/** Good-news moments, each recorded once per pet. */
export const PetMilestoneKind = z.enum([
  "hatched",
  "named",
  "first_note",
  "first_page",
  "first_photo",
  "first_shared_vibe",
  "first_reveal",
  "first_future_done",
  "bond_50",
  "bond_150",
  "bond_400",
  "together_30",
  "together_100",
  "stage_young",
  "stage_grown",
]);
export type PetMilestoneKind = z.infer<typeof PetMilestoneKind>;

export const PetMilestone = z.object({
  kind: PetMilestoneKind,
  earnedAt: IsoDateTime,
  /** The member whose action earned it, when there was one. */
  byUserId: z.uuid().nullable(),
});
export type PetMilestone = z.infer<typeof PetMilestone>;

export const PetTimelineItem = z.discriminatedUnion("type", [
  z.object({ type: z.literal("milestone"), kind: PetMilestoneKind, at: IsoDateTime, byUserId: z.uuid().nullable() }),
  z.object({ type: z.literal("care"), kind: PetInteractionKind, at: IsoDateTime, byUserId: z.uuid() }),
]);
export type PetTimelineItem = z.infer<typeof PetTimelineItem>;

export const PetTimeline = z.object({ milestones: z.array(PetMilestone), items: z.array(PetTimelineItem) });
export type PetTimeline = z.infer<typeof PetTimeline>;

/** How each milestone is told, in the pet's own voice. {pet} and {name} are filled in by the caller. */
export const MILESTONE_COPY: Record<PetMilestoneKind, { title: string; line: string }> = {
  hatched: { title: "Hello, world", line: "{pet} hatched — you're both here." },
  named: { title: "A name!", line: "{pet} has a name now, and wears it proudly." },
  first_note: { title: "First note", line: "{pet} carried the very first note." },
  first_page: { title: "First page", line: "Your journal has its first page." },
  first_photo: { title: "First memory", line: "{pet} found the first photo in your journal." },
  first_shared_vibe: { title: "Feelings, shared", line: "{pet} saw you share how you feel." },
  first_reveal: { title: "First reveal", line: "You two finished your first quiz together." },
  first_future_done: { title: "A dream, done", line: "The first thing from your future is stamped." },
  bond_50: { title: "Getting close", line: "{pet} is starting to feel at home with you two." },
  bond_150: { title: "Best friends", line: "{pet} follows you both everywhere now." },
  bond_400: { title: "Family", line: "{pet} can't imagine a day without you two." },
  together_30: { title: "One month", line: "{pet} has been with you for a whole month." },
  together_100: { title: "100 days", line: "100 days with {pet}. Look at you three." },
  stage_young: { title: "Growing up", line: "{pet} isn't a baby anymore." },
  stage_grown: { title: "All grown", line: "{pet} is all grown up — and still tiny at heart." },
};

export const fillPetCopy = (text: string, petName: string) => text.replaceAll("{pet}", petName);
