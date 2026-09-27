import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { dur, ease } from "./motion";
import { type ColorToken, palette } from "./tokens";

function Dot({ index, color }: { index: number; color: ColorToken }) {
  const y = useSharedValue(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return;
    y.value = withDelay(
      index * 120,
      withRepeat(
        withSequence(
          withTiming(-4, { duration: dur.base, easing: ease.out }),
          withTiming(0, { duration: dur.base, easing: ease.in }),
        ),
        -1,
      ),
    );
  }, [index, reduced, y]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={[{ width: 6, height: 6, borderRadius: 3, backgroundColor: palette[color] }, style]} />;
}

/** Loading indicator (DESIGN §7.1): three bouncing dots. */
export function Dots({ color = "ink" }: { color?: ColorToken }) {
  return (
    <View accessibilityLabel="Loading" accessibilityRole="progressbar" className="flex-row items-center gap-1">
      {[0, 1, 2].map((i) => (
        <Dot key={i} index={i} color={color} />
      ))}
    </View>
  );
}
