import { createContext, type ReactNode, useCallback, useContext, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { FadeInUp, FadeOutUp, runOnJS } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "./Button";
import { haptics } from "./haptics";
import { Check, WarningCircle } from "./Icon";
import { Text } from "./Text";
import { layout, palette, radius } from "./tokens";

type ToastInput = {
  message: string;
  kind?: "info" | "success" | "error";
  action?: { label: string; onPress: () => void };
};
type ToastItem = ToastInput & { id: number };

const ToastCtx = createContext<(t: ToastInput) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

/** Top toasts (DESIGN §7.2): ink fill, 3s auto-dismiss, swipe up to dismiss. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const insets = useSafeAreaInsets();
  const dismiss = useCallback(() => setToast(null), []);

  const show = useCallback((t: ToastInput) => {
    clearTimeout(timer.current);
    if (t.kind === "success") haptics.yay();
    setToast({ ...t, id: Date.now() });
    timer.current = setTimeout(() => setToast(null), t.action ? 5000 : 3000);
  }, []);

  const swipe = useMemo(
    () =>
      Gesture.Pan().onEnd((e) => {
        if (e.translationY < -10) runOnJS(dismiss)();
      }),
    [dismiss],
  );

  return (
    <ToastCtx.Provider value={show}>
      {children}
      {toast ? (
        <View
          pointerEvents="box-none"
          style={{ position: "absolute", top: insets.top + 8, left: 0, right: 0, alignItems: "center" }}
        >
          <GestureDetector gesture={swipe}>
            <Animated.View
              key={toast.id}
              entering={FadeInUp.springify().damping(18)}
              exiting={FadeOutUp.duration(180)}
              accessibilityLiveRegion="polite"
              accessibilityRole="alert"
              style={{
                marginHorizontal: layout.gutter,
                maxWidth: layout.maxContentWidth,
                alignSelf: "stretch",
                backgroundColor: palette.ink,
                borderRadius: radius.md,
                paddingHorizontal: 16,
                paddingVertical: 12,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              {toast.kind === "success" ? <Check size={18} color={palette["green-base"]} weight="bold" /> : null}
              {toast.kind === "error" ? <WarningCircle size={18} color={palette["coral-base"]} weight="bold" /> : null}
              <Text variant="body-sm" color="on-ink" style={{ flex: 1 }}>
                {toast.message}
              </Text>
              {toast.action ? (
                <View>
                  <Button
                    variant="quiet"
                    label={toast.action.label}
                    onPress={() => {
                      toast.action?.onPress();
                      dismiss();
                    }}
                  />
                </View>
              ) : null}
            </Animated.View>
          </GestureDetector>
        </View>
      ) : null}
    </ToastCtx.Provider>
  );
}
