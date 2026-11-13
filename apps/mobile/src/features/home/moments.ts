import { MOODS, PET_MOOD_WORD, type Pet, type QuizSession, type Vibe, withPartner } from "@lovenotes/contracts";

export type HomeMoment = {
  kind: "note" | "quiz" | "vibe" | "pet" | "pet-decision";
  title: string;
  body: string;
  action: string;
  pending: boolean;
};

type Input = {
  notesWaiting: number;
  daily: Pick<QuizSession, "questions" | "myCompletedAt" | "readyAt" | "revealSeenAt"> | null | undefined;
  vibe:
    | {
        me: Pick<NonNullable<Vibe["me"]>, "mood" | "visibility"> | null;
        partner: Pick<NonNullable<Vibe["partner"]>, "mood"> | null;
      }
    | undefined;
  pet: Pick<Pet, "status" | "proposedEnabled" | "decisionById" | "name" | "mood"> | undefined;
  myId: string | undefined;
  partnerName: string;
};

/** A finite set of genuine moments. Optional discovery never prevents feeling caught up. */
export function homeMoments({ notesWaiting, daily, vibe, pet, myId, partnerName }: Input) {
  const moments: HomeMoment[] = [];
  if (notesWaiting > 0)
    moments.push({
      kind: "note",
      title: `Something from ${partnerName}`,
      body: notesWaiting === 1 ? "One little note, just for you." : `${notesWaiting} notes are waiting for you.`,
      action: notesWaiting === 1 ? "Open their note" : "Open their notes",
      pending: true,
    });
  const question = daily?.questions[0];
  const questionText = question ? withPartner(question.promptSelf, partnerName) : "A little more to discover together.";
  if (daily?.readyAt && !daily.revealSeenAt)
    moments.push({
      kind: "quiz",
      title: "Your answers are ready",
      body: questionText,
      action: "Reveal your answers",
      pending: true,
    });
  // A real partner suggestion is meaningful. No pet promotion appears for NONE or PAUSED.
  if (pet?.proposedEnabled !== null && pet?.proposedEnabled !== undefined && pet.decisionById !== myId)
    moments.push({
      kind: "pet-decision",
      title: `A suggestion from ${partnerName}`,
      body: pet.proposedEnabled
        ? "They suggested a little pet to care for together. Only if you both want to."
        : "They suggested giving your pet a pause. Its story stays safe.",
      action: "Consider their suggestion",
      pending: true,
    });
  if (vibe && !vibe.me)
    moments.push({
      kind: "vibe",
      title: "How are you feeling?",
      body: "A small check-in. Share it, or keep it just for you.",
      action: "Check in",
      pending: true,
    });
  if (daily && !daily.myCompletedAt && !daily.revealSeenAt && !daily.readyAt)
    moments.push({
      kind: "quiz",
      title: "A question for two",
      body: questionText,
      action: "Answer today's question",
      pending: true,
    });
  if (vibe?.me) {
    const mine = MOODS[vibe.me.mood].label.toLowerCase();
    const theirs = vibe.partner ? MOODS[vibe.partner.mood].label.toLowerCase() : null;
    moments.push({
      kind: "vibe",
      title: vibe.me.visibility === "shared" && theirs ? "You both checked in" : "Your check-in is saved",
      body: `You're feeling ${mine}${vibe.me.visibility === "private" ? " · just for you" : ""}. ${theirs ? `${partnerName} is feeling ${theirs}.` : "Their mood is theirs to share, whenever they like."}`,
      action: "View today's vibe",
      pending: false,
    });
  }
  if (pet?.status === "ACTIVE")
    moments.push({
      kind: "pet",
      title: pet.name ?? "Your little one",
      body: `Feeling ${PET_MOOD_WORD[pet.mood]}. A little hello, if you like.`,
      action: "Say hello",
      pending: false,
    });
  if (daily?.myCompletedAt && !daily.readyAt)
    moments.push({
      kind: "quiz",
      title: "Your answer is tucked away",
      body: `${partnerName} can answer in their own time. You'll see both answers when they're ready.`,
      action: "View your question",
      pending: false,
    });
  return { moments: moments.slice(0, 3), caughtUp: !moments.some((moment) => moment.pending) };
}
