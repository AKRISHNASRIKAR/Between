import type { QuizCategory } from "@lovenotes/contracts";
import type { ReactNode } from "react";
import { View } from "react-native";
import { CATEGORY_FAMILY, CATEGORY_LABEL, CategoryCreature } from "../illustrations/CategoryCreature";
import { Text } from "../Text";
import { family, lift, radius } from "../tokens";

type Props = {
  category: QuizCategory;
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  size?: "tile" | "hero";
};

/** DESIGN §7.3 QuizCard: bold category fill, tall, creature + editorial title. */
export function QuizCard({ category, title, subtitle, footer, size = "tile" }: Props) {
  const f = family(CATEGORY_FAMILY[category]);
  const hero = size === "hero";
  return (
    <View
      style={{
        backgroundColor: f.base,
        borderRadius: hero ? radius.xl : radius.lg,
        padding: hero ? 24 : 16,
        gap: 10,
        minHeight: hero ? 200 : 190,
        justifyContent: "space-between",
        ...lift[1],
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Text variant="label" style={{ color: f.onBase }}>
          {CATEGORY_LABEL[category]}
        </Text>
        <CategoryCreature category={category} size={hero ? 64 : 48} onBase />
      </View>
      <View style={{ gap: 4 }}>
        <Text variant={hero ? "display-m" : "heading"} style={{ color: f.onBase }}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="body-sm" style={{ color: f.onBase }} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {footer}
    </View>
  );
}
