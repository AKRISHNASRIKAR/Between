import { type ReactNode, useEffect } from "react";
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useReducedMotion } from "@/lib/preferences";
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
  const reduced = useReducedMotion();
  const s = useSharedValue(1);
  useEffect(() => {
    if (disabled) {
      cancelAnimation(s);
      s.value = 1;
    }
    return () => cancelAnimation(s);
  }, [disabled, s]);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPressIn={(e) => {
        s.value = reduced ? 1 : withSpring(pressedScale, spring.snappy);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        s.value = reduced ? 1 : withSpring(1, spring.snappy);
        onPressOut?.(e);
      }}
      style={[animated, disabled ? { opacity: opacity.disabled } : null, style]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
