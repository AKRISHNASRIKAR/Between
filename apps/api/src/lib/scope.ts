declare const scopeBrand: unique symbol;

/**
 * Proof that the current user is a member of `spaceId`. Only `requireSpaceMember` creates one.
 * Every space-scoped repository function takes a SpaceScope instead of a raw spaceId.
 */
export type SpaceScope = {
  readonly spaceId: string;
  readonly userId: string;
  readonly partnerId: string | null;
  /** false when the space is closed (read-only retention window) */
  readonly writable: boolean;
  /** viewer's IANA timezone */
  readonly timezone: string;
  readonly [scopeBrand]: true;
};

export const makeSpaceScope = (s: Omit<SpaceScope, typeof scopeBrand>) => s as SpaceScope;
