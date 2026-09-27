import type { Me, UpdateMeInput } from "@lovenotes/contracts";
import { eq } from "drizzle-orm";
import { users } from "../../db/schema";
import { notFound } from "../../lib/errors";
import { withTx } from "../../lib/tx";
import type { AuthedUser } from "../../types";
import { loadSpaceDto } from "../spaces/dto";
import { activeSpaceIdFor } from "../spaces/service";

export async function getMe(user: AuthedUser): Promise<Me> {
  return withTx(async (tx) => {
    const [u] = await tx.select().from(users).where(eq(users.id, user.id));
    if (!u) throw notFound();
    const spaceId = await activeSpaceIdFor(tx, u.id);
    return {
      profile: {
        id: u.id,
        email: u.email,
        displayName: u.name.trim() ? u.name : null,
        avatarUrl: u.image,
        timezone: u.timezone,
      },
      space: spaceId ? await loadSpaceDto(tx, spaceId, u.timezone) : null,
    };
  });
}

export async function updateMe(user: AuthedUser, input: UpdateMeInput): Promise<Me> {
  await withTx((tx) =>
    tx
      .update(users)
      .set({
        ...(input.displayName !== undefined && { name: input.displayName }),
        ...(input.timezone !== undefined && { timezone: input.timezone }),
      })
      .where(eq(users.id, user.id)),
  );
  return getMe({ ...user, timezone: input.timezone ?? user.timezone });
}
