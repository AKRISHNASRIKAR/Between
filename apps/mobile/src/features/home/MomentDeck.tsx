import type { Pet as PetState, Vibe } from "@lovenotes/contracts";
import { useState } from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import {
  Button,
  CategoryCreature,
  EnvelopeBody,
  type Family,
  fadeIn,
  fadeOut,
  family,
  HandHeart,
  haptics,
  lift,
  MoodCreature,
  Pet,
  palette,
  pillar,
  radius,
  space,
  Text,
  useThemeSubscription,
} from "@/design-system";
import type { HomeMoment } from "./moments";

const DECK_HEIGHT = space[20] * 3 + space[10]; // 280: room for a display-m title, body and artwork
const PEEK = space[3] + 1; // 13: how far each card behind shows below the one in front

const familyOf = (kind: HomeMoment["kind"]): Family =>
  kind === "note" ? pillar.notes : kind === "quiz" ? pillar.know : kind === "vibe" ? pillar.today : pillar.pet;

function eyebrow(moment: HomeMoment, partnerName: string, petName: string | null | undefined) {
  if (moment.kind === "note") return `From ${partnerName}`;
  if (moment.kind === "quiz") return "Today's question";
  if (moment.kind === "vibe") return "Check-in";
  if (moment.kind === "pet") return petName ?? "Your little one";
  return `From ${partnerName}`;
}

/**
 * Home · The Deck (design decision 2026-11-21): one moment at a time. The next ones peek
 * behind, "Later" moves the current moment to the back, and the primary action sits low.
 */
export function MomentDeck({
  moments,
  onOpen,
  vibe,
  pet,
  partnerName,
}: {
  moments: HomeMoment[];
  onOpen: (moment: HomeMoment) => void;
  vibe: Vibe | undefined;
  pet: PetState | undefined;
  partnerName: string;
}) {
  useThemeSubscription();
  const [offset, setOffset] = useState(0);
  if (moments.length === 0) return null;
  // moments is non-empty here, and the modulo keeps the offset valid if the list shrinks after an action.
  const at = (i: number) => moments[(offset + i) % moments.length] as HomeMoment;
  const front = at(0);
  const f = family(familyOf(front.kind));
  const behind = [1, 2].filter((i) => i < moments.length).map(at);
  const artSize = space[20] + space[10]; // 120

  const artwork = (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {front.kind === "note" ? (
        <View style={{ transform: [{ rotate: "-9deg" }] }}>
          <EnvelopeBody paper="cream" width={artSize + space[6]} />
        </View>
      ) : front.kind === "quiz" ? (
        <CategoryCreature category="daily" size={artSize} />
      ) : front.kind === "vibe" ? (
        <MoodCreature mood={vibe?.me?.mood ?? "calm"} size={artSize} backdrop={f.soft} />
      ) : (front.kind === "pet" || front.kind === "pet-decision") && pet ? (
        <Pet stage={pet.stage} mood={pet.mood} size={artSize} />
      ) : (
        <HandHeart size={artSize * 0.6} color={palette.action} />
      )}
    </View>
  );

  return (
    <View style={{ gap: space[4] }}>
      <View style={{ height: DECK_HEIGHT + PEEK * behind.length }}>
        {behind
          .map((m, i) => ({ m, depth: i + 1 }))
          .reverse()
          .map(({ m, depth }) => (
            <View
              key={`behind-${m.kind}-${depth}`}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={{
                position: "absolute",
                left: space[4] * depth,
                right: space[4] * depth,
                top: PEEK * depth,
                height: DECK_HEIGHT,
                borderRadius: radius.xl,
                borderCurve: "continuous",
                backgroundColor: family(familyOf(m.kind)).base,
                opacity: depth === 1 ? 0.6 : 0.4,
              }}
            />
          ))}
        {/* One entrance per swap: the old card fades out while the new one fades in. */}
        <Animated.View
          key={`${front.kind}-${offset}`}
          entering={fadeIn}
          exiting={fadeOut}
          style={[
            {
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              height: DECK_HEIGHT,
              borderRadius: radius.xl,
              borderCurve: "continuous",
              backgroundColor: f.soft,
              padding: space[5],
              overflow: "hidden",
            },
            lift[2],
          ]}
          accessible
          accessibilityRole="summary"
          accessibilityLabel={`${eyebrow(front, partnerName, pet?.name)}. ${front.title}. ${front.body}. ${(offset % moments.length) + 1} of ${moments.length}.`}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: space[3] }}>
            <Text variant="label" style={{ color: f.deep }}>
              {eyebrow(front, partnerName, pet?.name)}
            </Text>
            {moments.length > 1 ? (
              <Text variant="caption" color="ink-tertiary">
                {(offset % moments.length) + 1} of {moments.length}
              </Text>
            ) : null}
          </View>
          <View style={{ gap: space[2], marginTop: space[3], maxWidth: "78%" }}>
            <Text variant="display-m" accessibilityRole="header">
              {front.title}
            </Text>
            <Text variant="body-sm" color="ink-secondary">
              {front.body}
            </Text>
          </View>
          <View style={{ position: "absolute", right: -space[4], bottom: -space[3] }}>{artwork}</View>
        </Animated.View>
      </View>

      {moments.length > 1 ? (
        <View
          style={{ flexDirection: "row", justifyContent: "center", gap: space[2] }}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {moments.map((m, i) => {
            const current = i === offset % moments.length;
            return (
              <View
                key={m.kind + String(i)}
                style={{
                  width: current ? space[4] + 2 : space[2] - 2,
                  height: space[2] - 2,
                  borderRadius: radius.pill,
                  backgroundColor: current ? palette.ink : palette["line-strong"],
                }}
              />
            );
          })}
        </View>
      ) : null}

      <View style={{ flexDirection: "row", gap: space[2] }}>
        {moments.length > 1 ? (
          <Button
            variant="secondary"
            size="md"
            label="Later"
            accessibilityHint="Shows the next moment"
            onPress={() => {
              haptics.tick();
              setOffset((o) => (o + 1) % moments.length);
            }}
          />
        ) : null}
        <View style={{ flex: 1 }}>
          <Button size="md" label={front.action} fullWidth onPress={() => onOpen(front)} />
        </View>
      </View>
    </View>
  );
}
