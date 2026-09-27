import type { MoodCheckin } from "./moods";
import type { Note } from "./notes";
import type { Pet, PetInteractionKind } from "./pet";

/** Server → client. Every event is also an idempotent cache hint. */
export type ServerEvent =
  | { t: "hello"; spaceId: string; online: string[] }
  | { t: "presence"; userId: string; online: boolean }
  | { t: "space.member_joined"; userId: string }
  | { t: "space.updated" }
  | { t: "space.closed" }
  | { t: "pet.updated"; pet: Pet; interaction?: { userId: string; kind: PetInteractionKind } }
  | { t: "mood.shared"; checkin: MoodCheckin }
  | { t: "mood.unshared"; userId: string; localDate: string }
  | { t: "note.created"; note: Note }
  | { t: "note.updated"; note: Note }
  | { t: "note.deleted"; noteId: string }
  | { t: "quiz.updated"; sessionId: string }
  | { t: "future.changed" }
  | { t: "journal.changed"; pageId: string };

/** Client → server. Kept tiny on purpose. */
export type ClientMessage = { t: "auth"; token: string } | { t: "ping" };
