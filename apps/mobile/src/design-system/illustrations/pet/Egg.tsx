import { type Ref, useEffect, useImperativeHandle, useRef } from "react";
import { View } from "react-native";
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Circle } from "react-native-svg";
import { useReducedMotion } from "@/lib/preferences";
import { haptics } from "../../haptics";
import { dur, ease, spring } from "../../motion";
import { art, type ColorToken } from "../../tokens";
import { SoftShape } from "../soft";
import { Layer } from "./Layer";
import { PET } from "./paths";

export type EggHandle = { hatch: (onDone: () => void) => void };

function Speckles() {
  return (
    <>
      {PET.egg.speckles.map((s) => (
        <Circle key={`${s.x}-${s.y}`} cx={s.x} cy={s.y} r={s.r} fill={art[s.c as ColorToken]} />
      ))}
    </>
  );
}

/** Egg shell piece: a smooth butter-cream shell with its shade crescent and speckles. */
function Shell({ d, id }: { d: string; id: string }) {
  return (
    <>
      <SoftShape id={id} d={d} fill={art["butter-soft"]} lift={7} gloss={{ cx: 82, cy: 78, rx: 12, ry: 6 }} />
      <Speckles />
    </>
  );
}

/**
 * The egg: wobbles every 4–7s. `hatch()` plays the sequence (DESIGN §9): shake, the crack
 * appears (the whole shell swaps for two halves), then the halves split apart.
 */
export function Egg({ size, ref, active = true }: { size: number; ref?: Ref<EggHandle>; active?: boolean }) {
  const reduced = useReducedMotion();
  const wobble = useSharedValue(0);
  const crack = useSharedValue(0);
  const split = useSharedValue(0);
  const hatching = useRef(false);

  useEffect(() => {
    if (!active || reduced) {
      wobble.value = 0;
      return;
    }
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
      cancelAnimation(wobble);
    };
  }, [reduced, wobble, active]);

  useEffect(
    () => () => {
      cancelAnimation(wobble);
      cancelAnimation(crack);
      cancelAnimation(split);
    },
    [wobble, crack, split],
  );

  useImperativeHandle(ref, () => ({
    hatch(onDone) {
      if (hatching.current) return;
      hatching.current = true;
      haptics.tap();
      if (reduced) {
        wobble.value = 0;
        crack.value = 1;
        split.value = 1;
        onDone();
        return;
      }
      const shake = [-8, 8, -8, 8, -5, 0].map((x) => withTiming(x, { duration: 90 }));
      wobble.value = withSequence(...shake, withDelay(200, withSequence(...shake)));
      crack.value = withDelay(900, withTiming(1, { duration: dur.fast }));
      split.value = withDelay(
        1500,
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
