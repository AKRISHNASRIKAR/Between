import { useState } from "react";
import { useWindowDimensions, View } from "react-native";
import {
  Button,
  EnvelopeBody,
  EnvelopeFlap,
  NoteCard,
  PressableScale,
  palette,
  radius,
  space,
  Text,
} from "@/design-system";
import { WelcomeKeepsake } from "@/design-system/objects/WelcomeKeepsake";
import { useThemeSubscription } from "@/design-system/theme/ThemeProvider";
import { OptionRow } from "@/features/quizzes/OptionRow";

export const PREVIEW_SLIDES = [
  {
    headline: "A little thought. A closer day.",
    body: "Leave a note for them to find whenever they're ready.",
    label: "Leave something",
  },
  {
    headline: "You answer. They answer. You discover.",
    body: "Share your picks, guess theirs, and discover both answers when you're ready.",
    label: "Discover each other",
  },
  {
    headline: "Little moments. Your shared story.",
    body: "Keep photos, write both sides of a memory, and make plans together.",
    label: "Keep it together",
  },
] as const;

/** Bundled illustrations and local selections only. No auth, query cache, permissions or API. */
export function ProductPreview({ step }: { step: number }) {
  useThemeSubscription();
  const { width } = useWindowDimensions();
  const [opened, setOpened] = useState(false);
  const [choice, setChoice] = useState<string | null>(null);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const artWidth = Math.min(width - space[10] * 2, 280);
  if (step === 0)
    return (
      <View style={{ gap: space[4], alignItems: "center", width: "100%" }}>
        {opened ? (
          <View style={{ width: "100%" }}>
            <NoteCard
              id="onboarding-demo-note"
              body="Saved you the last cookie. Some things are better shared."
              paper="cream"
              footer={
                <Text variant="caption" color="ink-secondary">
                  A sample note from your person
                </Text>
              }
            />
          </View>
        ) : (
          <PressableScale
            accessibilityLabel="Open sample note"
            onPress={() => setOpened(true)}
            style={{ width: artWidth, minHeight: 160, justifyContent: "center" }}
          >
            <EnvelopeBody paper="cream" width={artWidth} />
            <View style={{ position: "absolute", top: 0 }}>
              <EnvelopeFlap paper="cream" width={artWidth} />
            </View>
          </PressableScale>
        )}
        <Button
          variant="secondary"
          size="md"
          label={opened ? "Close sample note" : "Open sample note"}
          onPress={() => setOpened((value) => !value)}
        />
      </View>
    );
  if (step === 1)
    return (
      <View style={{ gap: space[3], width: "100%" }}>
        <Text variant="heading">Your ideal evening?</Text>
        <View accessibilityRole="radiogroup" accessibilityLabel="Choose a sample answer" style={{ gap: space[2] }}>
          {[
            { id: "home", label: "A quiet night in" },
            { id: "out", label: "Something spontaneous" },
          ].map((option) => (
            <OptionRow
              key={option.id}
              label={option.label}
              selected={choice === option.id}
              onPress={() => setChoice(option.id)}
            />
          ))}
        </View>
        {choice ? (
          <View
            style={{
              backgroundColor: palette["action-soft"],
              borderRadius: radius.md,
              padding: space[4],
              gap: space[2],
            }}
            accessibilityLiveRegion="polite"
          >
            <Text variant="body-sm-strong" color="on-action-soft">
              Sample partner answer: Something spontaneous
            </Text>
            <Text variant="body-sm" color="on-action-soft">
              {choice === "out"
                ? "A shared pick. In a real quiz, you only see this after you've both finished."
                : "Two perspectives. In a real quiz, their answer stays hidden until you've both finished."}
            </Text>
          </View>
        ) : (
          <Text variant="caption" color="ink-secondary">
            Try a sample pick. Nothing is saved or sent.
          </Text>
        )}
      </View>
    );
  return (
    <View style={{ alignItems: "center", gap: space[3], width: "100%" }}>
      <PressableScale
        accessibilityLabel={memoryOpen ? "Close sample memory" : "Open sample memory"}
        onPress={() => setMemoryOpen((value) => !value)}
      >
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <WelcomeKeepsake width={artWidth} />
        </View>
      </PressableScale>
      {memoryOpen ? (
        <View
          style={{
            padding: space[4],
            backgroundColor: palette.paper,
            borderRadius: radius.md,
            gap: space[2],
            width: "100%",
          }}
        >
          <Text variant="heading">The long way home</Text>
          <Text variant="body-sm" color="ink-secondary">
            We took the scenic route, talked about everything, and forgot to check the time.
          </Text>
        </View>
      ) : null}
      <Button
        variant="quiet"
        size="md"
        label={memoryOpen ? "Close sample memory" : "Open sample memory"}
        onPress={() => setMemoryOpen((value) => !value)}
      />
    </View>
  );
}
