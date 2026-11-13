import "../../global.css";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useFonts } from "expo-font";
import * as Linking from "expo-linking";
import { router, Stack, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ReducedMotionConfig, ReduceMotion } from "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DevFab } from "@/components/DevFab";
import { Button, palette, Screen, Text, THEMES, ThemeProvider, ToastProvider } from "@/design-system";
import { fontAssets } from "@/design-system/font-assets";
import { useThemeSubscription } from "@/design-system/theme/ThemeProvider";
import { NoticeHost } from "@/features/notices/NoticeHost";
import { useSignOut } from "@/features/settings/hooks";
import { type FlowState, flowState, restorablePath } from "@/features/space/flow";
import { FlowContext } from "@/features/space/flow-context";
import { useMe } from "@/features/space/hooks";
import { RealtimeProvider } from "@/features/space/realtime-sync";
import { useWidgetSync } from "@/features/widgets/useWidgetSync";
import { trackWidget } from "@/lib/analytics";
import { authClient } from "@/lib/auth";
import { usePreferences } from "@/lib/preferences";
import { useNotificationRouting } from "@/lib/push";
import { persister, queryClient } from "@/lib/query";
import { cacheBuster, shouldPersistQuery } from "@/lib/query-cache-policy";

SplashScreen.preventAutoHideAsync().catch(() => {});

/** The screen on show, kept across a theme change (which remounts the navigator). */
let lastPath: string | null = null;

function RootNavigator() {
  useThemeSubscription();
  const personal = usePreferences();
  const session = authClient.useSession();
  const hasSession = !!session.data;
  const me = useMe(hasSession);
  const signingOut = useSignOut();
  const profileFailed = hasSession && me.isError && !me.data;
  // Only the very first resolve may show "loading" — background session refetches must never
  // unmount the navigator (that would throw the user back to the anchor screen).
  const computed = flowState(hasSession, session.isPending, me.data);
  const last = useRef<FlowState>("loading");
  if (computed !== "loading") last.current = computed;
  const state = computed === "loading" ? last.current : computed;

  useEffect(() => {
    if (state !== "loading" || profileFailed) SplashScreen.hideAsync().catch(() => {});
  }, [state, profileFailed]);

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
    const observe = (url: string | null) => {
      if (!url || Linking.parse(url).queryParams?.source !== "widget") return;
      trackWidget("widget_opened");
      trackWidget("widget_deep_link");
    };
    const subscription = Linking.addEventListener("url", ({ url }) => observe(url));
    Linking.getInitialURL().then(observe);
    return () => subscription.remove();
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

  // After a theme change the navigator remounts; put the person back where they were.
  const pathname = usePathname();
  const restoredOnce = useRef(false);
  useEffect(() => {
    if (state !== "ready") return;
    if (!restoredOnce.current) {
      restoredOnce.current = true;
      if (lastPath && lastPath !== pathname) {
        router.replace(lastPath as never);
        return;
      }
    }
    lastPath = pathname;
  }, [state, pathname]);

  // Push: register once set up, and let taps on notifications open the right screen.
  useNotificationRouting(state === "ready");
  // Home-screen widgets mirror the space (and are wiped on sign-out).
  useWidgetSync(state, me.data?.space?.id);

  if (profileFailed) {
    return (
      <Screen>
        <View style={{ flex: 1, justifyContent: "center", gap: 16 }}>
          <Text variant="heading" align="center">
            Couldn't load your space
          </Text>
          <Text variant="body" color="ink-secondary" align="center">
            Check your connection and try again.
          </Text>
          <Button label="Try again" loading={me.isFetching} onPress={() => me.refetch()} />
          <Button label="Sign out" variant="quiet" loading={signingOut.isPending} onPress={() => signingOut.mutate()} />
        </View>
      </Screen>
    );
  }
  if (state === "loading") return null;

  return (
    <FlowContext.Provider value={state}>
      <ReducedMotionConfig mode={personal.reducedMotion ? ReduceMotion.Always : ReduceMotion.System} />
      <RealtimeProvider
        active={state === "waiting" || state === "pet-choice" || state === "naming" || state === "ready"}
      >
        <Stack
          screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.canvas }, animation: "fade" }}
        >
          <Stack.Screen name="index" />
          <Stack.Protected guard={["no-space", "waiting", "pet-choice", "naming", "ready"].includes(state)}>
            <Stack.Screen name="closed-spaces" options={{ animation: "slide_from_right" }} />
          </Stack.Protected>
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
          <Stack.Protected guard={state === "pet-choice" || state === "ready"}>
            <Stack.Screen name="pet-choice" />
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
          <Stack.Screen name="dev/onboarding" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="dev/testing" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="dev/quizzes" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="dev/gallery" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="dev/partner" options={{ animation: "slide_from_right" }} />
        </Stack>
        {state === "ready" ? <NoticeHost /> : null}
        {state === "waiting" || state === "pet-choice" || state === "naming" || state === "ready" ? <DevFab /> : null}
      </RealtimeProvider>
    </FlowContext.Provider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const session = authClient.useSession();
  if (!fontsLoaded && !fontError) return null;
  // Resolve the cache owner before hydration so a previous account's disk cache is rejected.
  if (session.isPending && !session.data) return null;

  return (
    <ThemeProvider>
      {(theme) => (
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: palette.canvas }}>
          <SafeAreaProvider>
            <PersistQueryClientProvider
              client={queryClient}
              persistOptions={{
                persister,
                buster: cacheBuster(session.data?.user.id),
                dehydrateOptions: {
                  shouldDehydrateQuery: shouldPersistQuery,
                },
              }}
            >
              {/* Theme consumers subscribe without remounting navigation or drafts. */}
              <ToastProvider>
                <StatusBar style={THEMES[theme].mode === "dark" ? "light" : "dark"} />
                <RootNavigator />
              </ToastProvider>
            </PersistQueryClientProvider>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      )}
    </ThemeProvider>
  );
}
