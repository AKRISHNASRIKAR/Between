import { type Pet as PetT, petLine } from "@lovenotes/contracts";
import { useCallback, useEffect, useRef, useState } from "react";
import { useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  Ball,
  Bowl,
  BowlFood,
  dur,
  HandHeart,
  haptics,
  layout,
  Pet,
  type PetReaction,
  PressableScale,
  palette,
  radius,
  spring,
  stroke,
  TennisBall,
  Text,
  useToast,
} from "@/design-system";
import { useWaitingNotes } from "@/features/notes/NoteWaiting";
import { partnerOf, useMe, usePetInteract } from "@/features/space/hooks";
import { useRealtime } from "@/features/space/realtime-sync";
import { humanError } from "@/lib/errors";

type Props = { size: number; onPressPet?: () => void; compact?: boolean };

const dayOfYear = () => Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000);

/** The pet on its rug, with speech bubble and the three interactions (DESIGN §7.3 PetCard). */
export function PetStage({ size: requested, onPressPet, compact }: Props) {
  // Never wider than the screen: the stage is 1.5× the pet to leave room for props.
  const { width } = useWindowDimensions();
  const stageWidth = Math.min(requested * 1.5, width - layout.gutter * 2);
  const size = Math.min(requested, stageWidth / 1.2);
  const me = useMe();
  const space = me.data?.space;
  const pet = space?.pet as PetT;
  const myId = me.data?.profile.id;
  const partner = partnerOf(space, myId);
  const { online, lastInteraction } = useRealtime();
  const interact = usePetInteract(space?.id);
  const waiting = useWaitingNotes();
  const toast = useToast();

  const [reaction, setReaction] = useState<PetReaction | null>(null);
  const [stroking, setStroking] = useState(false);
  const [prop, setProp] = useState<"bowl" | "ball" | null>(null);
  const [partnerAction, setPartnerAction] = useState<"feed" | "pet" | "play" | null>(null);
  const counter = useRef(0);

  const bowlX = useSharedValue(-120);
  const ballX = useSharedValue(-140);
  const ballY = useSharedValue(0);

  const react = useCallback((kind: PetReaction["kind"]) => {
    counter.current += 1;
    setReaction({ kind, n: counter.current });
  }, []);

  const propTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(propTimer.current), []);

  const playProp = useCallback(
    (kind: "feed" | "play") => {
      clearTimeout(propTimer.current);
      // Props leave the stage once their little scene is over.
      propTimer.current = setTimeout(() => setProp(null), kind === "feed" ? 2000 : 1000);
      if (kind === "feed") {
        setProp("bowl");
        bowlX.value = withSequence(
          withSpring(0, spring.gentle),
          withDelay(1300, withTiming(-160, { duration: dur.base })),
        );
      } else {
        setProp("ball");
        ballX.value = -size * 0.7;
        ballX.value = withTiming(size * 0.7, { duration: 900 });
        ballY.value = withSequence(withTiming(-size * 0.35, { duration: 450 }), withTiming(0, { duration: 450 }));
      }
    },
    [size, bowlX, ballX, ballY],
  );

  // Partner interactions arrive in realtime → the pet reacts here too.
  useEffect(() => {
    if (!lastInteraction || lastInteraction.userId === myId) return;
    react(lastInteraction.kind === "pet" ? "pet" : lastInteraction.kind);
    if (lastInteraction.kind !== "pet") playProp(lastInteraction.kind);
    setPartnerAction(lastInteraction.kind);
    const t = setTimeout(() => setPartnerAction(null), 6000);
    return () => clearTimeout(t);
  }, [lastInteraction, myId, react, playProp]);

  const doInteract = (kind: "feed" | "pet" | "play") => {
    haptics.tap();
    react(kind);
    if (kind !== "pet") playProp(kind);
    interact.mutate(kind, {
      onSuccess: () => (kind === "feed" ? haptics.yay() : undefined),
      onError: (e) => toast({ kind: "error", message: humanError(e) }),
    });
  };

  // Stroke gesture: ticks while stroking, one "pet" interaction per stroke.
  const lastTick = useRef(0);
  const tick = () => {
    const now = Date.now();
    if (now - lastTick.current > 120) {
      lastTick.current = now;
      haptics.tick();
    }
  };
  const pan = Gesture.Pan()
    .runOnJS(true)
    .minDistance(8)
    .onStart(() => setStroking(true))
    .onChange(tick)
    .onEnd(() => doInteract("pet"))
    .onFinalize(() => setStroking(false));
  const tap = Gesture.Tap()
    .runOnJS(true)
    .onEnd(() => (onPressPet ? onPressPet() : react("hello")));
  const gesture = Gesture.Exclusive(pan, tap);

  const bowlStyle = useAnimatedStyle(() => ({ transform: [{ translateX: bowlX.value }] }));
  const ballStyle = useAnimatedStyle(() => ({ transform: [{ translateX: ballX.value }, { translateY: ballY.value }] }));

  if (!pet) return null;
  const line = petLine({
    mood: pet.mood,
    localHour: new Date().getHours(),
    partnerName: partner?.displayName ?? null,
    partnerOnline: !!partner && online.includes(partner.id),
    partnerAction,
    noteWaiting: waiting.length > 0,
    seed: dayOfYear(),
  });

  return (
    <View className="items-center" style={{ gap: compact ? 12 : 20 }}>
      {/* Speech bubble: tail is a sibling centered under the bubble (no % offsets). */}
      <Animated.View
        key={line}
        entering={FadeIn.duration(dur.base)}
        style={{ alignItems: "center" }}
        accessibilityLiveRegion="polite"
      >
        <View
          style={{
            backgroundColor: palette.paper,
            borderRadius: radius.md,
            borderWidth: stroke.regular,
            borderColor: palette.ink,
            paddingHorizontal: 14,
            paddingVertical: 8,
            maxWidth: 280,
            zIndex: 1,
          }}
        >
          <Text variant="body-sm" align="center">
            {line}
          </Text>
        </View>
        <View
          style={{
            marginTop: -7,
            width: 12,
            height: 12,
            backgroundColor: palette.paper,
            borderRightWidth: stroke.regular,
            borderBottomWidth: stroke.regular,
            borderColor: palette.ink,
            transform: [{ rotate: "45deg" }],
            zIndex: 2,
          }}
        />
      </Animated.View>

      {/* The pet art's top ~30% is headroom for hops; pull it up under the bubble. */}
      <View
        style={{
          width: stageWidth,
          height: size,
          marginTop: -size * 0.3,
          alignItems: "center",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            position: "absolute",
            bottom: size * 0.1,
            width: size * 1.1,
            height: size * 0.16,
            borderRadius: size,
            backgroundColor: palette["orange-soft"],
          }}
        />
        <GestureDetector gesture={gesture}>
          <View
            accessible
            accessibilityRole="button"
            accessibilityLabel={`${pet.name ?? "Your pet"}, feeling ${pet.mood}`}
            accessibilityHint={onPressPet ? "Opens the pet's room. Swipe across to pet." : "Swipe across to pet."}
          >
            <Pet stage={pet.stage} mood={pet.mood} size={size} reaction={reaction} stroking={stroking} />
          </View>
        </GestureDetector>
        {prop === "bowl" ? (
          <Animated.View style={[{ position: "absolute", bottom: size * 0.1, left: size * 0.12 }, bowlStyle]}>
            <Bowl size={size * 0.32} />
          </Animated.View>
        ) : null}
        {prop === "ball" ? (
          <Animated.View style={[{ position: "absolute", bottom: size * 0.14, left: size * 0.66 }, ballStyle]}>
            <Ball size={size * 0.18} />
          </Animated.View>
        ) : null}
      </View>

      <View className="flex-row gap-4">
        <PetAction
          label="Feed"
          onPress={() => doInteract("feed")}
          icon={<BowlFood size={22} color={palette["orange-deep"]} weight="bold" />}
        />
        <PetAction
          label="Pet"
          onPress={() => doInteract("pet")}
          icon={<HandHeart size={22} color={palette["orange-deep"]} weight="bold" />}
        />
        <PetAction
          label="Play"
          onPress={() => doInteract("play")}
          icon={<TennisBall size={22} color={palette["orange-deep"]} weight="bold" />}
        />
      </View>
    </View>
  );
}

function PetAction({ label, icon, onPress }: { label: string; icon: React.ReactNode; onPress: () => void }) {
  return (
    <View className="items-center gap-1">
      <PressableScale
        accessibilityLabel={label}
        onPress={onPress}
        style={{
          width: 52,
          height: 52,
          borderRadius: radius.pill,
          backgroundColor: palette["orange-soft"],
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </PressableScale>
      <Text variant="caption" color="ink-secondary">
        {label}
      </Text>
    </View>
  );
}
