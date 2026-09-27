import { z } from "zod";
import { LIMITS } from "./limits";

export const FutureCategory = z.enum(["dream", "place", "watch", "try", "goal"]);
export type FutureCategory = z.infer<typeof FutureCategory>;

export const FUTURE_CATEGORY_LABEL: Record<FutureCategory, string> = {
  dream: "Dream",
  place: "Place",
  watch: "Watch",
  try: "Try",
  goal: "Goal",
};

export const FutureItem = z.object({
  id: z.uuid(),
  title: z.string(),
  emoji: z.string().nullable(),
  note: z.string().nullable(),
  category: FutureCategory,
  position: z.string(),
  createdBy: z.uuid(),
  completedAt: z.string().nullable(),
  completedBy: z.uuid().nullable(),
  createdAt: z.string(),
  version: z.number(),
});
export type FutureItem = z.infer<typeof FutureItem>;

export const CreateFutureInput = z.object({
  id: z.uuid(),
  title: z.string().trim().min(LIMITS.futureTitle.min).max(LIMITS.futureTitle.max),
  emoji: z.string().max(8).nullable().optional(),
  note: z.string().trim().max(LIMITS.futureNote.max).nullable().optional(),
  category: FutureCategory.default("dream"),
});
export type CreateFutureInput = z.infer<typeof CreateFutureInput>;

export const UpdateFutureInput = z.object({
  title: z.string().trim().min(LIMITS.futureTitle.min).max(LIMITS.futureTitle.max).optional(),
  emoji: z.string().max(8).nullable().optional(),
  note: z.string().trim().max(LIMITS.futureNote.max).nullable().optional(),
  category: FutureCategory.optional(),
  /** Move between two neighbours (fractional index). */
  after: z.string().nullable().optional(),
  before: z.string().nullable().optional(),
  version: z.number().int(),
});
export type UpdateFutureInput = z.infer<typeof UpdateFutureInput>;

/**
 * Fractional index between two keys (base-36 strings). Lexicographic ordering; no renumbering.
 * a < result < b. null = open end.
 */
export function positionBetween(a: string | null, b: string | null): string {
  const DIGITS = "0123456789abcdefghijklmnopqrstuvwxyz";
  const lo = a ?? "";
  const hi = b ?? "";
  let out = "";
  for (let i = 0; ; i++) {
    const l = i < lo.length ? DIGITS.indexOf(lo[i] as string) : 0;
    const h = i < hi.length ? DIGITS.indexOf(hi[i] as string) : DIGITS.length;
    if (h - l > 1) return out + DIGITS[Math.floor((l + h) / 2)];
    out += DIGITS[l];
  }
}
