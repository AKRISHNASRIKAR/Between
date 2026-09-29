import { type QuizSession, withPartner } from "@lovenotes/contracts";
import { router } from "expo-router";
import { View } from "react-native";
import { Button, CategoryCreature, Dots, PressableScale, quizColors, radius, Skeleton, Text } from "@/design-system";

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
  // A fixed paint-chip swatch (DESIGN §2.6): its words use the swatch's own text colour in every theme.
  const ink = quizColors("daily").text;
  return (
    <PressableScale
      accessibilityLabel={`Today's question: ${q ? withPartner(q.promptSelf, partnerName) : ""}`}
      onPress={open}
      style={{
        backgroundColor: quizColors("daily").fill,
        borderRadius: radius.lg,
        padding: 20,
        gap: 12,
        marginTop: 20,
      }}
    >
      <View style={{ position: "absolute", top: -26, right: 16 }}>
        <CategoryCreature category="daily" size={56} onBase />
      </View>
      <Text variant="label" style={{ color: ink }}>
        Today's question
      </Text>
      <Text variant="display-m" style={{ color: ink }}>
        {q ? withPartner(q.promptSelf, partnerName) : ""}
      </Text>
      {state === "yours" ? (
        <Text variant="body-sm" style={{ color: ink }}>
          Your turn — answers stay hidden until you've both replied.
        </Text>
      ) : state === "waiting" ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Dots tint={ink} />
          <Text variant="body-sm" style={{ color: ink }}>
            Waiting for {partnerName}
          </Text>
        </View>
      ) : state === "ready" ? (
        <View>
          <Button label="Reveal ✦" onPress={open} />
        </View>
      ) : (
        <Text variant="body-sm" style={{ color: ink }}>
          Revealed · tap to see your answers
        </Text>
      )}
    </PressableScale>
  );
}
