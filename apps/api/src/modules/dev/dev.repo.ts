import type { Tx } from "../../db/client";
import { users } from "../../db/schema";
import { newId } from "../../lib/ids";

/** Dev tools only: accounts for the simulated partner. */
export const devRepo = {
  async createUser(tx: Tx, v: { name: string; email: string; timezone: string }) {
    const [u] = await tx
      .insert(users)
      .values({ id: newId(), ...v, emailVerified: true })
      .returning();
    return u ?? null;
  },
};
