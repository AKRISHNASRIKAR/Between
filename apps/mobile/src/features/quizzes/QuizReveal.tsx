import { type QuizAnswer, type QuizQuestion, type QuizSession, RESULT_COPY, withPartner } from "@lovenotes/contracts";
import { useEffect, useMemo, useState } from "react";
import { useWindowDimensions, View } from "react-native";
import Animated, { FadeIn, FlipInYRight, ZoomIn } from "react-native-reanimated";
import { Button, CATEGORY_FAMILY, Confetti, family, haptics, lift, palette, radius, Text } from "@/design-system";
import { useMarkRevealSeen } from "./hooks";

type Who = { id: string; name: string };

function describe(
  q: QuizQuestion,
  a: QuizAnswer | undefined,
  field: "choice" | "guess",
  me: Who,
  partner: Who,
): string {
  if (!a) return "—";
  if (q.kind === "open") return a.text ?? "—";
  if (q.kind === "who") return a.whoUserId === me.id ? me.name : partner.name;
  const id = field === "choice" ? a.choice : a.guess;
  const o = q.options?.find((x) => x.id === id);
  return o ? `${o.glyph ? `${o.glyph} ` : ""}${o.label}` : "—";
}

function AnswerTile({
  label,
  value,
  tone,
  delay,
  hand,
}: {
  label: string;
  value: string;
  tone: "you" | "guess" | "them";
  delay: number;
  hand?: boolean;
}) {
  const bg = tone === "them" ? palette.ink : palette.paper;
  const fg = tone === "them" ? "on-ink" : "ink";
  return (
    <Animated.View entering={FlipInYRight.delay(delay).duration(700)}>
      <View style={{ backgroundColor: bg, borderRadius: radius.md, padding: 14, gap: 4, ...lift[1] }}>
        <Text variant="label" color={tone === "them" ? "on-ink" : "ink-tertiary"}>
          {label}
        </Text>
        <Text variant={hand ? "hand-m" : "heading"} color={fg}>
          {value}
        </Text>
      </View>
    </Animated.View>
  );
}

/**
 * The reveal (DESIGN §10.3): card by card — your answer, your guess, then theirs — with a
 * little verdict, and finally the playful result. Never framed as a test score.
 */
export function QuizReveal({
  session,
  spaceId,
  me,
  partner,
}: {
  session: QuizSession;
  spaceId: string;
  me: Who;
  partner: Who;
}) {
  const { height } = useWindowDimensions();
  const seen = useMarkRevealSeen(spaceId, session.id);
  const [index, setIndex] = useState(session.revealSeenAt ? session.questions.length : 0);
  const [burst, setBurst] = useState(0);
  const mine = useMemo(() => new Map(session.myAnswers.map((a) => [a.questionId, a])), [session.myAnswers]);
  const theirs = useMemo(
    () => new Map((session.partnerAnswers ?? []).map((a) => [a.questionId, a])),
    [session.partnerAnswers],
  );
  const f = family(CATEGORY_FAMILY[session.pack?.category ?? "daily"]);
  const q = session.questions[index];
  const atResult = index >= session.questions.length;
  const result = session.result;

  useEffect(() => {
    if (!q) return;
    const a = mine.get(q.id);
    const b = theirs.get(q.id);
    const match =
      q.kind === "choice" ? a?.choice === b?.choice : q.kind === "who" ? a?.whoUserId === b?.whoUserId : false;
    const t = setTimeout(() => (q.kind === "open" ? haptics.tap() : match ? haptics.yay() : haptics.thud()), 1100);
    return () => clearTimeout(t);
  }, [q, mine, theirs]);

  useEffect(() => {
    if (!atResult || !result) return;
    if (!session.revealSeenAt) seen.mutate();
    if (["same_brain", "know_them_well", "chaos_couple"].includes(result.label)) {
      setBurst((b) => b + 1);
      haptics.yay();
    }
  }, [atResult, result, session.revealSeenAt, seen.mutate]);

  if (atResult && result) {
    const copy = RESULT_COPY[result.label];
    return (
      <View style={{ gap: 20 }}>
        <Animated.View entering={ZoomIn.springify().damping(12)}>
          <View style={{ backgroundColor: f.base, borderRadius: radius.xl, padding: 24, gap: 12, ...lift[2] }}>
            <Text variant="label" style={{ color: f.onBase }}>
              Your vibe
            </Text>
            <Text variant="display-xl" style={{ color: f.onBase }}>
              {copy.title}
            </Text>
            <Text variant="hand-m" style={{ color: f.onBase }}>
              {copy.line}
            </Text>
            {result.scored > 0 ? (
              <View style={{ flexDirection: "row", gap: 24, paddingTop: 8 }}>
                <View>
                  <Text variant="numeral" style={{ color: f.onBase }}>
                    {result.agreed}/{result.scored}
                  </Text>
                  <Text variant="caption" style={{ color: f.onBase }}>
                    answered alike
                  </Text>
                </View>
                {session.questions.some((x) => x.kind === "choice") ? (
                  <View>
                    <Text variant="numeral" style={{ color: f.onBase }}>
                      {result.myCorrectGuesses}
                    </Text>
                    <Text variant="caption" style={{ color: f.onBase }}>
                      you guessed right
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        </Animated.View>
        <Text variant="label" color="ink-tertiary">
          All answers
        </Text>
        {session.questions.map((qq) => (
          <View key={qq.id} style={{ backgroundColor: palette.paper, borderRadius: radius.md, padding: 14, gap: 6 }}>
            <Text variant="heading">{withPartner(qq.promptSelf, partner.name)}</Text>
            <Text variant="body-sm" color="ink-secondary">
              You: {describe(qq, mine.get(qq.id), "choice", me, partner)}
            </Text>
            <Text variant="body-sm" color="ink-secondary">
              {partner.name}: {describe(qq, theirs.get(qq.id), "choice", me, partner)}
            </Text>
          </View>
        ))}
        <Confetti burst={burst} height={height} />
      </View>
    );
  }

  if (!q) return null;
  const a = mine.get(q.id);
  const b = theirs.get(q.id);
  const verdict =
    q.kind === "open"
      ? null
      : (q.kind === "choice" ? a?.choice === b?.choice : a?.whoUserId === b?.whoUserId)
        ? "Same answer ✦"
        : "Not quite 😭";

  return (
    <View style={{ gap: 14 }}>
      <Text variant="caption" color="ink-tertiary">
        {index + 1} of {session.questions.length}
      </Text>
      <Animated.View key={q.id} entering={FadeIn.duration(300)} style={{ gap: 12 }}>
        <Text variant="display-m">{withPartner(q.promptSelf, partner.name)}</Text>
        <AnswerTile
          label="You said"
          value={describe(q, a, "choice", me, partner)}
          tone="you"
          delay={200}
          hand={q.kind === "open"}
        />
        {q.kind === "choice" ? (
          <AnswerTile
            label={`You guessed ${partner.name} would say`}
            value={describe(q, a, "guess", me, partner)}
            tone="guess"
            delay={500}
          />
        ) : null}
        <AnswerTile
          label={`${partner.name} said`}
          value={describe(q, b, "choice", me, partner)}
          tone="them"
          delay={900}
          hand={q.kind === "open"}
        />
        {verdict ? (
          <Animated.View entering={ZoomIn.delay(1300).springify()}>
            <Text variant="display-m" align="center" color={verdict.startsWith("Same") ? "green-deep" : "coral-deep"}>
              {verdict}
            </Text>
          </Animated.View>
        ) : null}
      </Animated.View>
      <Button
        fullWidth
        label={index + 1 === session.questions.length ? "See our result" : "Next"}
        onPress={() => setIndex((i) => i + 1)}
      />
    </View>
  );
}
