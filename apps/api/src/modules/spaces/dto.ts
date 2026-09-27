import type { Pet, Space } from "@lovenotes/contracts";
import { asc, eq } from "drizzle-orm";
import type { Tx } from "../../db/client";
import { pets, spaceMembers, spaces, users } from "../../db/schema";
import { notFound } from "../../lib/errors";
import { DAY_MS, localHour } from "../../lib/time";
import { derivePetMood } from "../pet/mood";

type PetRow = typeof pets.$inferSelect;

export function toPetDto(p: PetRow, viewerTimezone: string, now = new Date()): Pet {
  const stage = p.stage as Pet["stage"];
  return {
    id: p.id,
    species: p.species as Pet["species"],
    name: p.name,
    proposedName: p.proposedName,
    proposedById: p.proposedBy,
    stage,
    mood: derivePetMood({ ...p, stage }, now, localHour(now, viewerTimezone)),
    hatchedAt: p.hatchedAt?.toISOString() ?? null,
    ageDays: p.hatchedAt ? Math.floor((now.getTime() - p.hatchedAt.getTime()) / DAY_MS) : 0,
  };
}

/** Full space view. Callers must already have established membership (SpaceScope or own membership). */
export async function loadSpaceDto(tx: Tx, spaceId: string, viewerTimezone: string): Promise<Space> {
  const [space] = await tx.select().from(spaces).where(eq(spaces.id, spaceId));
  const [pet] = await tx.select().from(pets).where(eq(pets.spaceId, spaceId));
  if (!space || !pet) throw notFound("SPACE_NOT_FOUND");

  const members = await tx
    .select({
      id: users.id,
      name: users.name,
      image: users.image,
      role: spaceMembers.role,
      joinedAt: spaceMembers.joinedAt,
      leftAt: spaceMembers.leftAt,
    })
    .from(spaceMembers)
    .innerJoin(users, eq(users.id, spaceMembers.userId))
    .where(eq(spaceMembers.spaceId, spaceId))
    .orderBy(asc(spaceMembers.joinedAt));

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
    pet: toPetDto(pet, viewerTimezone),
  };
}
