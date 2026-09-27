import { useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { type ColorToken, palette } from "../tokens";

type Piece = {
  x: number;
  drift: number;
  rot: number;
  delay: number;
  color: ColorToken;
  shape: "circle" | "square" | "tri";
};
const COLORS: ColorToken[] = ["butter-base", "sky-base", "pink-base", "orange-base", "green-base"];

function ConfettiPiece({ p, height }: { p: Piece; height: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(p.delay, withTiming(1, { duration: 1600, easing: Easing.out(Easing.quad) }));
  }, [p.delay, t]);
  const style = useAnimatedStyle(() => ({
    opacity: t.value < 0.8 ? 1 : (1 - t.value) / 0.2,
    transform: [
      { translateX: p.drift * t.value },
      { translateY: -40 + t.value * height * 0.7 },
      { rotate: `${p.rot * t.value}deg` },
    ],
  }));
  const size = 9;
  const shapeStyle =
    p.shape === "circle"
      ? { width: size, height: size, borderRadius: size / 2, backgroundColor: palette[p.color] }
      : p.shape === "square"
        ? { width: size, height: size, backgroundColor: palette[p.color] }
        : {
            width: 0,
            height: 0,
            borderLeftWidth: size / 2,
            borderRightWidth: size / 2,
            borderBottomWidth: size,
            borderLeftColor: "transparent",
            borderRightColor: "transparent",
            borderBottomColor: palette[p.color],
          };
  return <Animated.View style={[{ position: "absolute", left: `${p.x}%`, top: 0 }, shapeStyle, style]} />;
}

/** Geometric celebration burst (DESIGN §8). Renders nothing under Reduce Motion. */
export function Confetti({ burst, height = 500 }: { burst: number; height?: number }) {
  const reduced = useReducedMotion();
  const pieces = useMemo<Piece[]>(
    () =>
      burst
        ? Array.from({ length: 36 }, (_, i) => ({
            x: 5 + Math.random() * 90,
            drift: (Math.random() - 0.5) * 120,
            rot: (Math.random() - 0.5) * 720,
            delay: Math.random() * 250,
            color: COLORS[i % COLORS.length] as ColorToken,
            shape: (["circle", "square", "tri"] as const)[i % 3] ?? "circle",
          }))
        : [],
    [burst],
  );
  if (reduced || !burst) return null;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: "hidden" }]}>
      {pieces.map((p, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: pieces are regenerated wholesale per burst and never reorder
        <ConfettiPiece key={`${burst}-${i}`} p={p} height={height} />
      ))}
    </View>
  );
}
