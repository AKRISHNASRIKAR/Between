import { type QuizSession, RESULT_COPY, withPartner } from "@lovenotes/contracts";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import {
  Avatar,
  Button,
  CaretRight,
  haptics,
  layout,
  PressableScale,
  palette,
  radius,
  space,
  Text,
} from "@/design-system";
import { useThemeSubscription } from "@/design-system/theme/ThemeProvider";
import { answerAgreement, answerLabel } from "./answer-view";
import { useMarkRevealSeen } from "./hooks";

type Person = { id: string; name: string; avatar?: string | null };
type Props = { session: QuizSession; spaceId: string; me: Person; partner: Person };

export function QuizReveal(props: Props) {
  const seen = useMarkRevealSeen(props.spaceId, props.session.id);
  const handled = useRef<string | null>(null);
  useEffect(() => {
    if (
      !props.session.readyAt ||
      !props.session.result ||
      props.session.revealSeenAt ||
      handled.current === props.session.id
    )
      return;
    handled.current = props.session.id;
    seen.mutate();
    haptics.tap();
  }, [props.session.id, props.session.readyAt, props.session.result, props.session.revealSeenAt, seen.mutate]);
  return (
    <QuizReport
      {...props}
      onDone={() => router.replace("/know")}
      markReadFailed={seen.isError}
      markingRead={seen.isPending}
      onMarkRead={() => seen.mutate()}
    />
  );
}

/** No network effects here: the same server report renders for either member and in the dev playground. */
export function QuizReport({
  session,
  me,
  partner,
  onDone,
  markReadFailed,
  markingRead,
  onMarkRead,
}: Omit<Props, "spaceId"> & {
  onDone: () => void;
  markReadFailed?: boolean;
  markingRead?: boolean;
  onMarkRead?: () => void;
}) {
  useThemeSubscription();
  const [expanded, setExpanded] = useState(new Set<string>());
  const [filter, setFilter] = useState<"all" | "alike" | "different">("all");
  const mine = useMemo(() => new Map(session.myAnswers.map((a) => [a.questionId, a])), [session.myAnswers]);
  const theirs = useMemo(
    () => new Map((session.partnerAnswers ?? []).map((a) => [a.questionId, a])),
    [session.partnerAnswers],
  );
  const result = session.result;
  if (!session.readyAt || !result || !session.partnerAnswers)
    return <Text variant="body">Your answers will appear here once you've both finished.</Text>;
  const myGuesses = session.questions.filter((q) => q.kind === "choice" && mine.get(q.id)?.guess).length;
  const theirGuesses = session.questions.filter((q) => q.kind === "choice" && theirs.get(q.id)?.guess).length;
  const questions = session.questions.map((q, i) => ({
    q,
    i,
    agreement: answerAgreement(q, mine.get(q.id), theirs.get(q.id)),
  }));
  const alike = questions.filter((item) => item.agreement === true).length;
  const different = questions.filter((item) => item.agreement === false).length;
  const shown = questions.filter(
    (item) => filter === "all" || (filter === "alike" ? item.agreement === true : item.agreement === false),
  );
  return (
    <View style={{ gap: space[6] }}>
      <View
        style={{
          gap: space[5],
          backgroundColor: palette.paper,
          padding: layout.cardPadding,
          borderRadius: radius.xl,
          borderCurve: "continuous",
          borderWidth: 1,
          borderColor: palette.line,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space[3] }}>
          <View style={{ flex: 1, gap: space[1] }}>
            <Text variant="label" color="action">
              Your shared result
            </Text>
            <Text variant="body-sm" color="ink-secondary">
              {session.pack?.title ?? "Today's question"}
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: space[1] }}>
            <Avatar size={28} name={me.name} uri={me.avatar ?? null} who="you" />
            <Avatar size={28} name={partner.name} uri={partner.avatar ?? null} who="partner" />
          </View>
        </View>
        <View style={{ gap: space[3] }}>
          <Text variant="display-l" accessibilityRole="header">
            {result.scored ? RESULT_COPY[result.label].title : "Two stories, closer."}
          </Text>
          <Text variant="body" color="ink-secondary">
            {result.scored ? RESULT_COPY[result.label].line : "A little more of your world, in each other's words."}
          </Text>
        </View>
        {result.scored > 0 ? (
          <>
            <View style={{ flexDirection: "row", gap: space[5], flexWrap: "wrap" }}>
              <View style={{ flex: 1, minWidth: space[20], gap: space[1] }}>
                <Text variant="display-m" color="action">
                  {result.agreed} / {result.scored}
                </Text>
                <Text variant="body-sm">answers alike</Text>
              </View>
              <View style={{ flex: 1, minWidth: space[20], gap: space[1] }}>
                <Text variant="display-m">{result.scored - result.agreed}</Text>
                <Text variant="body-sm">new perspectives</Text>
              </View>
            </View>
            <View
              style={{ flexDirection: "row", gap: space[1] }}
              accessibilityLabel={`${result.agreed} of ${result.scored} answers alike`}
            >
              {questions
                .filter((item) => item.agreement !== null)
                .map(({ q, agreement }) => (
                  <View
                    key={q.id}
                    style={{
                      flex: 1,
                      height: space[2],
                      borderRadius: radius.pill,
                      backgroundColor: agreement ? palette.action : palette.sunken,
                    }}
                  />
                ))}
            </View>
          </>
        ) : null}
        <Text variant="caption" color="ink-secondary">
          A snapshot of your answers, never a measure of your relationship.
        </Text>
      </View>
      {myGuesses + theirGuesses > 0 ? (
        <View style={{ gap: space[4] }}>
          <Text variant="heading">The little things you knew</Text>
          {[
            {
              person: me,
              ring: "you" as const,
              count: result.myCorrectGuesses,
              total: myGuesses,
              label: `${me.name} guessed ${partner.name}`,
            },
            {
              person: partner,
              ring: "partner" as const,
              count: result.theirCorrectGuesses,
              total: theirGuesses,
              label: `${partner.name} guessed ${me.name}`,
            },
          ].map(({ person, ring, count, total, label }) => (
            <View key={person.id} style={{ flexDirection: "row", alignItems: "center", gap: space[3] }}>
              <Avatar size={28} name={person.name} uri={person.avatar ?? null} who={ring} />
              <Text variant="body-sm" style={{ flex: 1 }}>
                {label}
              </Text>
              <Text variant="body-sm-strong" color="action">
                {total ? `${count} of ${total}` : "No guesses"}
              </Text>
            </View>
          ))}
          <Text variant="caption" color="ink-secondary">
            Predictions are compared with the other person's actual answer.
          </Text>
        </View>
      ) : null}
      <View style={{ gap: space[3] }}>
        <Text variant="heading" accessibilityRole="header">
          Your answers, side by side
        </Text>
        {alike + different > 0 ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[2] }}>
            {(
              [
                { id: "all", label: `All · ${questions.length}` },
                { id: "alike", label: `Alike · ${alike}` },
                { id: "different", label: `Different · ${different}` },
              ] as const
            ).map((item) => (
              <PressableScale
                key={item.id}
                accessibilityRole="button"
                accessibilityState={{ selected: filter === item.id }}
                onPress={() => setFilter(item.id)}
                style={{
                  minHeight: layout.minTouch,
                  paddingHorizontal: space[4],
                  justifyContent: "center",
                  borderRadius: radius.pill,
                  backgroundColor: filter === item.id ? palette["action-soft"] : palette.paper,
                }}
              >
                <Text variant="body-sm-strong" color={filter === item.id ? "on-action-soft" : "ink-secondary"}>
                  {item.label}
                </Text>
              </PressableScale>
            ))}
          </View>
        ) : (
          <Text variant="body-sm" color="ink-secondary">
            In your own words. These questions aren't scored.
          </Text>
        )}
      </View>
      {shown.length === 0 ? (
        <Text variant="body" color="ink-secondary">
          {filter === "alike"
            ? "No identical picks this time. There is more to discover in your different answers."
            : "No different picks this time. Explore all your answers above."}
        </Text>
      ) : null}
      {shown.map(({ q, i, agreement }) => {
        const a = mine.get(q.id);
        const b = theirs.get(q.id);
        const open = expanded.has(q.id);
        return (
          <View
            key={q.id}
            style={{
              backgroundColor: palette.paper,
              borderWidth: 1,
              borderColor: palette.line,
              borderRadius: radius.lg,
              borderCurve: "continuous",
              padding: layout.cardPadding,
              gap: space[4],
            }}
          >
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[2], justifyContent: "space-between" }}>
              <Text variant="caption" color="ink-secondary">
                QUESTION {i + 1}
              </Text>
              <Text variant="caption" color={agreement ? "action" : "ink-secondary"}>
                {agreement === null ? "In your own words" : agreement ? "A shared pick" : "Two perspectives"}
              </Text>
            </View>
            <Text variant="heading">{withPartner(q.promptSelf, partner.name)}</Text>
            {[
              { person: me, answer: a, ring: "you" as const },
              { person: partner, answer: b, ring: "partner" as const },
            ].map(({ person, answer, ring }) => (
              <View
                key={person.id}
                style={{ padding: space[4], backgroundColor: palette.sunken, borderRadius: radius.md, gap: space[2] }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: space[2] }}>
                  <Avatar size={28} name={person.name} uri={person.avatar ?? null} who={ring} />
                  <Text variant="caption" color="ink-secondary" style={{ flex: 1 }}>
                    {person.name}'s answer
                  </Text>
                </View>
                <Text variant="body" selectable>
                  {answerLabel(q, answer, "choice", [me, partner])}
                </Text>
              </View>
            ))}
            {q.kind === "choice" && (a?.guess || b?.guess) ? (
              <>
                <PressableScale
                  accessibilityLabel={`${open ? "Hide" : "Show"} predictions for question ${i + 1}`}
                  accessibilityState={{ expanded: open }}
                  onPress={() =>
                    setExpanded((old) => {
                      const next = new Set(old);
                      if (next.has(q.id)) next.delete(q.id);
                      else next.add(q.id);
                      return next;
                    })
                  }
                  style={{ minHeight: layout.minTouch, flexDirection: "row", alignItems: "center", gap: space[2] }}
                >
                  <Text variant="body-sm-strong" color="action" style={{ flex: 1 }}>
                    {open ? "Hide predictions" : "See what you predicted"}
                  </Text>
                  <CaretRight
                    size={16}
                    color={palette.action}
                    style={{ transform: [{ rotate: open ? "90deg" : "0deg" }] }}
                  />
                </PressableScale>
                {open ? (
                  <View
                    style={{ gap: space[4], borderTopWidth: 1, borderTopColor: palette.line, paddingTop: space[4] }}
                  >
                    {[
                      { id: me.id, name: me.name, target: partner.name, answer: a, actual: b?.choice },
                      { id: partner.id, name: partner.name, target: me.name, answer: b, actual: a?.choice },
                    ]
                      .filter((item) => item.answer?.guess)
                      .map((item) => (
                        <View key={item.id} style={{ gap: space[1] }}>
                          <Text variant="caption" color="ink-secondary">
                            {item.name}'s guess for {item.target}
                          </Text>
                          <Text variant="body-sm-strong">{answerLabel(q, item.answer, "guess", [me, partner])}</Text>
                          <Text variant="caption" color="ink-secondary">
                            {!item.actual
                              ? "Their actual answer isn't available."
                              : item.answer?.guess === item.actual
                                ? "A good read — that was their pick."
                                : "A surprise — compare with their answer above."}
                          </Text>
                        </View>
                      ))}
                  </View>
                ) : null}
              </>
            ) : null}
          </View>
        );
      })}
      {markReadFailed && onMarkRead ? (
        <Button variant="quiet" label="Mark this report as read" loading={markingRead} onPress={onMarkRead} />
      ) : null}
      <Button fullWidth label="Back to our quizzes" onPress={onDone} />
      <Text variant="caption" color="ink-secondary" align="center">
        Saved for both of you. Come back to these answers anytime.
      </Text>
    </View>
  );
}
