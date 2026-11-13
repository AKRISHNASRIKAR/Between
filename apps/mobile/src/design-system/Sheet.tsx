import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeSubscription } from "@/design-system/theme/ThemeProvider";
import { useReducedMotion } from "@/lib/preferences";
import { dur, spring } from "./motion";
import { layout, lift, palette, radius, space } from "./tokens";

type Props = { open: boolean; onClose: () => void; children: ReactNode; accessibilityLabel: string };

/** Bottom sheet (DESIGN §7.2): grabber, drag-to-dismiss, keyboard-aware, max 90% height. */
export function Sheet({ open, onClose, children, accessibilityLabel }: Props) {
  useThemeSubscription();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(open);
  const reduced = useReducedMotion();
  const openRef = useRef(open);
  openRef.current = open;
  const y = useSharedValue(height);
  const fade = useSharedValue(0);

  const finishClose = useCallback(() => {
    if (!openRef.current) setMounted(false);
  }, []);

  useEffect(() => {
    if (open) {
      setMounted(true);
      y.value = reduced ? 0 : withSpring(0, spring.gentle);
      fade.value = withTiming(1, { duration: reduced ? 0 : dur.base });
    } else {
      fade.value = withTiming(0, { duration: reduced ? 0 : dur.fast });
      y.value = withTiming(height, { duration: reduced ? 0 : dur.base }, (done) => {
        if (done) runOnJS(finishClose)();
      });
    }
    return () => {
      cancelAnimation(y);
      cancelAnimation(fade);
    };
  }, [open, height, reduced, y, fade, finishClose]);

  const drag = Gesture.Pan()
    .onChange((e) => {
      y.value = Math.max(0, y.value + e.changeY);
    })
    .onEnd((e) => {
      if (y.value > 120 || e.velocityY > 800) runOnJS(onClose)();
      else y.value = reduced ? 0 : withSpring(0, spring.gentle);
    })
    .onFinalize((_event, success) => {
      if (!success) y.value = reduced ? 0 : withSpring(0, spring.gentle);
    });

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const scrimStyle = useAnimatedStyle(() => ({ opacity: fade.value }));

  if (!mounted) return null;
  return (
    <Modal transparent visible statusBarTranslucent onRequestClose={onClose} animationType="none">
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View style={[{ position: "absolute", inset: 0, backgroundColor: palette.scrim }, scrimStyle]}>
          <Pressable accessibilityLabel="Close" style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1, justifyContent: "flex-end" }}
          pointerEvents="box-none"
        >
          <Animated.View
            accessibilityViewIsModal
            accessibilityLabel={accessibilityLabel}
            style={[
              {
                maxHeight: height * 0.9,
                backgroundColor: palette.paper,
                borderTopLeftRadius: radius.lg,
                borderTopRightRadius: radius.lg,
                paddingBottom: Math.max(insets.bottom, space[4]),
                width: "100%",
                maxWidth: layout.maxContentWidth + layout.gutter * 2,
                alignSelf: "center",
                ...lift[2],
              },
              sheetStyle,
            ]}
          >
            <GestureDetector gesture={drag}>
              <View className="items-center py-3">
                <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: palette["line-strong"] }} />
              </View>
            </GestureDetector>
            <ScrollView
              style={{ flexGrow: 0 }}
              contentContainerStyle={{ paddingHorizontal: layout.gutter }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}
