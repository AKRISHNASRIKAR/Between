import { useEffect } from "react";
import { type DimensionValue, View } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { palette, radius as radii } from "./tokens";

type Props = { width?: DimensionValue; height: number; radius?: keyof typeof radii };

/** Layout-matched placeholder with a paper shimmer (static under Reduce Motion). */
export function Skeleton({ width = "100%", height, radius = "md" }: Props) {
  const reduced = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    t.value = withRepeat(withTiming(1, { duration: 1200 }), -1);
    return () => cancelAnimation(t);
  }, [reduced, t]);
  const band = useAnimatedStyle(() => ({ transform: [{ translateX: `${-100 + t.value * 200}%` }] }));
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width, height, borderRadius: radii[radius], backgroundColor: palette.sunken, overflow: "hidden" }}
    >
      {reduced ? null : (
        <Animated.View style={[{ width: "60%", height: "100%", backgroundColor: palette.paper, opacity: 0.6 }, band]} />
      )}
    </View>
  );
}
