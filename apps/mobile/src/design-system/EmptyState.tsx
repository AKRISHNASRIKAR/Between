import type { ReactNode } from "react";
import { View } from "react-native";
import { Button } from "./Button";
import { Text } from "./Text";

type Props = { illustration: ReactNode; title: string; body: string; action?: { label: string; onPress: () => void } };

/** Warm, specific empty states (DESIGN §7.2). Never "No data". */
export function EmptyState({ illustration, title, body, action }: Props) {
  return (
    <View className="items-center gap-4 py-10">
      {illustration}
      <View className="items-center gap-2">
        <Text variant="display-m" align="center">
          {title}
        </Text>
        <Text variant="body" color="ink-secondary" align="center" style={{ maxWidth: 320 }}>
          {body}
        </Text>
      </View>
      {action ? <Button variant="secondary" size="md" label={action.label} onPress={action.onPress} /> : null}
    </View>
  );
}
