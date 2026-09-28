import { View } from "react-native";
import { Check, haptics, PressableScale, palette, radius, stroke, Text } from "@/design-system";

/** A quiz option: paper row, 56 high, teal ring when selected (DESIGN §7.3 QuizCard). */
export function OptionRow({
  label,
  glyph,
  selected,
  onPress,
  leading,
}: {
  label: string;
  glyph?: string;
  selected?: boolean;
  onPress: () => void;
  leading?: React.ReactNode;
}) {
  return (
    <PressableScale
      accessibilityRole="radio"
      accessibilityState={{ selected: !!selected }}
      accessibilityLabel={label}
      onPress={() => {
        haptics.tick();
        onPress();
      }}
      style={{
        minHeight: 56,
        borderRadius: radius.md,
        backgroundColor: palette.paper,
        borderWidth: 2,
        borderColor: selected ? palette["teal-base"] : "transparent",
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
          borderColor: selected ? palette["teal-base"] : palette["line-strong"],
          backgroundColor: selected ? palette["teal-base"] : "transparent",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {selected ? <Check size={13} color={palette["on-ink"]} weight="bold" /> : null}
      </View>
    </PressableScale>
  );
}
