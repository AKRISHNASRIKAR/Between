import { type PetStage, type PetWellbeing, WELLBEING_FLOOR } from "@lovenotes/contracts";
import { HOUR_MS } from "../../lib/time";

export type CareMoment = { kind: "feed" | "pet" | "play"; at: Date; byUserId: string };

export type WellbeingInput = {
  stage: PetStage;
  lastFedAt: Date | null;
  lastPlayedAt: Date | null;
  lastPettedAt: Date | null;
  lastSharedActivityAt: Date | null;
};

/** Fills to 1 right after care, then settles linearly back to the calm floor — never below. */
function settle(last: Date | null, hours: number, now: Date): number {
  if (!last) return WELLBEING_FLOOR;
  const t = (now.getTime() - last.getTime()) / (hours * HOUR_MS);
  return Number((WELLBEING_FLOOR + (1 - WELLBEING_FLOOR) * Math.max(0, 1 - t)).toFixed(2));
}

const word = (v: number, high: string, mid: string, low: string) => (v >= 0.8 ? high : v >= 0.55 ? mid : low);

/**
 * Well-being (CONTEXT "Well-being", ADR 0003): three soft states derived from recent care.
 * Nothing drains to empty; the lowest any state goes is "calm". The result is the same for
 * both members (it's broadcast as-is), so it names no one — the app phrases `lastCare` per viewer.
 */
export function deriveWellbeing(p: WellbeingInput, recent: CareMoment[], now: Date): PetWellbeing {
  if (p.stage === "egg") {
    const calm = { value: WELLBEING_FLOOR, word: "cozy" };
    return { fullness: calm, energy: calm, love: calm, lastCare: [] };
  }
  const loveFrom =
    [p.lastPettedAt, p.lastSharedActivityAt]
      .filter((d): d is Date => !!d)
      .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
  const fullness = settle(p.lastFedAt, 20, now);
  const energy = settle(p.lastPlayedAt, 24, now);
  const love = settle(loveFrom, 36, now);

  const latest = new Map<string, CareMoment>();
  for (const c of [...recent].sort((a, b) => b.at.getTime() - a.at.getTime()))
    if (!latest.has(c.kind)) latest.set(c.kind, c);
  const lastCare = [...latest.values()].map((c) => ({ kind: c.kind, byUserId: c.byUserId, at: c.at.toISOString() }));

  return {
    fullness: { value: fullness, word: word(fullness, "full", "content", "peckish") },
    energy: { value: energy, word: word(energy, "bouncy", "playful", "cozy") },
    love: { value: love, word: word(love, "adored", "loved", "calm") },
    lastCare,
  };
}
