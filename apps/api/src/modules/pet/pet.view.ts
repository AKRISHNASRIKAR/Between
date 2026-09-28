import { type Pet, SPECIES, type SpeciesId } from "@lovenotes/contracts";
import { DAY_MS, localHour } from "../../lib/time";
import { derivePetMood } from "./mood";
import type { PetRow } from "./pet.repo";
import { type CareMoment, deriveWellbeing } from "./wellbeing";

export const ageDays = (p: PetRow, now = new Date()) =>
  p.hatchedAt ? Math.floor((now.getTime() - p.hatchedAt.getTime()) / DAY_MS) : 0;

export const petName = (p: PetRow) => p.name ?? SPECIES[p.species as SpeciesId]?.defaultName ?? "Your pet";

/** Row → API shape. Mood uses the viewer's local hour (a pet is sleepy at your night). */
export function toPetView(p: PetRow, viewer: { timezone: string }, recentCare: CareMoment[], now = new Date()): Pet {
  const stage = p.stage as Pet["stage"];
  return {
    id: p.id,
    species: p.species as Pet["species"],
    name: p.name,
    proposedName: p.proposedName,
    proposedById: p.proposedBy,
    stage,
    mood: derivePetMood({ ...p, stage }, now, localHour(now, viewer.timezone)),
    hatchedAt: p.hatchedAt?.toISOString() ?? null,
    ageDays: ageDays(p, now),
    wellbeing: deriveWellbeing({ ...p, stage }, recentCare, now),
  };
}
