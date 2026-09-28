import type { PetMilestoneKind, PetStage } from "@lovenotes/contracts";
import type { BondSource } from "./bond";

/** Stage rules: time together AND shared care — you can't grind or wait your way up alone. */
const NEXT: Partial<Record<PetStage, { to: PetStage; minDays: number; minBond: number }>> = {
  baby: { to: "young", minDays: 14, minBond: 150 },
  young: { to: "grown", minDays: 60, minBond: 600 },
};

export function nextStage(stage: PetStage, bond: number, ageDays: number): PetStage | null {
  const rule = NEXT[stage];
  return rule && ageDays >= rule.minDays && bond >= rule.minBond ? rule.to : null;
}

const FIRSTS: Partial<Record<BondSource, PetMilestoneKind>> = {
  "note.created": "first_note",
  "journal.block_added": "first_page",
  "media.added": "first_photo",
  "mood.shared": "first_shared_vibe",
  "quiz.completed_both": "first_reveal",
  "daily.answered_both": "first_reveal",
  "future.completed": "first_future_done",
};

/**
 * Every milestone the pet qualifies for right now. The repository records each only once,
 * so returning ones that were already earned is harmless.
 */
export function eligibleMilestones(s: {
  source?: BondSource;
  bond: number;
  ageDays: number;
  stage: PetStage;
}): PetMilestoneKind[] {
  const out: PetMilestoneKind[] = [];
  const first = s.source ? FIRSTS[s.source] : undefined;
  if (first) out.push(first);
  if (s.bond >= 50) out.push("bond_50");
  if (s.bond >= 150) out.push("bond_150");
  if (s.bond >= 400) out.push("bond_400");
  if (s.ageDays >= 30) out.push("together_30");
  if (s.ageDays >= 100) out.push("together_100");
  if (s.stage === "young" || s.stage === "grown") out.push("stage_young");
  if (s.stage === "grown") out.push("stage_grown");
  return out;
}
