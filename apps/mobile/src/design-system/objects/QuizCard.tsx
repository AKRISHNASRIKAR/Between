import type { QuizCategory } from "@lovenotes/contracts";
import type { ReactNode } from "react";
import { View } from "react-native";
import { CATEGORY_LABEL, CategoryCreature, quizColors } from "../illustrations/CategoryCreature";
import { Text } from "../Text";
import { radius } from "../tokens";

type Props = {
  category: QuizCategory;
  title: string;
  subtitle?: string;
  /** Small line at the bottom ("6 questions"), in the card's own text colour. */
  meta?: string;
  footer?: ReactNode;
  size?: "tile" | "hero";
};

/** DESIGN §7.3 QuizCard: a paint-chip swatch — saturated fill, words in a contrasting colour. */
export function QuizCard({ category, title, subtitle, meta, footer, size = "tile" }: Props) {
  const t = quizColors(category);
  const hero = size === "hero";
  return (
    <View
      style={{
        backgroundColor: t.fill,
        borderRadius: hero ? radius.xl : radius.lg,
        padding: hero ? 24 : 16,
        gap: 10,
        minHeight: hero ? 200 : 190,
        justifyContent: "space-between",
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Text variant="label" style={{ color: t.text }}>
          {CATEGORY_LABEL[category]}
        </Text>
        <CategoryCreature category={category} size={hero ? 64 : 48} onBase />
      </View>
      <View style={{ gap: 4 }}>
        <Text variant={hero ? "display-m" : "heading"} style={{ color: t.text }}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="body-sm" style={{ color: t.text }} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {meta ? (
        <Text variant="caption" style={{ color: t.text }}>
          {meta}
        </Text>
      ) : null}
      {footer}
    </View>
  );
}
