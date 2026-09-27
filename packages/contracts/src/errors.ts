import { z } from "zod";

/** Stable machine-readable error codes. The app maps each to warm, human copy. */
export const ErrorCode = z.enum([
  "UNAUTHENTICATED",
  "VALIDATION_FAILED",
  "NOT_FOUND",
  "SPACE_NOT_FOUND",
  "SPACE_CLOSED",
  "ALREADY_IN_SPACE",
  "NOT_IN_SPACE",
  "SPACE_FULL",
  "INVITE_INVALID",
  "INVITE_EXPIRED",
  "INVITE_OWN_SPACE",
  "PET_NOT_HATCHED",
  "PET_NAME_NOT_PROPOSED",
  "PET_NAME_OWN_PROPOSAL",
  "VERSION_CONFLICT",
  "FORBIDDEN_ACTION",
  "RATE_LIMITED",
  "INTERNAL",
]);
export type ErrorCode = z.infer<typeof ErrorCode>;

export const ApiErrorBody = z.object({
  error: z.object({
    code: ErrorCode,
    message: z.string(),
    fields: z.record(z.string(), z.string()).optional(),
  }),
});
export type ApiErrorBody = z.infer<typeof ApiErrorBody>;
