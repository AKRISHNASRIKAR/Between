import type { NoticePillar, PetMood, PetStage } from "@lovenotes/contracts";
import { View } from "react-native";
import { Pet } from "../illustrations/pet";
import { Text } from "../Text";
import { family, lift, palette, pillar, radius } from "../tokens";

const PILLAR_LABEL: Record<NoticePillar, string> = {
  today: "Today",
  know: "Knowing",
  notes: "Notes",
  remember: "Remember",
  future: "Our future",
  pet: "Your pet",
};

type Props = {
  title: string;
  body: string;
  pillar: NoticePillar;
  pet: { stage: PetStage; mood: PetMood };
};

/**
 * An in-app notice (DESIGN §7.4): a paper slip in the pillar's colour, delivered by the pet.
 * Same words as the push (both come from `noticeCopy`), so the two never disagree.
 */
export function NoticeCard({ title, body, pillar: p, pet }: Props) {
  const f = family(pillar[p]);
  return (
    <View
      style={{
        backgroundColor: palette.paper,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: f.soft,
        paddingVertical: 12,
        paddingLeft: 12,
        paddingRight: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        overflow: "hidden",
        ...lift[2],
      }}
    >
      {/* pillar tape along the top edge */}
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, backgroundColor: f.base }} />
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: radius.pill,
          backgroundColor: f.soft,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <Pet stage={pet.stage} mood={pet.mood} size={52} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="label-sm" style={{ color: f.deep }}>
          {PILLAR_LABEL[p]}
        </Text>
        <Text variant="heading" numberOfLines={2}>
          {title}
        </Text>
        <Text variant="body-sm" color="ink-secondary" numberOfLines={2}>
          {body}
        </Text>
      </View>
    </View>
  );
}
