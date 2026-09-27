import { MOODS, type MoodId } from "./moods";

/**
 * Gentle one-liners for two *shared* moods. Curated, never generated, never clinical (SPEC §4.1).
 * Any negative mood gets supportive-neutral copy or nothing.
 */
const PAIRS: Array<[MoodId, MoodId, string]> = [
  ["tired", "tired", "A quiet day for both of you."],
  ["calm", "calm", "Slow and steady today."],
  ["joyful", "joyful", "Good energy in here today."],
  ["joyful", "excited", "Good energy in here today."],
  ["excited", "excited", "Something's in the air."],
  ["grateful", "grateful", "A thankful kind of day."],
  ["connected", "connected", "Close, even from far away."],
  ["connected", "grateful", "A warm one."],
  ["calm", "tired", "Maybe a cozy evening in."],
  ["joyful", "tired", "One of you might need a little extra care."],
  ["excited", "tired", "Different speeds today — that's okay."],
];

const key = (a: MoodId, b: MoodId) => [a, b].sort().join("+");
const TABLE = new Map(PAIRS.map(([a, b, text]) => [key(a, b), text]));

export function observation(a: MoodId, b: MoodId): string | null {
  const neg = MOODS[a].valence === "negative" || MOODS[b].valence === "negative";
  if (neg) return "Go gently with each other today.";
  return TABLE.get(key(a, b)) ?? null;
}
