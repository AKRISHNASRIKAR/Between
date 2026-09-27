import { View } from "react-native";
import { haptics } from "./haptics";
import { PressableScale } from "./PressableScale";
import { Text } from "./Text";
import { lift, palette, radius } from "./tokens";

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
  return (
    <View
      accessibilityRole="tablist"
      style={{ flexDirection: "row", backgroundColor: palette.sunken, borderRadius: radius.pill, padding: 4 }}
    >
      {options.map((o) => {
        const on = o.value === value;
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
              borderRadius: radius.pill,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: on ? palette.paper : "transparent",
              ...(on ? lift[1] : null),
            }}
          >
            <Text variant="button" color={on ? "ink" : "ink-tertiary"}>
              {o.label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}
