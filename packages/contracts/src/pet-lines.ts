import type { PetMood } from "./pet";

/** What the pet says in its speech bubble. Data, not UI — easy to extend and localize. */
export type PetLineContext = {
  mood: PetMood;
  localHour: number;
  partnerName: string | null;
  partnerOnline: boolean;
  /** Partner just interacted with the pet (realtime). */
  partnerAction?: "feed" | "pet" | "play" | null;
  /** Someone left the viewer an unopened note. */
  noteWaiting?: boolean;
  /** Deterministic pick (e.g. day-of-year) so the line doesn't flicker on re-render. */
  seed: number;
};

const pick = <T>(xs: readonly T[], seed: number): T => xs[Math.abs(seed) % xs.length] as T;

export function petLine(c: PetLineContext): string {
  const p = c.partnerName ?? "your person";
  if (c.partnerAction === "feed") return `${p} just gave me a snack!`;
  if (c.partnerAction === "pet") return `${p} is giving me head scratches.`;
  if (c.partnerAction === "play") return `${p} threw the ball!`;
  if (c.noteWaiting) return pick([`${p} left you something!`, `psst… I'm holding a note from ${p}`], c.seed);
  if (c.partnerOnline) return pick([`You're both here!`, `Oh! ${p} is here too.`, `Everyone's home.`], c.seed);

  switch (c.mood) {
    case "sleepy":
      return pick(["zzz… five more minutes", "*yawns* hi…", "just resting my eyes"], c.seed);
    case "peckish":
      return pick(["is it snack o'clock?", "my tummy is making noises", "I could eat. just saying."], c.seed);
    case "excited":
      return pick(["something good happened!", "I can't sit still!", "today feels special"], c.seed);
    default:
      break;
  }
  if (c.localHour < 12) return pick(["good morning ☀", "morning! did you sleep well?", "a brand new day"], c.seed);
  if (c.localHour < 18) return pick(["hi hi hi", "thinking about you two", "what are we up to today?"], c.seed);
  return pick(["good evening", "cozy time?", `say hi to ${p} for me`], c.seed);
}
