import { Redirect, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { BackButton } from "@/components/BackButton";
import { Button, Screen, space, Text } from "@/design-system";
import { PREVIEW_SLIDES, ProductPreview } from "@/features/onboarding/ProductPreview";

export default function OnboardingPlayground() {
  const params = useLocalSearchParams<{ step?: string }>();
  const initial = Number(params.step);
  const [step, setStep] = useState(
    Number.isInteger(initial) && initial >= 0 && initial < PREVIEW_SLIDES.length ? initial : 0,
  );
  useEffect(() => {
    const value = Number(params.step);
    setStep(Number.isInteger(value) && value >= 0 && value < PREVIEW_SLIDES.length ? value : 0);
  }, [params.step]);
  if (!__DEV__) return <Redirect href="/" />;
  const slide = PREVIEW_SLIDES[step];
  if (!slide) return null;
  return (
    <Screen
      footer={
        <Button
          fullWidth
          label={step === PREVIEW_SLIDES.length - 1 ? "Replay preview" : "Next preview"}
          onPress={() => setStep((value) => (value + 1) % PREVIEW_SLIDES.length)}
        />
      }
    >
      <View style={{ gap: space[6], paddingVertical: space[4] }}>
        <BackButton />
        <Text variant="caption" color="ink-secondary">
          DEVELOPMENT · PREVIEW {step + 1} OF {PREVIEW_SLIDES.length}
        </Text>
        <View style={{ gap: space[3] }}>
          <Text variant="label" color="action">
            {slide.label}
          </Text>
          <Text variant="display-l">{slide.headline}</Text>
          <Text variant="body" color="ink-secondary">
            {slide.body}
          </Text>
        </View>
        <ProductPreview key={step} step={step} />
        <Text variant="caption" color="ink-secondary">
          Sample content only. No account, preferences or shared data are changed.
        </Text>
      </View>
    </Screen>
  );
}
