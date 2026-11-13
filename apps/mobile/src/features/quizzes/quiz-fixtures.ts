import { type QuizAnswer, type QuizSession, scoreQuiz } from "@lovenotes/contracts";

/** Synthetic UI fixtures. Imported only by the __DEV__ playground; never written to Query or API. */
export const quizPeople = {
  me: { id: "00000000-0000-4000-8000-000000000001", name: "Sam", avatar: null },
  partner: { id: "00000000-0000-4000-8000-000000000002", name: "Alex", avatar: null },
};
export function quizFixture(scene: string): QuizSession {
  const questions: QuizSession["questions"] = [
    {
      id: "00000000-0000-4000-8000-000000000011",
      kind: "choice",
      promptSelf: "Your perfect free afternoon looks like…",
      promptGuess: "What would {partner} choose?",
      options: [
        { id: "slow", label: "A slow day at home" },
        { id: "outside", label: "An unplanned adventure" },
        { id: "food", label: "Somewhere new to eat" },
        { id: "friends", label: "Time with our favourite people" },
      ],
    },
    {
      id: "00000000-0000-4000-8000-000000000012",
      kind: "who",
      promptSelf: "Who turns a small plan into a big adventure?",
      promptGuess: null,
      options: null,
    },
    {
      id: "00000000-0000-4000-8000-000000000013",
      kind: "open",
      promptSelf: "What is one ordinary moment you would relive?",
      promptGuess: null,
      options: null,
    },
  ];
  const mine: QuizAnswer[] = [
    {
      questionId: "00000000-0000-4000-8000-000000000011",
      choice: "slow",
      guess: "outside",
      whoUserId: null,
      text: null,
    },
    {
      questionId: "00000000-0000-4000-8000-000000000012",
      choice: null,
      guess: null,
      whoUserId: quizPeople.partner.id,
      text: null,
    },
    {
      questionId: "00000000-0000-4000-8000-000000000013",
      choice: null,
      guess: null,
      whoUserId: null,
      text: "That rainy Sunday. Nowhere to be, coffee going cold, and you laughing at my terrible movie choice.",
    },
  ];
  const theirs: QuizAnswer[] = [
    {
      questionId: "00000000-0000-4000-8000-000000000011",
      choice: "outside",
      guess: "slow",
      whoUserId: null,
      text: null,
    },
    {
      questionId: "00000000-0000-4000-8000-000000000012",
      choice: null,
      guess: null,
      whoUserId: quizPeople.partner.id,
      text: null,
    },
    {
      questionId: "00000000-0000-4000-8000-000000000013",
      choice: null,
      guess: null,
      whoUserId: null,
      text: "The walk home after dinner. We took the long way without saying why.",
    },
  ];
  const time = "2026-10-31T12:00:00.000Z";
  const report = scene === "report";
  return {
    id: "00000000-0000-4000-8000-000000000010",
    kind: "pack",
    pack: {
      id: "00000000-0000-4000-8000-000000000020",
      slug: "little-things",
      category: "favorites",
      title: "The little things",
      subtitle: "Small details, more of you.",
      questionCount: 3,
    },
    dailyDate: null,
    questions,
    myAnswers:
      scene === "play" || scene === "library"
        ? []
        : scene === "guess"
          ? mine.slice(0, 1).map((answer) => ({ ...answer, guess: null }))
          : scene === "who"
            ? mine.slice(0, 1)
            : scene === "open"
              ? mine.slice(0, 2)
              : mine,
    myCompletedAt: report || scene === "waiting" ? time : null,
    partnerAnsweredCount: report ? 3 : 0,
    partnerCompletedAt: report ? time : null,
    partnerAnswers: report ? theirs : null,
    result: report ? scoreQuiz(questions, mine, theirs, false) : null,
    readyAt: report ? time : null,
    revealSeenAt: report ? time : null,
    createdAt: time,
  };
}
