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

export function ago(at: Date, now: Date): string {
  const h = (now.getTime() - at.getTime()) / HOUR_MS;
  if (h < 1) return "just now";
  if (h < 12) return `${Math.floor(h)}h ago`;
  if (h < 36) return "yesterday";
  return `${Math.floor(h / 24)} days ago`;
}

/**
 * Well-being (CONTEXT "Well-being", ADR 0003): three soft states derived from recent care.
 * Nothing drains to empty; the lowest any state goes is "calm". `name(userId)` returns
 * "you" for the viewer and the partner's name otherwise.
 */
export function deriveWellbeing(
  p: WellbeingInput,
  recent: CareMoment[],
  name: (userId: string) => string,
  now: Date,
): PetWellbeing {
  if (p.stage === "egg") {
    const calm = { value: WELLBEING_FLOOR, word: "cozy" };
    return { fullness: calm, energy: calm, love: calm, reasons: ["Warm in the nest, waiting to hatch"] };
  }
  const loveFrom =
    [p.lastPettedAt, p.lastSharedActivityAt]
      .filter((d): d is Date => !!d)
      .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
  const fullness = settle(p.lastFedAt, 20, now);
  const energy = settle(p.lastPlayedAt, 24, now);
  const love = settle(loveFrom, 36, now);

  const VERB = { feed: "Fed", pet: "Petted", play: "Played with" } as const;
  const latest = new Map<string, CareMoment>();
  for (const c of [...recent].sort((a, b) => b.at.getTime() - a.at.getTime()))
    if (!latest.has(c.kind)) latest.set(c.kind, c);
  const reasons = [...latest.values()]
    .slice(0, 3)
    .map((c) => `${VERB[c.kind]} by ${name(c.byUserId)} ${ago(c.at, now)}`);
  if (reasons.length === 0) reasons.push("Resting and happy to see you");

  return {
    fullness: { value: fullness, word: word(fullness, "full", "content", "peckish") },
    energy: { value: energy, word: word(energy, "bouncy", "playful", "cozy") },
    love: { value: love, word: word(love, "adored", "loved", "calm") },
    reasons,
  };
}
