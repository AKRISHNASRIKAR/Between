import { View } from "react-native";
import { useThemeSubscription } from "@/design-system/theme/ThemeProvider";
import { haptics } from "./haptics";
import { PressableScale } from "./PressableScale";
import { Text } from "./Text";
import { recipes } from "./theme/recipes";
import { lift, radius } from "./tokens";

/** DESIGN §7.2 Segmented control: sunken track, paper thumb. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
}) {
  useThemeSubscription();
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: "row",
        backgroundColor: recipes.segmented(false).track,
        borderRadius: radius.pill,
        padding: 4,
      }}
    >
      {options.map((o) => {
        const on = o.value === value;
        const look = recipes.segmented(on);
        return (
          <PressableScale
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={o.label}
            onPress={() => {
              if (!on) haptics.tick();
              onChange(o.value);
            }}
            style={{
              flex: 1,
              height: 40,
              borderRadius: look.radius,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: look.thumb,
              ...(on ? lift[1] : null),
            }}
          >
            <Text variant="button" color={look.fg}>
              {o.label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}
