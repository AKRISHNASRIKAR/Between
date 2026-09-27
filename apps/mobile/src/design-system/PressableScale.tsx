import type { ReactNode } from "react";
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { scale, spring } from "./motion";
import { opacity } from "./tokens";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type PressableScaleProps = Omit<PressableProps, "style" | "children"> & {
  style?: StyleProp<ViewStyle>;
  className?: string;
  children?: ReactNode;
  /** Visual scale when pressed (DESIGN §7.1). */
  pressedScale?: number;
};

/** Base for everything tappable: springs to 0.97 on press, dims when disabled. */
export function PressableScale({
  pressedScale = scale.press,
  disabled,
  style,
  onPressIn,
  onPressOut,
  children,
  ...rest
}: PressableScaleProps) {
  const s = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPressIn={(e) => {
        s.value = withSpring(pressedScale, spring.snappy);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        s.value = withSpring(1, spring.snappy);
        onPressOut?.(e);
      }}
      style={[animated, disabled ? { opacity: opacity.disabled } : null, style]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
