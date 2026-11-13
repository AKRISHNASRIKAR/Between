import { View } from "react-native";
import { useThemeSubscription } from "@/design-system/theme/ThemeProvider";
import { haptics } from "./haptics";
import { Check } from "./Icon";
import { PressableScale } from "./PressableScale";
import { Text } from "./Text";
import { recipes } from "./theme/recipes";
import type { Family } from "./tokens";

type Props = { label: string; selected?: boolean; family?: Family; onPress?: () => void; disabled?: boolean };

/** DESIGN §7.2 Chip: quiet until chosen. Selection = tint + deep text + check, never colour alone. */
export function Chip({ label, selected, family = "teal", onPress, disabled }: Props) {
  useThemeSubscription();
  const look = recipes.chip(!!selected, family);
  return (
    <PressableScale
      onPress={() => {
        haptics.tick();
        onPress?.();
      }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      accessibilityLabel={label}
      style={{
        height: look.height,
        paddingHorizontal: look.paddingHorizontal,
        borderRadius: look.radius,
        backgroundColor: look.bg,
        justifyContent: "center",
      }}
    >
      <View className="flex-row items-center gap-1">
        {selected ? <Check size={14} color={look.fg} weight="bold" /> : null}
        <Text variant="body-sm-strong" style={{ color: look.fg }}>
          {label}
        </Text>
      </View>
    </PressableScale>
  );
}
