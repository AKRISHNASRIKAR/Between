import { z } from "zod";
import { IsoDateTime, LocalDate, Timezone } from "./common";
import { LIMITS } from "./limits";
import { Pet } from "./pet";

export const Member = z.object({
  id: z.uuid(),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
  role: z.enum(["owner", "member"]),
  joinedAt: IsoDateTime,
});
export type Member = z.infer<typeof Member>;

export const SpaceStatus = z.enum(["active", "closed"]);

export const Space = z.object({
  id: z.uuid(),
  name: z.string(),
  togetherSince: LocalDate.nullable(),
  timezone: Timezone,
  status: SpaceStatus,
  createdAt: IsoDateTime,
  members: z.array(Member),
  pet: Pet,
});
export type Space = z.infer<typeof Space>;

export const CreateSpaceInput = z.object({
  name: z.string().trim().min(LIMITS.spaceName.min).max(LIMITS.spaceName.max).optional(),
  togetherSince: LocalDate.optional(),
  timezone: Timezone,
});
export type CreateSpaceInput = z.infer<typeof CreateSpaceInput>;

export const UpdateSpaceInput = z.object({
  name: z.string().trim().min(LIMITS.spaceName.min).max(LIMITS.spaceName.max).optional(),
  togetherSince: LocalDate.nullable().optional(),
  timezone: Timezone.optional(),
});
export type UpdateSpaceInput = z.infer<typeof UpdateSpaceInput>;

/** Unambiguous alphabet: no 0/O, 1/I/L. Displayed as XXXX-XXXX. */
export const INVITE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export const InviteCode = z
  .string()
  .transform((s) => s.toUpperCase().replace(/[^0-9A-Z]/g, ""))
  .pipe(z.string().length(LIMITS.inviteCodeLength));

export const Invite = z.object({
  code: z.string(),
  url: z.string(),
  expiresAt: IsoDateTime,
});
export type Invite = z.infer<typeof Invite>;

export const InvitePreview = z.object({
  spaceName: z.string(),
  inviter: z.object({ displayName: z.string(), avatarUrl: z.string().nullable() }),
});
export type InvitePreview = z.infer<typeof InvitePreview>;

export const formatInviteCode = (code: string) => `${code.slice(0, 4)}-${code.slice(4)}`;
