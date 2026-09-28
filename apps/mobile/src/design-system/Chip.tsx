import { View } from "react-native";
import { haptics } from "./haptics";
import { Check } from "./Icon";
import { PressableScale } from "./PressableScale";
import { Text } from "./Text";
import { type Family, family as fam, palette, radius } from "./tokens";

type Props = { label: string; selected?: boolean; family?: Family; onPress?: () => void; disabled?: boolean };

/** DESIGN §7.2 Chip: quiet until chosen. Selection = tint + deep text + check, never colour alone. */
export function Chip({ label, selected, family = "teal", onPress, disabled }: Props) {
  const f = fam(family);
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
        height: 34,
        paddingHorizontal: 14,
        borderRadius: radius.pill,
        backgroundColor: selected ? f.soft : "transparent",
        justifyContent: "center",
      }}
    >
      <View className="flex-row items-center gap-1">
        {selected ? <Check size={14} color={f.deep} weight="bold" /> : null}
        <Text variant="body-sm-strong" style={{ color: selected ? f.deep : palette["ink-tertiary"] }}>
          {label}
        </Text>
      </View>
    </PressableScale>
  );
}
