import { View } from "react-native";
import { Check, haptics, PressableScale, palette, radius, stroke, Text } from "@/design-system";
import { useThemeSubscription } from "@/design-system/theme/ThemeProvider";

/** A quiz option: paper row with a theme-colored selected ring. */
export function OptionRow({
  label,
  glyph,
  selected,
  disabled,
  onPress,
  leading,
}: {
  label: string;
  glyph?: string;
  selected?: boolean;
  disabled?: boolean;
  onPress: () => void;
  leading?: React.ReactNode;
}) {
  useThemeSubscription();
  return (
    <PressableScale
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ checked: !!selected, selected: !!selected, disabled: !!disabled }}
      accessibilityLabel={label}
      onPress={() => {
        haptics.tick();
        onPress();
      }}
      style={{
        minHeight: 56,
        borderRadius: radius.md,
        borderCurve: "continuous",
        backgroundColor: selected ? palette["action-soft"] : palette.paper,
        borderWidth: 2,
        borderColor: selected ? palette.action : palette.line,
        paddingHorizontal: 16,
        paddingVertical: 10,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      {leading}
      {glyph ? <Text variant="heading">{glyph}</Text> : null}
      <Text variant="body" style={{ flex: 1 }}>
        {label}
      </Text>
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: stroke.regular,
          borderColor: selected ? palette.action : palette["line-strong"],
          backgroundColor: selected ? palette.action : "transparent",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {selected ? <Check size={13} color={palette["on-action"]} weight="bold" /> : null}
      </View>
    </PressableScale>
  );
}
