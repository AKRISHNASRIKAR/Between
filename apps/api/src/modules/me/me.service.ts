import type { Me, UpdateMeInput } from "@lovenotes/contracts";
import { db } from "../../db/client";
import { notFound } from "../../lib/errors";
import { withTx } from "../../lib/tx";
import type { AuthedUser } from "../../types";
import { removeUploadsBy } from "../journal";
import { activeScope } from "../members";
import { leaveSpace, spaceView } from "../spaces";
import { usersRepo } from "./me.repo";

export async function getMe(user: AuthedUser): Promise<Me> {
  return withTx(async (tx) => {
    const u = await usersRepo.get(tx, user.id);
    if (!u) throw notFound();
    const scope = await activeScope(tx, { id: u.id, timezone: u.timezone });
    return {
      profile: {
        id: u.id,
        email: u.email,
        displayName: u.name.trim() ? u.name : null,
        avatarUrl: u.image,
        timezone: u.timezone,
      },
      space: scope ? await spaceView(tx, scope) : null,
    };
  });
}

export async function updateMe(user: AuthedUser, input: UpdateMeInput): Promise<Me> {
  await withTx((tx) =>
    usersRepo.update(tx, user.id, {
      ...(input.displayName !== undefined && { name: input.displayName }),
      ...(input.timezone !== undefined && { timezone: input.timezone }),
    }),
  );
  return getMe({ ...user, timezone: input.timezone ?? user.timezone });
}

/**
 * Delete my account (SPEC §10.2): close my active space (my partner keeps 30 days of read-only
 * access), remove my photos from storage, then delete my user row, which cascades to the rest.
 */
export async function deleteAccount(user: AuthedUser): Promise<void> {
  const scope = await activeScope(db, user);
  if (scope?.writable) await leaveSpace(scope);
  await removeUploadsBy(user.id);
  await usersRepo.remove(db, user.id);
}
