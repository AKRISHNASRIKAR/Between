import type { Pet, PetInteractionKind } from "./pet";

/** Server → client. Every event is also an idempotent cache hint. */
export type ServerEvent =
  | { t: "hello"; spaceId: string; online: string[] }
  | { t: "presence"; userId: string; online: boolean }
  | { t: "space.member_joined"; userId: string }
  | { t: "space.updated" }
  | { t: "space.closed" }
  | { t: "pet.updated"; pet: Pet; interaction?: { userId: string; kind: PetInteractionKind } };

/** Client → server. Kept tiny on purpose. */
export type ClientMessage = { t: "auth"; token: string } | { t: "ping" };
