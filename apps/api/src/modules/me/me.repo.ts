import { eq } from "drizzle-orm";
import type { Tx } from "../../db/client";
import { users } from "../../db/schema";

/** The signed-in person's own account row (Better Auth creates it; we only read and edit the profile). */
export const usersRepo = {
  async get(tx: Tx, userId: string) {
    const [u] = await tx.select().from(users).where(eq(users.id, userId));
    return u ?? null;
  },
  async update(tx: Tx, userId: string, patch: { name?: string; timezone?: string }) {
    await tx.update(users).set(patch).where(eq(users.id, userId));
  },
  /** Cascades to sessions, push tokens, and everything they authored (see migrations 0007–0008). */
  async remove(tx: Tx, userId: string) {
    await tx.delete(users).where(eq(users.id, userId));
  },
};
