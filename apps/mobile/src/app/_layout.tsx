import "../../global.css";
import { Caveat_500Medium, Caveat_600SemiBold } from "@expo-google-fonts/caveat";
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold } from "@expo-google-fonts/dm-sans";
import {
  Fraunces_400Regular_Italic,
  Fraunces_500Medium,
  Fraunces_600SemiBold,
  useFonts,
} from "@expo-google-fonts/fraunces";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import * as Linking from "expo-linking";
import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DevFab } from "@/components/DevFab";
import { palette, ToastProvider } from "@/design-system";
import { NoticeHost } from "@/features/notices/NoticeHost";
import { type FlowState, flowState, restorablePath } from "@/features/space/flow";
import { FlowContext } from "@/features/space/flow-context";
import { useMe } from "@/features/space/hooks";
import { RealtimeProvider } from "@/features/space/realtime-sync";
import { authClient } from "@/lib/auth";
import { useNotificationRouting } from "@/lib/push";
import { CACHE_BUSTER, persister, queryClient } from "@/lib/query";

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigator() {
  const session = authClient.useSession();
  const hasSession = !!session.data;
  const me = useMe(hasSession);
  // Only the very first resolve may show "loading" — background session refetches must never
  // unmount the navigator (that would throw the user back to the anchor screen).
  const computed = flowState(hasSession, session.isPending, me.data);
  const last = useRef<FlowState>("loading");
  if (computed !== "loading") last.current = computed;
  const state = computed === "loading" ? last.current : computed;

  useEffect(() => {
    if (state !== "loading") SplashScreen.hideAsync().catch(() => {});
  }, [state]);

  // Cold-start deep links arrive before the guards know who the user is; restore them once ready.
  const pendingPath = useRef<string | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const restore = useCallback(() => {
    const path = pendingPath.current;
    if (stateRef.current !== "ready" || !path) return;
    pendingPath.current = null;
    router.replace(path as never);
  }, []);

  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      const parsed = url ? Linking.parse(url).path : null;
      pendingPath.current = restorablePath(parsed ? `/${parsed}` : null);
      restore();
    });
  }, [restore]);
  useEffect(() => {
    if (state === "ready") restore();
  }, [state, restore]);

  // Push: register once set up, and let taps on notifications open the right screen.
  useNotificationRouting(state === "ready");

  if (state === "loading") return null;

  return (
    <FlowContext.Provider value={state}>
      <RealtimeProvider active={state === "waiting" || state === "naming" || state === "ready"}>
        <Stack
          screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.canvas }, animation: "fade" }}
        >
          <Stack.Screen name="index" />
          <Stack.Protected guard={state === "signed-out"}>
            <Stack.Screen name="welcome" />
            <Stack.Screen name="sign-in" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="verify" options={{ animation: "slide_from_right" }} />
          </Stack.Protected>
          <Stack.Protected guard={state === "needs-name"}>
            <Stack.Screen name="your-name" />
          </Stack.Protected>
          <Stack.Protected guard={state === "no-space"}>
            <Stack.Screen name="start" />
            <Stack.Screen name="create" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="join" options={{ animation: "slide_from_right" }} />
          </Stack.Protected>
          <Stack.Protected guard={state === "waiting"}>
            <Stack.Screen name="waiting" />
          </Stack.Protected>
          <Stack.Protected guard={state === "naming"}>
            <Stack.Screen name="hatch" />
          </Stack.Protected>
          <Stack.Protected guard={state === "ready"}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="pet" options={{ animation: "slide_from_bottom" }} />
            <Stack.Screen name="settings" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="vibes" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="notes/new" options={{ animation: "slide_from_bottom" }} />
            <Stack.Screen name="notes/[id]" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="quiz/[id]" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="daily" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="journal/new" options={{ animation: "slide_from_bottom" }} />
            <Stack.Screen name="journal/[id]" options={{ animation: "slide_from_right" }} />
          </Stack.Protected>
          <Stack.Screen name="invite/[code]" />
          <Stack.Screen name="dev/gallery" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="dev/partner" options={{ animation: "slide_from_right" }} />
        </Stack>
        {state === "ready" ? <NoticeHost /> : null}
        {state === "waiting" || state === "naming" || state === "ready" ? <DevFab /> : null}
      </RealtimeProvider>
    </FlowContext.Provider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_500Medium,
    Fraunces_400Regular_Italic,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    Caveat_500Medium,
    Caveat_600SemiBold,
  });
  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: palette.canvas }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider client={queryClient} persistOptions={{ persister, buster: CACHE_BUSTER }}>
          <ToastProvider>
            <StatusBar style="dark" />
            <RootNavigator />
          </ToastProvider>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
