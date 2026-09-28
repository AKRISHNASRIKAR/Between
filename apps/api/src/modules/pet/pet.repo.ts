import type { PetInteractionKind, PetMilestoneKind } from "@lovenotes/contracts";
import { and, count, desc, eq, gt, sql } from "drizzle-orm";
import type { Tx } from "../../db/client";
import { petInteractions, petMilestones, pets } from "../../db/schema";
import { newId } from "../../lib/ids";
import type { SpaceScope } from "../../lib/scope";
import type { CareMoment } from "./wellbeing";

export type PetRow = typeof pets.$inferSelect;

const LAST_FIELD = { feed: "lastFedAt", pet: "lastPettedAt", play: "lastPlayedAt" } as const;

/** All pet SQL. Every read/write is keyed by the caller's SpaceScope (ADR 0002). */
export const petRepo = {
  /** Space creation only (before anyone has a scope). */
  async createForSpace(tx: Tx, spaceId: string) {
    await tx.insert(pets).values({ id: newId(), spaceId });
  },

  async get(tx: Tx, scope: SpaceScope, opts: { lock?: boolean } = {}): Promise<PetRow | null> {
    const q = tx.select().from(pets).where(eq(pets.spaceId, scope.spaceId));
    const [row] = opts.lock ? await q.for("update") : await q;
    return row ?? null;
  },

  async update(tx: Tx, scope: SpaceScope, patch: Partial<typeof pets.$inferInsert>): Promise<PetRow | null> {
    const [row] = await tx
      .update(pets)
      .set({ ...patch, version: sql`${pets.version} + 1` })
      .where(eq(pets.spaceId, scope.spaceId))
      .returning();
    return row ?? null;
  },

  /** Egg → baby, once. Returns null if it had already hatched. */
  async hatch(tx: Tx, scope: SpaceScope, now: Date): Promise<PetRow | null> {
    const [row] = await tx
      .update(pets)
      .set({ stage: "baby", hatchedAt: now, lastSharedActivityAt: now, version: sql`${pets.version} + 1` })
      .where(and(eq(pets.spaceId, scope.spaceId), eq(pets.stage, "egg")))
      .returning();
    return row ?? null;
  },

  /** Add bond from shared activity and mark the pet as having just seen it (→ excited). */
  async addBond(tx: Tx, scope: SpaceScope, delta: number, now: Date): Promise<PetRow | null> {
    const [row] = await tx
      .update(pets)
      .set({ bond: sql`${pets.bond} + ${delta}`, lastSharedActivityAt: now, version: sql`${pets.version} + 1` })
      .where(and(eq(pets.spaceId, scope.spaceId), sql`${pets.stage} <> 'egg'`))
      .returning();
    return row ?? null;
  },

  async countCareSince(tx: Tx, scope: SpaceScope, kind: PetInteractionKind, since: Date): Promise<number> {
    const [c] = await tx
      .select({ n: count() })
      .from(petInteractions)
      .where(
        and(
          eq(petInteractions.spaceId, scope.spaceId),
          eq(petInteractions.userId, scope.userId),
          eq(petInteractions.kind, kind),
          gt(petInteractions.createdAt, since),
        ),
      );
    return c?.n ?? 0;
  },

  /** Record care; false if this client id was already recorded (idempotent retry, ADR 0008). */
  async insertCare(
    tx: Tx,
    scope: SpaceScope,
    pet: PetRow,
    id: string,
    kind: PetInteractionKind,
    bondDelta: number,
    now: Date,
  ) {
    const inserted = await tx
      .insert(petInteractions)
      .values({ id, spaceId: scope.spaceId, petId: pet.id, userId: scope.userId, kind, bondDelta })
      .onConflictDoNothing()
      .returning({ id: petInteractions.id });
    if (!inserted.length) return null;
    const [row] = await tx
      .update(pets)
      .set({ [LAST_FIELD[kind]]: now, bond: sql`${pets.bond} + ${bondDelta}`, version: sql`${pets.version} + 1` })
      .where(eq(pets.id, pet.id))
      .returning();
    return row ?? null;
  },

  async recentCare(tx: Tx, scope: SpaceScope, limit: number): Promise<CareMoment[]> {
    const rows = await tx
      .select({ kind: petInteractions.kind, at: petInteractions.createdAt, byUserId: petInteractions.userId })
      .from(petInteractions)
      .where(eq(petInteractions.spaceId, scope.spaceId))
      .orderBy(desc(petInteractions.createdAt))
      .limit(limit);
    return rows;
  },

  /** Insert milestones, returning only the ones that are new. */
  async addMilestones(tx: Tx, scope: SpaceScope, petId: string, kinds: PetMilestoneKind[], byUserId: string | null) {
    if (!kinds.length) return [] as PetMilestoneKind[];
    const inserted = await tx
      .insert(petMilestones)
      .values(kinds.map((kind) => ({ petId, spaceId: scope.spaceId, kind, byUserId })))
      .onConflictDoNothing()
      .returning({ kind: petMilestones.kind });
    return inserted.map((r) => r.kind as PetMilestoneKind);
  },

  async milestones(tx: Tx, scope: SpaceScope) {
    return tx
      .select()
      .from(petMilestones)
      .where(eq(petMilestones.spaceId, scope.spaceId))
      .orderBy(desc(petMilestones.earnedAt));
  },
};
