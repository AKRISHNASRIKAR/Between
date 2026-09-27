import { z } from "zod";
import { MoodId } from "./moods";
import { Paper } from "./notes";

/**
 * Dev-only simulated partner (API: /v1/dev, gated by DEV_TOOLS). Lets one person test every
 * two-person flow on a single device. Grows as features land.
 */
export const DevPartnerAction = z.discriminatedUnion("type", [
  z.object({ type: z.literal("online") }),
  z.object({ type: z.literal("offline") }),
  z.object({ type: z.literal("pet"), kind: z.enum(["feed", "pet", "play"]) }),
  z.object({ type: z.literal("pet.proposeName"), name: z.string().min(1).max(24) }),
  z.object({ type: z.literal("pet.acceptName") }),
  z.object({ type: z.literal("mood"), mood: MoodId.optional(), visibility: z.enum(["private", "shared"]) }),
  z.object({ type: z.literal("note.send"), body: z.string().min(1).max(500).optional(), paper: Paper.optional() }),
  z.object({ type: z.literal("note.openLatest") }),
  z.object({ type: z.literal("note.reactLatest") }),
  /** Partner answers (randomly) and completes every open quiz + today's daily question. */
  z.object({ type: z.literal("quiz.answerAll") }),
  /** Partner starts a pack (so you can test "they started a quiz"). */
  z.object({ type: z.literal("quiz.start"), packSlug: z.string() }),
  z.object({ type: z.literal("future.add"), title: z.string().min(1).max(120).optional() }),
  z.object({ type: z.literal("future.completeFirst") }),
  /** Partner writes today's journal (adds a block to today's page, creating it if needed). */
  z.object({ type: z.literal("journal.write"), body: z.string().max(5000).optional() }),
  /** Partner adds a generated placeholder photo to today's page. */
  z.object({ type: z.literal("journal.photo") }),
]);
export type DevPartnerAction = z.infer<typeof DevPartnerAction>;

export const DevPartnerInput = z.object({ name: z.string().trim().min(1).max(40).optional() });

export const DevPartnerStatus = z.object({
  enabled: z.boolean(),
  partner: z.object({ id: z.uuid(), displayName: z.string(), online: z.boolean() }).nullable(),
});
export type DevPartnerStatus = z.infer<typeof DevPartnerStatus>;
