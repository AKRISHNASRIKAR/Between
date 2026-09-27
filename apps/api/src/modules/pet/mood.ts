import type { PetMood, PetStage } from "@lovenotes/contracts";
import { HOUR_MS } from "../../lib/time";

export type PetMoodInput = {
  stage: PetStage;
  lastFedAt: Date | null;
  lastPlayedAt: Date | null;
  lastPettedAt: Date | null;
  lastSharedActivityAt: Date | null;
};

const max = (...ds: Array<Date | null>) =>
  ds.reduce<number | null>((acc, d) => (d && (acc === null || d.getTime() > acc) ? d.getTime() : acc), null);

/**
 * Pet mood is *derived*, never stored — there is no decay job and no failure state.
 * The worst a neglected pet gets is "sleepy". Private moods never feed into this.
 */
export function derivePetMood(p: PetMoodInput, now: Date, viewerLocalHour: number): PetMood {
  if (p.stage === "egg") return "content";
  const t = now.getTime();
  const lastAny = max(p.lastFedAt, p.lastPlayedAt, p.lastPettedAt, p.lastSharedActivityAt);

  if (p.lastSharedActivityAt && t - p.lastSharedActivityAt.getTime() < 2 * HOUR_MS) return "excited";
  if (viewerLocalHour >= 23 || viewerLocalHour < 6) return "sleepy";
  if (lastAny === null || t - lastAny > 48 * HOUR_MS) return "sleepy";
  if (!p.lastFedAt || t - p.lastFedAt.getTime() > 20 * HOUR_MS) return "peckish";
  if (t - lastAny < 12 * HOUR_MS) return "happy";
  return "content";
}
