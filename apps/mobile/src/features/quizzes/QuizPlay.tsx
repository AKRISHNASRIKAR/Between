import { type QuizAnswer, type QuizQuestion, type QuizSession, withPartner } from "@lovenotes/contracts";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import Animated, { SlideInRight, SlideOutLeft } from "react-native-reanimated";
import {
  ArrowLeft,
  Avatar,
  Button,
  CATEGORY_LABEL,
  dur,
  ease,
  lift,
  PressableScale,
  palette,
  quizColors,
  radius,
  Text,
  TextField,
  useToast,
} from "@/design-system";
import { humanError } from "@/lib/errors";
import { useAnswer, useCompleteQuiz } from "./hooks";
import { OptionRow } from "./OptionRow";

type Step = { q: QuizQuestion; part: "self" | "guess" };

function stepsOf(questions: QuizQuestion[]): Step[] {
  return questions.flatMap((q) =>
    q.kind === "choice"
      ? [
          { q, part: "self" as const },
          { q, part: "guess" as const },
        ]
      : [{ q, part: "self" as const }],
  );
}

/** whoUserId is a real user id from the server, or "me"/"partner" while an answer is in flight. */
function whoPicked(whoUserId: string | null | undefined, myId: string): "me" | "partner" | null {
  if (!whoUserId) return null;
  return whoUserId === "me" || whoUserId === myId ? "me" : "partner";
}

const isAnswered = (a: QuizAnswer | undefined, s: Step) =>
  !!a &&
  (s.q.kind === "choice"
    ? s.part === "self"
      ? !!a.choice
      : !!a.guess
    : s.q.kind === "who"
      ? !!a.whoUserId
      : !!a.text);

/** One card per step. Choice questions are two steps: your pick, then your guess of theirs. */
export function QuizPlay({
  session,
  spaceId,
  me,
  partner,
}: {
  session: QuizSession;
  spaceId: string;
  me: { id: string; name: string; avatar: string | null };
  partner: { name: string; avatar: string | null };
}) {
  const steps = useMemo(() => stepsOf(session.questions), [session.questions]);
  const answers = useMemo(() => new Map(session.myAnswers.map((a) => [a.questionId, a])), [session.myAnswers]);
  const firstOpen = steps.findIndex((s) => !isAnswered(answers.get(s.q.id), s));
  const [index, setIndex] = useState(firstOpen === -1 ? steps.length : firstOpen);
  const [draftText, setDraftText] = useState("");
  const save = useAnswer(spaceId, session.id);
  const complete = useCompleteQuiz(spaceId, session.id);
  const toast = useToast();

  const category = session.pack?.category ?? "daily";
  const t = quizColors(category);
  const step = steps[index];
  const current = step ? answers.get(step.q.id) : undefined;

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset the draft whenever the question changes
  useEffect(() => {
    if (step?.q.kind === "open") setDraftText(current?.text ?? "");
  }, [step?.q.id, step?.q.kind, current?.text]);

  const next = () => setIndex((i) => Math.min(i + 1, steps.length));

  const commit = (input: Parameters<typeof save.mutate>[0]["input"], advance = true) => {
    if (!step) return;
    save.mutate({ questionId: step.q.id, input }, { onError: (e) => toast({ kind: "error", message: humanError(e) }) });
    if (advance) setTimeout(next, 220);
  };

  if (!step) {
    const allDone = steps.every((s) => isAnswered(answers.get(s.q.id), s));
    return (
      <View style={{ gap: 20 }}>
        <Text variant="display-l">All answered.</Text>
        <Text variant="body" color="ink-secondary">
          Once you send them, your answers are locked — and stay hidden until {partner.name} finishes too.
        </Text>
        <Button
          fullWidth
          label="Send my answers"
          loading={complete.isPending}
          disabled={!allDone}
          onPress={() =>
            complete.mutate(undefined, { onError: (e) => toast({ kind: "error", message: humanError(e) }) })
          }
        />
        <Button fullWidth variant="quiet" label="Go back and change something" onPress={() => setIndex(0)} />
      </View>
    );
  }

  const prompt =
    step.part === "guess"
      ? withPartner(step.q.promptGuess ?? "", partner.name)
      : withPartner(step.q.promptSelf, partner.name);
  const progress = (index + 1) / steps.length;

  return (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        {index > 0 ? (
          <PressableScale
            accessibilityLabel="Previous question"
            onPress={() => setIndex((i) => Math.max(0, i - 1))}
            hitSlop={10}
          >
            <ArrowLeft size={22} color={palette.ink} weight="bold" />
          </PressableScale>
        ) : null}
        <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: palette.sunken, overflow: "hidden" }}>
          <View style={{ width: `${progress * 100}%`, height: 6, backgroundColor: t.fill }} />
        </View>
        <Text variant="caption" color="ink-tertiary">
          {index + 1}/{steps.length}
        </Text>
      </View>

      <Animated.View
        key={`${step.q.id}-${step.part}`}
        entering={SlideInRight.duration(dur.base).easing(ease.out)}
        exiting={SlideOutLeft.duration(dur.fast)}
      >
        <View style={{ backgroundColor: t.fill, borderRadius: radius.xl, padding: 20, gap: 16, ...lift[1] }}>
          <Text variant="label" style={{ color: t.text }}>
            {step.part === "guess" ? `Now guess ${partner.name}'s answer` : CATEGORY_LABEL[category]}
          </Text>
          <Text variant="display-m" style={{ color: t.text }} accessibilityRole="header">
            {prompt}
          </Text>

          <View style={{ gap: 8 }}>
            {step.q.kind === "choice"
              ? (step.q.options ?? []).map((o) => (
                  <OptionRow
                    key={o.id}
                    label={o.label}
                    glyph={o.glyph}
                    selected={(step.part === "self" ? current?.choice : current?.guess) === o.id}
                    onPress={() =>
                      commit(
                        step.part === "self"
                          ? { choice: o.id, ...(current?.guess ? { guess: current.guess } : {}) }
                          : { choice: current?.choice ?? o.id, guess: o.id },
                      )
                    }
                  />
                ))
              : null}
            {step.q.kind === "who"
              ? (
                  [
                    { who: "me" as const, label: `Me (${me.name})`, avatar: me.avatar, ring: "you" as const },
                    { who: "partner" as const, label: partner.name, avatar: partner.avatar, ring: "partner" as const },
                  ] as const
                ).map((o) => (
                  <OptionRow
                    key={o.who}
                    label={o.label}
                    leading={<Avatar size={28} name={o.label} uri={o.avatar} who={o.ring} />}
                    selected={whoPicked(current?.whoUserId, me.id) === o.who}
                    onPress={() => commit({ who: o.who })}
                  />
                ))
              : null}
            {step.q.kind === "open" ? (
              <View style={{ gap: 10 }}>
                <TextField
                  label="Your answer"
                  multiline
                  value={draftText}
                  onChangeText={setDraftText}
                  maxLength={280}
                  placeholder="A few words…"
                />
                <Button label="Next" disabled={!draftText.trim()} onPress={() => commit({ text: draftText.trim() })} />
              </View>
            ) : null}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
