import type { ErrorCode } from "@lovenotes/contracts";

export class ApiError extends Error {
  constructor(
    readonly code: ErrorCode | "NETWORK",
    readonly status: number,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
  }
}

/** Warm, human copy for each error code (DESIGN §11). Says what happened and what to do. */
const COPY: Partial<Record<ErrorCode | "NETWORK", string>> = {
  NETWORK: "Couldn't reach your space. Check your connection and try again.",
  UNAUTHENTICATED: "You've been signed out. Please sign in again.",
  VALIDATION_FAILED: "Something here needs another look.",
  SPACE_NOT_FOUND: "This space isn't available anymore.",
  SPACE_CLOSED: "This space is closed, so it's read-only now.",
  ALREADY_IN_SPACE: "You're already in a space.",
  SPACE_FULL: "This space already has two people in it.",
  INVITE_INVALID: "That code doesn't match an invite. Check it and try again.",
  INVITE_EXPIRED: "That invite has expired. Ask for a fresh code.",
  INVITE_OWN_SPACE: "That's your own invite — send it to your person instead.",
  PET_NAME_OWN_PROPOSAL: "Your partner needs to agree on the name.",
  RATE_LIMITED: "That's a lot of tries. Wait a minute and try again.",
  INTERNAL: "Something went wrong on our side. Try again in a moment.",
};

export function humanError(err: unknown): string {
  if (err instanceof ApiError) return COPY[err.code] ?? err.message;
  return COPY.NETWORK as string;
}
