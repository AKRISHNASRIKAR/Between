import { type QuizSession, withPartner } from "@lovenotes/contracts";
import { router } from "expo-router";
import { View } from "react-native";
import { Button, CategoryCreature, Dots, lift, PressableScale, palette, radius, Skeleton, Text } from "@/design-system";

/** DESIGN §7.3 QuestionOfTheDay: your turn · waiting · reveal ready · revealed. */
export function DailyCard({
  daily,
  loading,
  partnerName,
}: {
  daily: QuizSession | null | undefined;
  loading: boolean;
  partnerName: string;
}) {
  if (loading) return <Skeleton height={150} radius="lg" />;
  if (!daily) return null;
  const q = daily.questions[0];
  const state = daily.readyAt ? (daily.revealSeenAt ? "seen" : "ready") : daily.myCompletedAt ? "waiting" : "yours";
  const open = () => router.push(`/quiz/${daily.id}`);
  return (
    <PressableScale
      accessibilityLabel={`Today's question: ${q ? withPartner(q.promptSelf, partnerName) : ""}`}
      onPress={open}
      style={{
        backgroundColor: palette["purple-soft"],
        borderRadius: radius.lg,
        padding: 20,
        gap: 12,
        marginTop: 20,
        ...lift[1],
      }}
    >
      <View style={{ position: "absolute", top: -26, right: 16 }}>
        <CategoryCreature category="daily" size={56} />
      </View>
      <Text variant="label" color="purple-deep">
        Today's question
      </Text>
      <Text variant="display-m">{q ? withPartner(q.promptSelf, partnerName) : ""}</Text>
      {state === "yours" ? (
        <Text variant="body-sm" color="ink-secondary">
          Your turn — answers stay hidden until you've both replied.
        </Text>
      ) : state === "waiting" ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Dots color="purple-deep" />
          <Text variant="body-sm" color="ink-secondary">
            Waiting for {partnerName}
          </Text>
        </View>
      ) : state === "ready" ? (
        <View>
          <Button variant="accent" family="purple" label="Reveal ✦" onPress={open} />
        </View>
      ) : (
        <Text variant="body-sm" color="ink-secondary">
          Revealed · tap to see your answers
        </Text>
      )}
    </PressableScale>
  );
}
