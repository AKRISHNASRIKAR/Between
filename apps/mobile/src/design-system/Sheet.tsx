import { type ReactNode, useEffect, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { dur, spring } from "./motion";
import { lift, palette, radius, scrim } from "./tokens";

type Props = { open: boolean; onClose: () => void; children: ReactNode; accessibilityLabel: string };

/** Bottom sheet (DESIGN §7.2): grabber, drag-to-dismiss, keyboard-aware, max 90% height. */
export function Sheet({ open, onClose, children, accessibilityLabel }: Props) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(open);
  const y = useSharedValue(height);
  const fade = useSharedValue(0);

  useEffect(() => {
    if (open) {
      setMounted(true);
      y.value = withSpring(0, spring.gentle);
      fade.value = withTiming(1, { duration: dur.base });
    } else if (mounted) {
      fade.value = withTiming(0, { duration: dur.fast });
      y.value = withTiming(height, { duration: dur.base }, (done) => {
        if (done) runOnJS(setMounted)(false);
      });
    }
  }, [open, mounted, height, y, fade]);

  const drag = Gesture.Pan()
    .onChange((e) => {
      y.value = Math.max(0, y.value + e.changeY);
    })
    .onEnd((e) => {
      if (y.value > 120 || e.velocityY > 800) runOnJS(onClose)();
      else y.value = withSpring(0, spring.gentle);
    });

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const scrimStyle = useAnimatedStyle(() => ({ opacity: fade.value }));

  if (!mounted) return null;
  return (
    <Modal transparent visible statusBarTranslucent onRequestClose={onClose} animationType="none">
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View style={[{ position: "absolute", inset: 0, backgroundColor: scrim }, scrimStyle]}>
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
                paddingBottom: Math.max(insets.bottom, 16),
                width: "100%",
                maxWidth: 600,
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
              contentContainerStyle={{ paddingHorizontal: 20 }}
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
