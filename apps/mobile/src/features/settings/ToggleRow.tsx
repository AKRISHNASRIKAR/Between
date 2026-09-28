import { Switch, View } from "react-native";
import { palette, Text } from "@/design-system";

/** Settings row with a switch; colors from tokens (DESIGN §2). */
export function ToggleRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, minHeight: 56 }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="body">{label}</Text>
        {hint ? (
          <Text variant="caption" color="ink-tertiary">
            {hint}
          </Text>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ false: palette["line-strong"], true: palette["green-base"] }}
        thumbColor={palette.paper}
        ios_backgroundColor={palette["line-strong"]}
      />
    </View>
  );
}
