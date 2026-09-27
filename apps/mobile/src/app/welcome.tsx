import { router } from "expo-router";
import { View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Button, Pet, Screen, space, Text } from "@/design-system";

export default function Welcome() {
  return (
    <Screen scroll={false} footer={<Button fullWidth label="Get started" onPress={() => router.push("/sign-in")} />}>
      <View className="flex-1 justify-center gap-10">
        <Animated.View entering={FadeInDown.duration(600)} style={{ alignItems: "center" }}>
          <Pet stage="egg" mood="content" size={220} />
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(150).duration(600)} style={{ gap: space[3] }}>
          <Text variant="label" color="ink-tertiary">
            Love Notes
          </Text>
          <Text variant="display-xl">A little corner of the internet that's just yours.</Text>
          <Text variant="body" color="ink-secondary">
            Leave notes, keep memories, and look after something small — together.
          </Text>
        </Animated.View>
      </View>
    </Screen>
  );
}
