import type { PetStage, PetWellbeing } from "@lovenotes/contracts";
import { View } from "react-native";
import Animated, { useAnimatedStyle, withSpring } from "react-native-reanimated";
import { BowlFood, type Family, family, HandHeart, palette, radius, spring, TennisBall, Text } from "@/design-system";
import { ago } from "@/lib/date";

const ROWS = [
  { key: "fullness", label: "Fullness", fam: "orange", Icon: BowlFood },
  { key: "energy", label: "Energy", fam: "sky", Icon: TennisBall },
  { key: "love", label: "Love", fam: "pink", Icon: HandHeart },
] as const satisfies ReadonlyArray<{
  key: keyof Omit<PetWellbeing, "lastCare">;
  label: string;
  fam: Family;
  Icon: unknown;
}>;

const VERB = { feed: "fed", pet: "gave a scratch to", play: "played with" } as const;

function SoftBar({ value, fam }: { value: number; fam: Family }) {
  const f = family(fam);
  const fill = useAnimatedStyle(() => ({ width: withSpring(`${Math.round(value * 100)}%`, spring.gentle) }));
  return (
    <View style={{ flex: 1, height: 10, borderRadius: radius.pill, backgroundColor: f.soft, overflow: "hidden" }}>
      <Animated.View style={[{ height: 10, borderRadius: radius.pill, backgroundColor: f.base }, fill]} />
    </View>
  );
}

/** Why the pet feels this way, phrased for this viewer ("You fed Mochi · 2h ago"). */
function reasons(w: PetWellbeing, stage: PetStage, petName: string, who: (id: string) => string) {
  if (stage === "egg") return ["Warm in the nest, waiting to hatch"];
  if (!w.lastCare.length) return [`${petName} is resting and happy to see you`];
  return w.lastCare.map((c) => `${who(c.byUserId)} ${VERB[c.kind]} ${petName} · ${ago(c.at)}`);
}

/**
 * Well-being (CONTEXT): three soft states that fill with care and settle back to calm — never
 * empty, never a warning. Words first; the bars are only a gentle hint.
 */
export function WellbeingCard({
  wellbeing,
  stage,
  petName,
  who,
}: {
  wellbeing: PetWellbeing;
  stage: PetStage;
  petName: string;
  who: (userId: string) => string;
}) {
  return (
    <View style={{ backgroundColor: palette.paper, borderRadius: radius.lg, padding: 20, gap: 14 }}>
      {ROWS.map(({ key, label, fam, Icon }) => {
        const s = wellbeing[key];
        return (
          <View
            key={key}
            accessible
            accessibilityLabel={`${label}: ${s.word}`}
            style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
          >
            <Icon size={20} color={family(fam).deep} weight="bold" />
            <Text variant="body-sm" style={{ width: 64 }}>
              {label}
            </Text>
            <SoftBar value={s.value} fam={fam} />
            <Text
              variant="hand-m"
              numberOfLines={1}
              // the script face overhangs its box; the padding keeps the last letter visible
              style={{ minWidth: 88, paddingRight: 4, textAlign: "right", color: family(fam).deep }}
            >
              {s.word}
            </Text>
          </View>
        );
      })}
      <View style={{ gap: 4, paddingTop: 4 }}>
        {reasons(wellbeing, stage, petName, who).map((r) => (
          <Text key={r} variant="caption" color="ink-tertiary">
            {r}
          </Text>
        ))}
      </View>
    </View>
  );
}
