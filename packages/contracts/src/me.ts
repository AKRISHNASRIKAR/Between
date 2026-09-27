import { z } from "zod";
import { Timezone } from "./common";
import { LIMITS } from "./limits";
import { Space } from "./space";

export const Profile = z.object({
  id: z.uuid(),
  email: z.email(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  timezone: Timezone,
});
export type Profile = z.infer<typeof Profile>;

export const Me = z.object({
  profile: Profile,
  space: Space.nullable(),
});
export type Me = z.infer<typeof Me>;

export const UpdateMeInput = z.object({
  displayName: z.string().trim().min(LIMITS.displayName.min).max(LIMITS.displayName.max).optional(),
  timezone: Timezone.optional(),
});
export type UpdateMeInput = z.infer<typeof UpdateMeInput>;
