import type { QuizSession } from "@lovenotes/contracts";
import { router } from "expo-router";
import { View } from "react-native";
import { Avatar, Button, Check, LockSimple, layout, palette, radius, space, Text } from "@/design-system";
import { useThemeSubscription } from "@/design-system/theme/ThemeProvider";

/** No polling animation or partner progress meter: completion is theirs to do in their own time. */
export function QuizWaiting({ session, partnerName }: { session: QuizSession; partnerName: string }) {
  useThemeSubscription();
  return (
    <View style={{ gap: space[6] }}>
      <View style={{ gap: space[2] }}>
        <Text variant="label" color="action">
          {session.pack?.title ?? "Today's question"}
        </Text>
        <Text variant="display-l" accessibilityRole="header">
          Your part is done.
        </Text>
        <Text variant="body" color="ink-secondary">
          A little more to discover, whenever you're both ready.
        </Text>
      </View>
      <View
        style={{
          backgroundColor: palette.paper,
          borderWidth: 1,
          borderColor: palette.line,
          borderRadius: radius.lg,
          borderCurve: "continuous",
          padding: layout.cardPadding,
          gap: space[5],
        }}
      >
        <View style={{ flexDirection: "row", gap: space[3], alignItems: "center" }}>
          <View
            style={{
              width: space[10],
              height: space[10],
              borderRadius: radius.pill,
              backgroundColor: palette["action-soft"],
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Check size={20} color={palette.action} weight="bold" />
          </View>
          <View style={{ flex: 1, gap: space[1] }}>
            <Text variant="body-sm-strong">Your answers are saved</Text>
            <Text variant="caption" color="ink-secondary">
              {session.questions.length} {session.questions.length === 1 ? "question" : "questions"} · sent privately
            </Text>
          </View>
        </View>
        <View style={{ height: 1, backgroundColor: palette.line }} />
        <View style={{ flexDirection: "row", gap: space[3], alignItems: "center" }}>
          <Avatar size={40} name={partnerName} who="partner" />
          <View style={{ flex: 1, gap: space[1] }}>
            <Text variant="body-sm-strong">{partnerName}'s turn</Text>
            <Text variant="caption" color="ink-secondary">
              They can take their time.
            </Text>
          </View>
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: space[3], alignItems: "flex-start" }}>
        <LockSimple size={20} color={palette["ink-secondary"]} />
        <Text variant="body-sm" color="ink-secondary" style={{ flex: 1 }}>
          Both sets stay hidden until you've both sent your answers. Your shared result will appear here when it's
          ready.
        </Text>
      </View>
      <Button fullWidth label="Back to our day" onPress={() => router.replace("/today")} />
    </View>
  );
}
