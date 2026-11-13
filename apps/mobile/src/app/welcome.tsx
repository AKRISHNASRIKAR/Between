import { router } from "expo-router";
import { useRef, useState } from "react";
import { useWindowDimensions, View } from "react-native";
import { Button, layout, palette, Screen, space, Text } from "@/design-system";
import { WelcomeKeepsake } from "@/design-system/objects/WelcomeKeepsake";
import { useThemeSubscription } from "@/design-system/theme/ThemeProvider";
import { PREVIEW_SLIDES, ProductPreview } from "@/features/onboarding/ProductPreview";
import { previewPreference } from "@/features/onboarding/preview-preference";
import { onboardingIntent } from "@/features/space/onboarding-intent";

export default function Welcome() {
  useThemeSubscription();
  const { width } = useWindowDimensions();
  const [step, setStep] = useState(() => (previewPreference.completed() ? PREVIEW_SLIDES.length : 0));
  const navigating = useRef(false);
  const [busy, setBusy] = useState<"create" | "join" | "sign-in" | null>(null);
  const slide = PREVIEW_SLIDES[step];
  const finish = () => {
    previewPreference.finish();
    setStep(PREVIEW_SLIDES.length);
  };
  const proceed = async (intent: "create" | "join") => {
    if (navigating.current) return;
    navigating.current = true;
    setBusy(intent);
    previewPreference.finish();
    try {
      await onboardingIntent.set(intent);
      router.push("/sign-in");
    } finally {
      navigating.current = false;
      setBusy(null);
    }
  };
  const signIn = async () => {
    if (navigating.current) return;
    navigating.current = true;
    setBusy("sign-in");
    previewPreference.finish();
    try {
      await onboardingIntent.take();
      router.push("/sign-in");
    } finally {
      navigating.current = false;
      setBusy(null);
    }
  };
  return (
    <Screen
      footer={
        <>
          {slide ? (
            <Button
              fullWidth
              label={step === PREVIEW_SLIDES.length - 1 ? "Make it yours" : "Next"}
              onPress={() => (step === PREVIEW_SLIDES.length - 1 ? finish() : setStep((value) => value + 1))}
            />
          ) : (
            <>
              <Button
                fullWidth
                label="Create our space"
                disabled={!!busy}
                loading={busy === "create"}
                onPress={() => void proceed("create")}
              />
              <Button
                fullWidth
                variant="secondary"
                label="Join your partner"
                disabled={!!busy}
                loading={busy === "join"}
                onPress={() => void proceed("join")}
              />
            </>
          )}
          <Button
            fullWidth
            variant="quiet"
            label="Already have an account? Sign in"
            disabled={!!busy}
            loading={busy === "sign-in"}
            onPress={() => void signIn()}
          />
          {__DEV__ ? (
            <Button
              fullWidth
              variant="quiet"
              size="md"
              label="Test with a mock couple"
              onPress={() => router.push("/dev/testing")}
            />
          ) : null}
        </>
      }
    >
      <View style={{ flex: 1, gap: space[6], paddingVertical: space[4] }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: space[4] }}>
          <Text variant="display-m" color="action">
            between
          </Text>
          {slide ? (
            <Button variant="quiet" size="md" label="Skip preview" onPress={finish} />
          ) : (
            <Button variant="quiet" size="md" label="Explore Between" onPress={() => setStep(0)} />
          )}
        </View>
        {slide ? (
          <>
            <View
              style={{ flexDirection: "row", gap: space[2] }}
              accessibilityLabel={`Preview ${step + 1} of ${PREVIEW_SLIDES.length}`}
            >
              {PREVIEW_SLIDES.map((item, i) => (
                <View
                  key={item.label}
                  style={{
                    flex: 1,
                    height: space[1],
                    backgroundColor: i === step ? palette.action : palette.sunken,
                    borderRadius: space[1],
                  }}
                />
              ))}
            </View>
            <View style={{ gap: space[3] }}>
              <Text variant="label" color="action">
                {slide.label}
              </Text>
              <Text variant="display-l" accessibilityRole="header">
                {slide.headline}
              </Text>
              <Text variant="body" color="ink-secondary">
                {slide.body}
              </Text>
            </View>
            <View style={{ flex: 1, justifyContent: "center", gap: space[3] }}>
              <ProductPreview key={step} step={step} />
              <Text variant="caption" color="ink-secondary" align="center">
                Demo · sample content, just for exploring
              </Text>
            </View>
          </>
        ) : (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: space[6] }}>
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <WelcomeKeepsake width={Math.min(width - layout.gutter * 2, 280)} />
            </View>
            <View style={{ gap: space[3], width: "100%" }}>
              <Text variant="display-l" align="center" accessibilityRole="header">
                Your story,{"\n"}just for two.
              </Text>
              <Text variant="body" color="ink-secondary" align="center">
                Leave notes, discover each other, and keep your shared memories.
              </Text>
            </View>
          </View>
        )}
      </View>
    </Screen>
  );
}
