import { type Ref, useEffect, useImperativeHandle, useRef } from "react";
import { View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Circle, Path } from "react-native-svg";
import { haptics } from "../../haptics";
import { dur, ease, spring } from "../../motion";
import { type ColorToken, palette } from "../../tokens";
import { SoftShape } from "../soft";
import { Layer } from "./Layer";
import { PET } from "./paths";

export type EggHandle = { hatch: (onDone: () => void) => void };

function Speckles() {
  return (
    <>
      {PET.egg.speckles.map((s) => (
        <Circle key={`${s.x}-${s.y}`} cx={s.x} cy={s.y} r={s.r} fill={palette[s.c as ColorToken]} />
      ))}
    </>
  );
}

/** Egg shell piece: a smooth butter-cream shell with its shade crescent and speckles. */
function Shell({ d, id }: { d: string; id: string }) {
  return (
    <>
      <SoftShape id={id} d={d} fill={palette["butter-soft"]} lift={7} gloss={{ cx: 82, cy: 78, rx: 12, ry: 6 }} />
      <Speckles />
    </>
  );
}

/**
 * The egg: wobbles every 4–7s. `hatch()` plays the sequence (DESIGN §9): shake, the crack
 * appears (the whole shell swaps for two halves), then the halves split apart.
 */
export function Egg({ size, ref }: { size: number; ref?: Ref<EggHandle> }) {
  const reduced = useReducedMotion();
  const wobble = useSharedValue(0);
  const crack = useSharedValue(0);
  const split = useSharedValue(0);
  const hatching = useRef(false);

  useEffect(() => {
    let alive = true;
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      t = setTimeout(
        () => {
          if (!alive || hatching.current) return;
          if (!reduced) {
            wobble.value = withSequence(
              withTiming(-6, { duration: 140 }),
              withTiming(5, { duration: 140 }),
              withTiming(-3, { duration: 120 }),
              withSpring(0, spring.gentle),
            );
          }
          loop();
        },
        4000 + Math.random() * 3000,
      );
    };
    loop();
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [reduced, wobble]);

  useImperativeHandle(ref, () => ({
    hatch(onDone) {
      hatching.current = true;
      haptics.tap();
      const shake = [-8, 8, -8, 8, -5, 0].map((x) => withTiming(x, { duration: 90 }));
      wobble.value = reduced ? 0 : withSequence(...shake, withDelay(200, withSequence(...shake)));
      crack.value = withDelay(reduced ? 0 : 900, withTiming(1, { duration: dur.fast }));
      split.value = withDelay(
        reduced ? 200 : 1500,
        withTiming(1, { duration: dur.slow, easing: ease.out }, (finished) => {
          if (finished) runOnJS(onDone)();
        }),
      );
    },
  }));

  const k = size / 200;
  const whole = useAnimatedStyle(() => ({
    transformOrigin: [PET.egg.pivot.x * k, PET.egg.pivot.y * k, 0],
    transform: [{ rotate: `${wobble.value}deg` }],
  }));
  const intact = useAnimatedStyle(() => ({ opacity: 1 - crack.value }));
  const top = useAnimatedStyle(() => ({
    opacity: crack.value * (1 - split.value),
    transform: [
      { translateY: -split.value * 60 * k },
      { translateX: -split.value * 20 * k },
      { rotate: `${-split.value * 25}deg` },
    ],
  }));
  const bottom = useAnimatedStyle(() => ({
    opacity: crack.value * (1 - split.value),
    transform: [{ translateY: split.value * 30 * k }],
  }));

  return (
    <View style={{ width: size, height: size }} accessibilityLabel="An egg, waiting to hatch">
      <Animated.View style={[{ width: size, height: size }, whole]}>
        <Layer size={size} style={intact}>
          <Shell id="egg-whole" d={PET.egg.whole} />
        </Layer>
        <Layer size={size} style={bottom}>
          <Shell id="egg-bottom" d={PET.egg.bottom} />
        </Layer>
        <Layer size={size} style={top}>
          <Shell id="egg-top" d={PET.egg.top} />
        </Layer>
      </Animated.View>
    </View>
  );
}
