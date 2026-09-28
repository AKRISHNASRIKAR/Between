import type { NotificationKind } from "./notifications";
import { fillPetCopy, MILESTONE_COPY, type PetMilestoneKind } from "./pet";

/**
 * A notice is one thing worth telling a member about. The server turns it into a push when
 * they're away and a live in-app banner when they're in the app — both use `noticeCopy`,
 * so every notification is written once, in the pet's voice, and never leaks private content.
 */
export type Notice =
  | { type: "note.waiting"; noteId: string; from: string }
  | { type: "vibe.shared"; from: string }
  | { type: "quiz.started"; sessionId: string; from: string; packTitle: string }
  | { type: "quiz.your_turn"; sessionId: string; from: string; daily: boolean }
  | { type: "quiz.ready"; sessionId: string; daily: boolean }
  | { type: "journal.written"; pageId: string; from: string }
  | { type: "journal.photos"; pageId: string; from: string; count: number }
  | { type: "future.done"; from: string; title: string }
  | { type: "pet.milestone"; kind: PetMilestoneKind };

/** Which pillar a notice belongs to — drives its colour (DESIGN §2.3). */
export type NoticePillar = "today" | "know" | "notes" | "remember" | "future" | "pet";

export type NoticeCopy = {
  title: string;
  body: string;
  /** Deep link opened when tapped. */
  url: string;
  pillar: NoticePillar;
  /** The member's setting that can switch this notice off. */
  pref: NotificationKind;
};

export function noticeCopy(n: Notice, petName: string): NoticeCopy {
  const pet = petName || "Your pet";
  switch (n.type) {
    case "note.waiting":
      return {
        title: `${pet} is holding something for you`,
        body: `A note from ${n.from} is waiting 💌`,
        url: `/notes/${n.noteId}`,
        pillar: "notes",
        pref: "notes",
      };
    case "vibe.shared":
      return {
        title: "Today's vibe",
        body: `${n.from} shared how today feels`,
        url: "/today",
        pillar: "today",
        pref: "vibes",
      };
    case "quiz.started":
      return {
        title: "A quiz for two",
        body: `${n.from} started “${n.packTitle}” — your turn when you're ready`,
        url: `/quiz/${n.sessionId}`,
        pillar: "know",
        pref: "quizzes",
      };
    case "quiz.your_turn":
      return {
        title: n.daily ? "Today's question" : "Your turn",
        body: `${n.from} has answered. ${pet} is dying to know yours.`,
        url: `/quiz/${n.sessionId}`,
        pillar: "know",
        pref: "quizzes",
      };
    case "quiz.ready":
      return {
        title: "Ready to reveal ✦",
        body: "You've both answered — come see how you match.",
        url: `/quiz/${n.sessionId}`,
        pillar: "know",
        pref: "quizzes",
      };
    case "journal.written":
      return {
        title: "Your journal",
        body: `${n.from} added their side of the story`,
        url: `/journal/${n.pageId}`,
        pillar: "remember",
        pref: "journal",
      };
    case "journal.photos":
      return {
        title: "New memories",
        body: `${n.from} added ${n.count === 1 ? "a photo" : `${n.count} photos`} to your journal`,
        url: `/journal/${n.pageId}`,
        pillar: "remember",
        pref: "journal",
      };
    case "future.done":
      return {
        title: "Done together ✦",
        body: `${n.from} stamped “${n.title}”`,
        url: "/future",
        pillar: "future",
        pref: "future",
      };
    case "pet.milestone": {
      const c = MILESTONE_COPY[n.kind];
      return { title: c.title, body: fillPetCopy(c.line, pet), url: "/pet", pillar: "pet", pref: "petUpdates" };
    }
  }
}
