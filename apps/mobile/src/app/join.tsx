import { View } from "react-native";
import { BackButton } from "@/components/BackButton";
import { Screen, Text } from "@/design-system";
import { JoinCard } from "@/features/space/JoinCard";

export default function Join() {
  return (
    <Screen>
      <View style={{ gap: 24, paddingTop: 8 }}>
        <BackButton />
        <View style={{ gap: 10 }}>
          <Text variant="label" color="purple-deep">
            A SPACE FOR TWO
          </Text>
          <Text variant="display-l">Your person is waiting.</Text>
          <Text variant="body" color="ink-secondary">
            One code brings your notes, discoveries, and memories together.
          </Text>
        </View>
        <JoinCard />
      </View>
    </Screen>
  );
}
