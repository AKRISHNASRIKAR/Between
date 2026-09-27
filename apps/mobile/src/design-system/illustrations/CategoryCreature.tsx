import type { QuizCategory } from "@lovenotes/contracts";
import { Circle, G, Path, Svg } from "react-native-svg";
import { type Family, family, palette, stroke } from "../tokens";
import { polarPath, RisoPath } from "./riso";

/** Quiz category → pillar-ish family (DESIGN §7.3 / §8). */
export const CATEGORY_FAMILY: Record<QuizCategory, Family> = {
  about_me: "sky",
  favorites: "butter",
  personality: "purple",
  relationship: "pink",
  chaos: "orange",
  daily: "purple",
};

export const CATEGORY_LABEL: Record<QuizCategory, string> = {
  about_me: "About me",
  favorites: "Favorites",
  personality: "Personality",
  relationship: "Us",
  chaos: "Chaos",
  daily: "Daily question",
};

const BODY: Record<QuizCategory, string> = {
  about_me: "M 20 56 C 18 34 34 22 50 22 C 66 22 82 34 80 56 C 78 72 66 80 50 80 C 34 80 22 72 20 56 Z",
  favorites: polarPath(50, 52, (t) => (Math.round((t / (Math.PI * 2)) * 10) % 2 === 0 ? 36 : 18), 10),
  personality:
    "M 22 62 C 12 62 12 46 24 44 C 24 30 42 26 48 36 C 54 24 74 28 74 42 C 88 42 90 62 76 64 C 70 76 30 76 22 62 Z",
  relationship: `${polarPath(40, 54, () => 21)} ${polarPath(60, 54, () => 21)}`,
  chaos: polarPath(50, 52, (t) => 28 + 8 * Math.sin(t * 7) * Math.cos(t * 3)),
  daily: polarPath(50, 54, () => 28),
};

/** Small creature per quiz category, in the riso illustration style. */
export function CategoryCreature({
  category,
  size = 72,
  onBase = false,
}: {
  category: QuizCategory;
  size?: number;
  onBase?: boolean;
}) {
  const f = family(CATEGORY_FAMILY[category]);
  const ink = palette.ink;
  const fill = onBase ? palette.paper : f.base;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityElementsHidden>
      <RisoPath d={BODY[category]} fill={fill} />
      {category === "daily" ? (
        <Path
          d="M 42 44 C 42 34 58 34 58 44 C 58 52 50 52 50 60 M 50 68 L 50 69"
          stroke={ink}
          strokeWidth={stroke.illustration + 1}
          strokeLinecap="round"
          fill="none"
        />
      ) : (
        <G>
          <Circle cx={43} cy={52} r={3} fill={ink} />
          <Circle cx={57} cy={52} r={3} fill={ink} />
          <Path
            d={category === "chaos" ? "M 42 62 L 46 59 L 50 62 L 54 59 L 58 62" : "M 43 61 Q 50 67 57 61"}
            stroke={ink}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </G>
      )}
    </Svg>
  );
}
