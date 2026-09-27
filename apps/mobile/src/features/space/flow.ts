import type { Me } from "@lovenotes/contracts";

/** Where the user is in the journey. Drives the root navigator's route guards. */
export type FlowState = "loading" | "signed-out" | "needs-name" | "no-space" | "waiting" | "naming" | "ready";

function fromMe(me: Me): FlowState {
  if (!me.profile.displayName) return "needs-name";
  const space = me.space;
  if (!space) return "no-space";
  if (space.members.length < 2) return "waiting";
  if (!space.pet.name) return "naming";
  return "ready";
}

/**
 * While the session is still being checked, trust the cached profile (instant, offline-friendly
 * cold starts). Once the session has resolved, it is authoritative.
 */
export function flowState(hasSession: boolean, sessionPending: boolean, me: Me | undefined): FlowState {
  if (sessionPending) return me ? fromMe(me) : "loading";
  if (!hasSession) return "signed-out";
  if (!me) return "loading";
  return fromMe(me);
}

/** First screen for each state (used by the index route and deep-link fallbacks). */
export const HOME_FOR: Record<Exclude<FlowState, "loading">, string> = {
  "signed-out": "/welcome",
  "needs-name": "/your-name",
  "no-space": "/start",
  waiting: "/waiting",
  naming: "/hatch",
  ready: "/today",
};

/** Paths worth restoring after a cold start once the user is fully set up. */
export function restorablePath(path: string | null): string | null {
  if (!path || path === "/" || path === "/today") return null;
  const blocked = [
    "/welcome",
    "/sign-in",
    "/verify",
    "/your-name",
    "/start",
    "/create",
    "/join",
    "/waiting",
    "/hatch",
    "/invite",
  ];
  return blocked.some((b) => path === b || path.startsWith(`${b}/`)) ? null : path;
}
