import { type QuizSession, withPartner } from "@lovenotes/contracts";
import { router } from "expo-router";
import { View } from "react-native";
import {
  ArrowRight,
  CategoryCreature,
  layout,
  PressableScale,
  palette,
  radius,
  Skeleton,
  space,
  Text,
} from "@/design-system";
import { useThemeSubscription } from "@/design-system/theme/ThemeProvider";

export function DailyCard({
  daily,
  loading,
  partnerName,
}: {
  daily: QuizSession | null | undefined;
  loading: boolean;
  partnerName: string;
}) {
  useThemeSubscription();
  if (loading) return <Skeleton height={200} radius="lg" />;
  if (!daily) return null;
  const q = daily.questions[0];
  const state = daily.readyAt ? (daily.revealSeenAt ? "seen" : "ready") : daily.myCompletedAt ? "waiting" : "yours";
  const action =
    state === "yours"
      ? "Answer today's question"
      : state === "waiting"
        ? "View your question"
        : state === "ready"
          ? "Reveal your answers"
          : "Read your answers";
  return (
    <PressableScale
      accessibilityLabel={`Today's question: ${q ? withPartner(q.promptSelf, partnerName) : ""}. ${action}`}
      onPress={() => router.push(`/quiz/${daily.id}`)}
      style={{
        backgroundColor: palette.paper,
        borderRadius: radius.lg,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: palette.line,
        padding: layout.cardPadding,
        gap: space[4],
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space[3] }}>
        <Text variant="label" color="action">
          One question, just for today
        </Text>
        <CategoryCreature category="daily" size={40} />
      </View>
      <Text variant="display-m">{q ? withPartner(q.promptSelf, partnerName) : "Something new to discover."}</Text>
      <Text variant="body-sm" color="ink-secondary">
        {state === "yours"
          ? "Answer separately. Discover together."
          : state === "waiting"
            ? `Your answer is saved. ${partnerName} can reply in their own time.`
            : state === "ready"
              ? "You've both answered. A little discovery is waiting."
              : "A small part of your story, saved together."}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space[3], minHeight: layout.minTouch }}>
        <Text variant="body-sm-strong" color="action" style={{ flex: 1 }}>
          {action}
        </Text>
        <ArrowRight size={20} color={palette.action} />
      </View>
    </PressableScale>
  );
}
