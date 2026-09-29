import type { QuizCategory } from "@lovenotes/contracts";
import { Circle, Ellipse, G, Path, Svg } from "react-native-svg";
import { palette, quizTheme } from "../tokens";
import { circle, roundedPolygon, roundRect, SoftShape, starPoints } from "./soft";

/** Quiz category → its paint-chip colours (DESIGN §2.6). */
export const quizColors = (category: QuizCategory) => quizTheme[category];

export const CATEGORY_LABEL: Record<QuizCategory, string> = {
  about_me: "About me",
  favorites: "Favorites",
  personality: "Personality",
  relationship: "Us",
  chaos: "Chaos",
  daily: "Daily question",
};

const BODY: Record<QuizCategory, string> = {
  about_me: circle(50, 54, 28),
  favorites: roundedPolygon(starPoints(50, 55, 38, 18, 5), 6),
  personality: [circle(36, 58, 16), circle(52, 46, 20), circle(66, 58, 15), roundRect(22, 56, 58, 20, 10)].join(" "),
  relationship: `${circle(39, 55, 21)} ${circle(61, 55, 21)}`,
  chaos: roundedPolygon(starPoints(50, 54, 34, 25, 8), 5),
  daily: circle(50, 54, 28),
};

/** Small creature per quiz category, in the clean illustration style. */
export function CategoryCreature({
  category,
  size = 72,
  onBase = false,
}: {
  category: QuizCategory;
  size?: number;
  onBase?: boolean;
}) {
  const t = quizTheme[category];
  // On its own card the creature takes the card's accent, with its face in the card's text colour.
  const ink = onBase ? t.text : palette.ink;
  const fill = onBase ? t.accent : t.fill;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityElementsHidden>
      <SoftShape id={`cat-${category}`} d={BODY[category]} fill={fill} lift={5} />
      {category === "daily" ? (
        <G>
          <Path
            d="M 42 46 C 42 36 58 36 58 46 C 58 53 50 53 50 60"
            stroke={ink}
            strokeWidth={4.5}
            strokeLinecap="round"
            fill="none"
          />
          <Circle cx={50} cy={69} r={2.8} fill={ink} />
        </G>
      ) : (
        <G>
          <Ellipse cx={43} cy={54} rx={3} ry={3.8} fill={ink} />
          <Ellipse cx={57} cy={54} rx={3} ry={3.8} fill={ink} />
          <Path
            d={category === "chaos" ? "M 42 63 L 46 60 L 50 63 L 54 60 L 58 63" : "M 44 62 Q 50 67 56 62"}
            stroke={ink}
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </G>
      )}
    </Svg>
  );
}
