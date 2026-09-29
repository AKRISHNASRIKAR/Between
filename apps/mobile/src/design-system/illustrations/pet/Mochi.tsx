import type { PetMood } from "@lovenotes/contracts";
import { useEffect } from "react";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Circle, Ellipse, G, Path } from "react-native-svg";
import { dur, ease, spring } from "../../motion";
import { palette } from "../../tokens";
import { SoftShape, shadeOf } from "../soft";
import { Layer } from "./Layer";
import { PET } from "./paths";

export type PetReaction = { kind: "pet" | "feed" | "play" | "hello"; n: number };

type Props = { mood: PetMood; size: number; reaction?: PetReaction | null; stroking?: boolean };

const ink = palette.ink;
const coat = palette["butter-base"];
const ears = palette["orange-base"];
const randBetween = (a: number, b: number) => a + Math.random() * (b - a);

export function Mochi({ mood, size, reaction, stroking }: Props) {
  const reduced = useReducedMotion();
  const breathe = useSharedValue(1);
  const hop = useSharedValue(0);
  const squash = useSharedValue(1);
  const blink = useSharedValue(1);
  const earL = useSharedValue(0);
  const earR = useSharedValue(0);
  const tail = useSharedValue(0);
  const happyEyes = useSharedValue(0);

  // Idle breathing — slower when sleepy.
  useEffect(() => {
    const period = mood === "sleepy" ? 3000 : 2400;
    const amp = mood === "sleepy" ? 1.02 : 1.03;
    breathe.value = withRepeat(
      withSequence(
        withTiming(amp, { duration: period / 2, easing: ease.out }),
        withTiming(1, { duration: period / 2, easing: ease.in }),
      ),
      -1,
    );
    return () => cancelAnimation(breathe);
  }, [mood, breathe]);

  // Blinks every 3–6s (kept under Reduce Motion — subtle). Not while sleeping.
  useEffect(() => {
    if (mood === "sleepy") return;
    let alive = true;
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      t = setTimeout(
        () => {
          if (!alive) return;
          blink.value = withSequence(withTiming(0.1, { duration: 70 }), withTiming(1, { duration: 110 }));
          loop();
        },
        randBetween(3000, 6000),
      );
    };
    loop();
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [mood, blink]);

  // Mood idles: tail wag speed, ear bounce, excited hops.
  useEffect(() => {
    const wag = mood === "excited" ? 160 : mood === "happy" ? 320 : 900;
    tail.value =
      mood === "sleepy"
        ? withTiming(0)
        : withRepeat(withSequence(withTiming(14, { duration: wag }), withTiming(-6, { duration: wag })), -1, true);
    if (reduced) return;
    let alive = true;
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      t = setTimeout(
        () => {
          if (!alive) return;
          if (mood === "excited") {
            hop.value = withSequence(withSpring(-10, spring.bouncy), withSpring(0, spring.bouncy));
          } else if (mood === "happy" || mood === "peckish") {
            earL.value = withSequence(withTiming(-8, { duration: dur.fast }), withSpring(0, spring.bouncy));
            earR.value = withSequence(withTiming(8, { duration: dur.fast }), withSpring(0, spring.bouncy));
          }
          loop();
        },
        mood === "excited" ? randBetween(1200, 2200) : randBetween(3500, 6000),
      );
    };
    if (mood !== "sleepy" && mood !== "content") loop();
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [mood, reduced, tail, hop, earL, earR]);

  // Stroking: eyes squint happily, ears flatten.
  useEffect(() => {
    happyEyes.value = withTiming(stroking ? 1 : 0, { duration: dur.fast });
    earL.value = withSpring(stroking ? 16 : 0, spring.gentle);
    earR.value = withSpring(stroking ? -16 : 0, spring.gentle);
  }, [stroking, happyEyes, earL, earR]);

  // One-shot reactions.
  useEffect(() => {
    if (!reaction) return;
    switch (reaction.kind) {
      case "feed":
        squash.value = withSequence(
          ...[0, 1, 2].flatMap(() => [withTiming(0.94, { duration: 110 }), withTiming(1.02, { duration: 110 })]),
          withSpring(1, spring.bouncy),
        );
        happyEyes.value = withSequence(
          withTiming(1, { duration: dur.fast }),
          withDelay(700, withTiming(0, { duration: dur.base })),
        );
        break;
      case "play":
        hop.value = reduced
          ? withSequence(withTiming(-4), withTiming(0))
          : withSequence(
              withSpring(-22, spring.bouncy),
              withSpring(0, spring.bouncy),
              withDelay(80, withSpring(-14, spring.bouncy)),
              withSpring(0, spring.bouncy),
            );
        break;
      case "pet":
      case "hello":
        happyEyes.value = withSequence(
          withTiming(1, { duration: dur.fast }),
          withDelay(900, withTiming(0, { duration: dur.base })),
        );
        earL.value = withSequence(withTiming(14, { duration: dur.fast }), withDelay(600, withSpring(0, spring.gentle)));
        earR.value = withSequence(
          withTiming(-14, { duration: dur.fast }),
          withDelay(600, withSpring(0, spring.gentle)),
        );
        break;
    }
  }, [reaction, squash, happyEyes, hop, earL, earR, reduced]);

  const k = size / 200;
  const whole = useAnimatedStyle(() => ({
    transformOrigin: [100 * k, 170 * k, 0],
    transform: [{ translateY: hop.value * k }, { scaleY: breathe.value * squash.value }, { scaleX: 2 - squash.value }],
  }));
  const earLStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${earL.value}deg` }] }));
  const earRStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${earR.value}deg` }] }));
  const tailStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${tail.value}deg` }] }));
  const eyesOpen = useAnimatedStyle(() => ({
    opacity: 1 - happyEyes.value,
    transformOrigin: [100 * k, PET.eyeL.y * k, 0],
    transform: [{ scaleY: blink.value }],
  }));
  const eyesHappy = useAnimatedStyle(() => ({ opacity: happyEyes.value }));

  const sleepy = mood === "sleepy";
  const mouth = PET.mouth[mood];

  return (
    <Animated.View style={[{ width: size, height: size }, whole]}>
      <Layer size={size} pivot={PET.tailPivot} style={tailStyle}>
        <Path d={PET.tail} stroke={shadeOf(coat)} strokeWidth={8} fill="none" strokeLinecap="round" />
      </Layer>
      <Layer size={size}>
        <Path d={PET.footL} fill={shadeOf(coat)} />
        <Path d={PET.footR} fill={shadeOf(coat)} />
        <SoftShape id="mochi-body" d={PET.body} fill={coat} lift={7} gloss={{ cx: 70, cy: 88, rx: 16, ry: 7 }} />
        <Ellipse cx={PET.cheekL.x} cy={PET.cheekL.y} rx={8.5} ry={5.5} fill={palette["pink-base"]} opacity={0.6} />
        <Ellipse cx={PET.cheekR.x} cy={PET.cheekR.y} rx={8.5} ry={5.5} fill={palette["pink-base"]} opacity={0.6} />
        <Path d={PET.nose} fill={ink} />
        <Path
          d={mouth}
          stroke={ink}
          strokeWidth={3.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={mood === "excited" ? ink : "none"}
        />
        {mood === "peckish" ? <Path d={PET.tongue} fill={palette["pink-base"]} /> : null}
      </Layer>
      <Layer size={size} pivot={PET.earLPivot} style={earLStyle}>
        <SoftShape id="mochi-ear-l" d={PET.earL} fill={ears} lift={5} />
      </Layer>
      <Layer size={size} pivot={PET.earRPivot} style={earRStyle}>
        <SoftShape id="mochi-ear-r" d={PET.earR} fill={ears} lift={5} />
      </Layer>
      {sleepy ? (
        <Layer size={size}>
          <G stroke={ink} strokeWidth={3.4} fill="none" strokeLinecap="round">
            <Path
              d={`M ${PET.eyeL.x - 6} ${PET.eyeL.y} Q ${PET.eyeL.x} ${PET.eyeL.y + 5} ${PET.eyeL.x + 6} ${PET.eyeL.y}`}
            />
            <Path
              d={`M ${PET.eyeR.x - 6} ${PET.eyeR.y} Q ${PET.eyeR.x} ${PET.eyeR.y + 5} ${PET.eyeR.x + 6} ${PET.eyeR.y}`}
            />
          </G>
        </Layer>
      ) : (
        <>
          <Layer size={size} style={eyesOpen}>
            <Ellipse cx={PET.eyeL.x} cy={PET.eyeL.y} rx={6} ry={7.5} fill={ink} />
            <Ellipse cx={PET.eyeR.x} cy={PET.eyeR.y} rx={6} ry={7.5} fill={ink} />
            <Circle cx={PET.eyeL.x + 2} cy={PET.eyeL.y - 2.6} r={2.2} fill={palette.paper} />
            <Circle cx={PET.eyeR.x + 2} cy={PET.eyeR.y - 2.6} r={2.2} fill={palette.paper} />
          </Layer>
          <Layer size={size} style={eyesHappy}>
            <G stroke={ink} strokeWidth={3.4} fill="none" strokeLinecap="round">
              <Path
                d={`M ${PET.eyeL.x - 6} ${PET.eyeL.y + 2} Q ${PET.eyeL.x} ${PET.eyeL.y - 5} ${PET.eyeL.x + 6} ${PET.eyeL.y + 2}`}
              />
              <Path
                d={`M ${PET.eyeR.x - 6} ${PET.eyeR.y + 2} Q ${PET.eyeR.x} ${PET.eyeR.y - 5} ${PET.eyeR.x + 6} ${PET.eyeR.y + 2}`}
              />
            </G>
          </Layer>
        </>
      )}
      {sleepy && !reduced ? <Zzz size={size} /> : null}
    </Animated.View>
  );
}

function Zzz({ size }: { size: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 2600, easing: ease.out }), -1);
    return () => cancelAnimation(t);
  }, [t]);
  const k = size / 200;
  const style = useAnimatedStyle(() => ({
    opacity: t.value < 0.15 ? t.value / 0.15 : 1 - (t.value - 0.15) / 0.85,
    transform: [{ translateY: -t.value * 30 * k }, { translateX: t.value * 10 * k }],
  }));
  return (
    <Layer size={size} style={style}>
      <Path
        d="M 150 60 L 162 60 L 150 72 L 162 72"
        stroke={palette["ink-tertiary"]}
        strokeWidth={3.2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Layer>
  );
}
