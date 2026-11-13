import type { QuizCategory } from "@lovenotes/contracts";
import type { ReactNode } from "react";
import { View } from "react-native";
import { CategoryCreature, quizVisual } from "../illustrations/registry";
import { Text } from "../Text";
import { useThemeSubscription } from "../theme/ThemeProvider";
import { palette, radius } from "../tokens";

type Props = {
  category: QuizCategory;
  title: string;
  subtitle?: string;
  /** Small line at the bottom ("6 questions"), in the card's own text colour. */
  meta?: string;
  footer?: ReactNode;
  size?: "tile" | "hero";
};

/** Quiz categories keep their artwork; paper surfaces and action color follow the personal theme. */
export function QuizCard({ category, title, subtitle, meta, footer, size = "tile" }: Props) {
  const visual = quizVisual(category);
  useThemeSubscription();
  const hero = size === "hero";
  return (
    <View
      style={{
        backgroundColor: palette.paper,
        borderWidth: 1,
        borderColor: palette.line,
        borderRadius: hero ? radius.xl : radius.lg,
        padding: hero ? 24 : 16,
        gap: 10,
        minHeight: hero ? 200 : 190,
        justifyContent: "space-between",
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Text variant="label" color="action">
          {visual.label}
        </Text>
        <CategoryCreature category={category} size={hero ? 64 : 48} />
      </View>
      <View style={{ gap: 4 }}>
        <Text variant={hero ? "display-m" : "heading"} color="ink">
          {title}
        </Text>
        {subtitle ? (
          <Text variant="body-sm" color="ink" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {meta ? (
        <Text variant="caption" color="ink">
          {meta}
        </Text>
      ) : null}
      {footer}
    </View>
  );
}
