import { MOODS, type MoodId, type QuizCategory } from "@lovenotes/contracts";
import type { ComponentProps, ComponentType } from "react";
import { useThemeSubscription } from "@/design-system/theme/ThemeProvider";
import { art, artFamily, moodCardFill } from "../tokens";
import { CATEGORY_LABEL, CategoryArtwork, quizColors } from "./CategoryArtwork";
import { MoodArtwork, type MoodArtworkProps } from "./MoodArtwork";

type CategoryProps = ComponentProps<typeof CategoryArtwork>;

/** Replace one renderer here; callers keep their size, state and accessibility props. */
export const illustrations = {
  moods: {
    joyful: MoodArtwork,
    excited: MoodArtwork,
    grateful: MoodArtwork,
    connected: MoodArtwork,
    calm: MoodArtwork,
    tired: MoodArtwork,
    sensitive: MoodArtwork,
    confused: MoodArtwork,
    stressed: MoodArtwork,
    insecure: MoodArtwork,
    hurt: MoodArtwork,
    angry: MoodArtwork,
  } satisfies Record<MoodId, ComponentType<MoodArtworkProps>>,
  quizzes: {
    about_me: CategoryArtwork,
    favorites: CategoryArtwork,
    personality: CategoryArtwork,
    relationship: CategoryArtwork,
    chaos: CategoryArtwork,
    daily: CategoryArtwork,
  } satisfies Record<QuizCategory, ComponentType<CategoryProps>>,
  empty: {
    journal: "joyful",
    memories: "calm",
    future: "excited",
  } satisfies Record<string, MoodId>,
};

/** Shared labels live in contracts; visual roles are resolved from the current tokens. */
export function moodVisual(mood: MoodId) {
  const definition = MOODS[mood];
  const colors = definition.family === "neutral" ? null : artFamily(definition.family);
  return {
    ...definition,
    illustration: illustrations.moods[mood],
    fill: colors ? colors[definition.tone] : art["line-strong"],
    cardFill: moodCardFill(definition.family, definition.tone),
  };
}

export function MoodCreature(props: MoodArtworkProps) {
  useThemeSubscription();
  const visual = moodVisual(props.mood);
  const Renderer = visual.illustration;
  return <Renderer color={visual.fill} {...props} />;
}

export function quizVisual(category: QuizCategory) {
  return {
    label: CATEGORY_LABEL[category],
    colors: quizColors(category),
    illustration: illustrations.quizzes[category],
  };
}

export function CategoryCreature(props: CategoryProps) {
  useThemeSubscription();
  const Renderer = illustrations.quizzes[props.category];
  return <Renderer {...props} />;
}
