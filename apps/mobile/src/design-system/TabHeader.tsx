import type { ComponentType } from "react";
import { View } from "react-native";
import type { IconProps } from "./Icon";
import { PressableScale } from "./PressableScale";
import { Text } from "./Text";
import { recipes } from "./theme/recipes";
import type { Family } from "./tokens";

type Props = {
  title: string;
  /** One quiet line under the title, only when it adds something. */
  subtitle?: string;
  /** The tab's one main action, as a round pillar-coloured button. */
  action?: { label: string; icon: ComponentType<IconProps>; family: Family; onPress: () => void };
};

/**
 * The header every tab shares (DESIGN §7.2): a short title on one line and at most one round
 * action. No eyebrow — the tab bar already says where you are.
 */
export function TabHeader({ title, subtitle, action }: Props) {
  const look = action ? recipes.actionButton(action.family) : null;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 48 }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="display-m" accessibilityRole="header" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="body-sm" color="ink-tertiary" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {action && look ? (
        <PressableScale
          accessibilityLabel={action.label}
          onPress={action.onPress}
          hitSlop={6}
          style={{
            width: look.size,
            height: look.size,
            borderRadius: look.radius,
            backgroundColor: look.bg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <action.icon size={22} color={look.fg} weight="bold" />
        </PressableScale>
      ) : null}
    </View>
  );
}
