/** Bond sources and per-user rolling-24h caps. See SPEC §4.6. Bond never decreases. */
export const BOND_RULES = {
  "pet.feed": { delta: 1, cap: 3 },
  "pet.pet": { delta: 1, cap: 3 },
  "pet.play": { delta: 1, cap: 3 },
  "note.created": { delta: 3, cap: 3 },
  "journal.block_added": { delta: 3, cap: 3 },
  "media.added": { delta: 1, cap: 5 },
  "mood.shared": { delta: 2, cap: 1 },
  "quiz.completed_both": { delta: 8, cap: null },
  "daily.answered_both": { delta: 3, cap: null },
  "future.completed": { delta: 10, cap: null },
  "space.both_active": { delta: 5, cap: 1 },
} as const satisfies Record<string, { delta: number; cap: number | null }>;

export type BondSource = keyof typeof BOND_RULES;

/** Bond earned for one more occurrence, given how many already counted in the window. */
export function bondFor(source: BondSource, alreadyInWindow: number): number {
  const rule = BOND_RULES[source];
  return rule.cap === null || alreadyInWindow < rule.cap ? rule.delta : 0;
}
