import type { ReactNode } from "react";
import { View } from "react-native";
import { EmptyState, Screen, Text } from "@/design-system";

/** Temporary tab body for pillars still being built (replaced milestone by milestone). */
export function UpcomingTab({
  eyebrow,
  title,
  illustration,
  body,
}: {
  eyebrow: string;
  title: string;
  illustration: ReactNode;
  body: string;
}) {
  return (
    <Screen bottomInset={false}>
      <View className="gap-2 pt-4">
        <Text variant="label" color="ink-tertiary">
          {eyebrow}
        </Text>
        <Text variant="display-l" accessibilityRole="header">
          {title}
        </Text>
      </View>
      <View className="flex-1 justify-center">
        <EmptyState illustration={illustration} title="Almost ready" body={body} />
      </View>
    </Screen>
  );
}
