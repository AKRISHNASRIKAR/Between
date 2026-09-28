import { MOODS, type MoodCheckin, type WidgetSnapshot } from "@lovenotes/contracts";
import type { SpaceScope } from "../../lib/scope";
import { localDate } from "../../lib/time";
import { withTx } from "../../lib/tx";
import { displayName, membersRepo } from "../members";
import { countWaitingNotes } from "../notes";
import { petRepo, petView } from "../pet";
import { getDaily } from "../quizzes";
import { getVibe } from "../vibes";

const vibeOf = (c: MoodCheckin | null) => (c ? { mood: c.mood, label: MOODS[c.mood].label } : null);

/**
 * The home-screen widget's view of the space (docs/architecture/10-widgets.md). Built only from
 * other modules' public reads, so it can never show more than the app does — and it shows less:
 * counts instead of note text, and the partner's Vibe only when they shared it.
 */
export async function widgetSnapshot(scope: SpaceScope): Promise<WidgetSnapshot> {
  const today = localDate(new Date(), scope.timezone);
  const [{ pet, members }, vibe, notesWaiting, daily] = await Promise.all([
    withTx(async (tx) => {
      const row = await petRepo.get(tx, scope);
      return { pet: row ? await petView(tx, scope, row) : null, members: await membersRepo.of(tx, scope) };
    }),
    getVibe(scope, today),
    countWaitingNotes(scope),
    scope.writable ? getDaily(scope) : Promise.resolve(null),
  ]);
  const partner = scope.partnerId ? members.find((m) => m.id === scope.partnerId) : undefined;

  return {
    v: 1,
    state: scope.writable ? "ready" : "closed",
    pet: {
      name: pet?.name ?? "Your pet",
      stage: pet?.stage ?? "egg",
      mood: pet?.mood ?? "content",
    },
    you: { name: displayName(members, scope.userId), vibe: vibeOf(vibe.me) },
    partner: partner ? { name: partner.name || "Your person", vibe: vibeOf(vibe.partner) } : null,
    notesWaiting,
    daily: !daily
      ? "none"
      : daily.readyAt
        ? daily.revealSeenAt
          ? "done"
          : "ready"
        : daily.myCompletedAt
          ? "waiting"
          : "yours",
    generatedAt: new Date().toISOString(),
  };
}
