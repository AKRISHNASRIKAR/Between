import { type NoticePillar, noticeCopy, type ServerEvent } from "@lovenotes/contracts";
import { router, usePathname } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  FadeOutUp,
  runOnJS,
  SlideInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { haptics, layout, NoticeCard, spring } from "@/design-system";
import { useMe } from "@/features/space/hooks";
import { onForegroundPush } from "@/lib/push";
import { realtime } from "@/lib/realtime";

type Item = { id: number; title: string; body: string; url: string; pillar: NoticePillar };

const SHOW_MS = 5000;
const DISMISS_DISTANCE = -24;

/**
 * Shows notices while the app is open (DESIGN §7.4): live `notice` events for me, and any push
 * that lands in the foreground. One at a time; swipe up to dismiss, tap to open.
 */
export function NoticeHost() {
  const me = useMe();
  const myId = me.data?.profile.id;
  const pet = me.data?.space?.pet;
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const [queue, setQueue] = useState<Item[]>([]);
  const current = queue[0];
  const pathRef = useRef(pathname);
  pathRef.current = pathname;

  const enqueue = useCallback((n: Omit<Item, "id">) => {
    // Already looking at it: the screen updates live, no need to announce it.
    if (pathRef.current === n.url) return;
    setQueue((q) => (q.length >= 3 ? q : [...q, { ...n, id: Date.now() + Math.random() }]));
  }, []);
  const dismiss = useCallback(() => setQueue((q) => q.slice(1)), []);

  useEffect(() => {
    if (!myId) return;
    const offLive = realtime.subscribe((e: ServerEvent) => {
      if (e.t !== "notice" || e.to !== myId) return;
      const c = noticeCopy(e.notice, e.petName);
      enqueue({ title: c.title, body: c.body, url: c.url, pillar: c.pillar });
    });
    const offPush = onForegroundPush(enqueue);
    return () => {
      offLive();
      offPush();
    };
  }, [myId, enqueue]);

  // Arrival: a light tick, then auto-dismiss.
  useEffect(() => {
    if (!current) return;
    haptics.tick();
    const t = setTimeout(dismiss, SHOW_MS);
    return () => clearTimeout(t);
  }, [current, dismiss]);

  const open = useCallback(
    (url: string) => {
      haptics.tap();
      dismiss();
      if (url.startsWith("/")) router.push(url as never);
    },
    [dismiss],
  );

  const dy = useSharedValue(0);
  const gesture = useMemo(() => {
    const pan = Gesture.Pan()
      .activeOffsetY([-8, 8])
      .onUpdate((e) => {
        dy.value = Math.min(0, e.translationY);
      })
      .onEnd((e) => {
        if (e.translationY < DISMISS_DISTANCE) runOnJS(dismiss)();
        else dy.value = withSpring(0, spring.snappy);
      });
    const tap = Gesture.Tap().onEnd(() => {
      if (current) runOnJS(open)(current.url);
    });
    return Gesture.Race(pan, tap);
  }, [dy, dismiss, open, current]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset the drag when a new notice arrives
  useEffect(() => {
    dy.value = 0;
  }, [current?.id]);
  const follow = useAnimatedStyle(() => ({ transform: [{ translateY: dy.value }] }));

  if (!current) return null;
  return (
    <View
      pointerEvents="box-none"
      style={{ position: "absolute", top: insets.top + 8, left: 0, right: 0, alignItems: "center" }}
    >
      <GestureDetector gesture={gesture}>
        <Animated.View
          key={current.id}
          entering={SlideInUp.springify().damping(spring.gentle.damping)}
          exiting={FadeOutUp.duration(180)}
          accessible
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          accessibilityLabel={`${current.title}. ${current.body}`}
          accessibilityHint="Double-tap to open"
          accessibilityActions={[{ name: "activate" }, { name: "escape", label: "Dismiss" }]}
          onAccessibilityAction={(e) => (e.nativeEvent.actionName === "escape" ? dismiss() : open(current.url))}
          style={[{ marginHorizontal: layout.gutter, maxWidth: layout.maxContentWidth, alignSelf: "stretch" }, follow]}
        >
          <NoticeCard
            title={current.title}
            body={current.body}
            pillar={current.pillar}
            pet={{ stage: pet?.stage ?? "baby", mood: pet?.mood ?? "happy" }}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
