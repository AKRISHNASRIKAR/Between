import type { ReactNode } from "react";
import { StyleSheet, type ViewStyle } from "react-native";
import Animated from "react-native-reanimated";
import { Svg } from "react-native-svg";

/**
 * One animatable part of the pet: a full-size SVG layer inside an Animated.View, so each part
 * can rotate/scale around its own pivot using plain transforms (fast, works on every platform).
 */
export function Layer({
  size,
  pivot,
  style,
  children,
}: {
  size: number;
  pivot?: { x: number; y: number };
  style?: ViewStyle | ReturnType<typeof Object>;
  children: ReactNode;
}) {
  const k = size / 200;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        pivot ? { transformOrigin: [pivot.x * k, pivot.y * k, 0] } : null,
        style as ViewStyle,
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 200 200">
        {children}
      </Svg>
    </Animated.View>
  );
}
