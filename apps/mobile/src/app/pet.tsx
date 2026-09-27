import { View } from "react-native";
import { BackButton } from "@/components/BackButton";
import { Screen, Text } from "@/design-system";
import { PetStage } from "@/features/pet/PetStage";
import { useMe } from "@/features/space/hooks";

const moodWords = {
  sleepy: "sleepy",
  content: "content",
  happy: "happy",
  excited: "excited",
  peckish: "a little peckish",
} as const;

export default function PetRoom() {
  const me = useMe();
  const pet = me.data?.space?.pet;
  if (!pet) return null;
  return (
    <Screen>
      <View className="gap-6 pt-2">
        <BackButton label="Close" />
        <View className="gap-1">
          <Text variant="label" color="orange-deep">
            {pet.ageDays === 0 ? "Born today" : `With you for ${pet.ageDays} ${pet.ageDays === 1 ? "day" : "days"}`}
          </Text>
          <Text variant="display-xl">{pet.name}</Text>
          <Text variant="body" color="ink-secondary">
            is feeling {moodWords[pet.mood]}.
          </Text>
        </View>
        <View className="pt-6">
          <PetStage size={240} />
        </View>
        <Text variant="body-sm" color="ink-tertiary" align="center">
          Swipe across {pet.name} to give them a scratch.
        </Text>
      </View>
    </Screen>
  );
}
