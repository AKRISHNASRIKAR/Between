import type { Pet as PetState, Vibe } from "@lovenotes/contracts";
import { View } from "react-native";
import {
  ArrowRight,
  Button,
  CategoryCreature,
  EnvelopeBody,
  HandHeart,
  layout,
  MoodCreature,
  Pet,
  PressableScale,
  palette,
  radius,
  space,
  Text,
  useThemeSubscription,
} from "@/design-system";
import type { HomeMoment } from "./moments";

export function MomentCard({
  moment,
  primary,
  onPress,
  vibe,
  pet,
}: {
  moment: HomeMoment;
  primary: boolean;
  onPress: () => void;
  vibe: Vibe | undefined;
  pet: PetState | undefined;
}) {
  useThemeSubscription();
  const illustrationSize = primary ? space[16] : space[12];
  const artwork = (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: illustrationSize, alignItems: "center", justifyContent: "center" }}
    >
      {moment.kind === "note" ? (
        <EnvelopeBody paper="cream" width={illustrationSize} />
      ) : moment.kind === "quiz" ? (
        <CategoryCreature category="daily" size={illustrationSize} />
      ) : moment.kind === "vibe" ? (
        <MoodCreature mood={vibe?.me?.mood ?? "calm"} size={illustrationSize} backdrop={palette.paper} />
      ) : moment.kind === "pet" && pet ? (
        <Pet stage={pet.stage} mood={pet.mood} size={illustrationSize} />
      ) : moment.kind === "pet-decision" ? (
        <HandHeart size={illustrationSize * 0.6} color={palette.action} />
      ) : null}
    </View>
  );

  if (primary)
    return (
      <View
        style={{
          backgroundColor: palette.paper,
          borderRadius: radius.lg,
          borderCurve: "continuous",
          borderWidth: 1,
          borderColor: palette.line,
          padding: layout.cardPadding,
          gap: space[4],
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space[3] }}>
          <View
            style={{
              backgroundColor: palette.highlight,
              borderRadius: radius.sm,
              paddingHorizontal: space[3],
              paddingVertical: space[2],
              flexShrink: 1,
            }}
          >
            <Text variant="label" color="highlight-ink">
              Now, between you
            </Text>
          </View>
          {artwork}
        </View>
        <Text variant="display-m" accessibilityRole="header">
          {moment.title}
        </Text>
        <Text variant="body" color="ink-secondary">
          {moment.body}
        </Text>
        <Button label={moment.action} onPress={onPress} fullWidth />
      </View>
    );

  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={`${moment.title}. ${moment.body} ${moment.action}`}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space[4],
        paddingVertical: space[4],
        borderBottomWidth: 1,
        borderBottomColor: palette.line,
      }}
    >
      {artwork}
      <View style={{ flex: 1, gap: space[2] }}>
        <Text variant="heading" accessibilityRole="header">
          {moment.title}
        </Text>
        <Text variant="body-sm" color="ink-secondary">
          {moment.body}
        </Text>
        <Text variant="body-sm-strong" color="action">
          {moment.action}
        </Text>
      </View>
      <ArrowRight size={space[4]} color={palette.action} />
    </PressableScale>
  );
}
