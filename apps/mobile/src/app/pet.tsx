import { View } from "react-native";
import { BackButton } from "@/components/BackButton";
import { Screen, Text } from "@/design-system";
import { PetStage } from "@/features/pet/PetStage";
import { PetTimeline } from "@/features/pet/PetTimeline";
import { WellbeingCard } from "@/features/pet/WellbeingCard";
import { partnerOf, useMe } from "@/features/space/hooks";

const moodWords = {
  sleepy: "sleepy",
  content: "content",
  happy: "happy",
  excited: "excited",
  peckish: "a little peckish",
} as const;

/** The Pet room: the pet up close, how it's doing, and its story. */
export default function PetRoom() {
  const me = useMe();
  const space = me.data?.space;
  const myId = me.data?.profile.id;
  const pet = space?.pet;
  if (!space || !pet) return null;
  const partner = partnerOf(space, myId);
  const name = pet.name ?? "Your pet";
  const who = (id: string | null) => (id === myId ? "You" : (partner?.displayName ?? "Your person"));

  return (
    <Screen>
      <View className="gap-6 pt-2 pb-10">
        <BackButton label="Close" />
        <View className="gap-1">
          <Text variant="label" color="orange-deep">
            {pet.ageDays === 0 ? "Born today" : `With you for ${pet.ageDays} ${pet.ageDays === 1 ? "day" : "days"}`}
          </Text>
          <Text variant="display-xl">{name}</Text>
          <Text variant="body" color="ink-secondary">
            is feeling {moodWords[pet.mood]}.
          </Text>
        </View>
        <View className="pt-6">
          <PetStage size={240} />
        </View>
        <Text variant="body-sm" color="ink-tertiary" align="center">
          Swipe across {name} to give them a scratch.
        </Text>
        <WellbeingCard wellbeing={pet.wellbeing} stage={pet.stage} petName={name} who={who} />
        <PetTimeline spaceId={space.id} petName={name} who={who} />
      </View>
    </Screen>
  );
}
