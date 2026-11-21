import { Switch, View } from "react-native";
import { palette, Text } from "@/design-system";
import { useThemeSubscription } from "@/design-system/theme/ThemeProvider";

/** Settings row with a switch; colors from tokens (DESIGN §2). */
export function ToggleRow({
  label,
  hint,
  value,
  onChange,
  leading,
}: {
  leading?: React.ReactNode;
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  useThemeSubscription();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, minHeight: 56 }}>
      {leading}
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="body-sm-strong">{label}</Text>
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
