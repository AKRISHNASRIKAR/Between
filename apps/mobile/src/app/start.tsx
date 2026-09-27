import { router } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ArrowRight, Envelope, lift, PressableScale, palette, radius, Screen, Sparkle, Text } from "@/design-system";
import { useMe } from "@/features/space/hooks";
import { pendingInvite } from "@/features/space/pending-invite";

function Choice({
  title,
  body,
  tone,
  tilt,
  icon,
  onPress,
}: {
  title: string;
  body: string;
  tone: "butter" | "sky";
  tilt: number;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <View style={{ transform: [{ rotate: `${tilt}deg` }] }}>
      <PressableScale
        onPress={onPress}
        accessibilityLabel={title}
        accessibilityHint={body}
        style={{
          backgroundColor: palette[`${tone}-base`],
          borderRadius: radius.lg,
          padding: 20,
          gap: 16,
          ...lift[1],
        }}
      >
        <View className="flex-row items-start justify-between">
          {icon}
          <ArrowRight size={22} color={palette.ink} weight="bold" />
        </View>
        <View className="gap-1">
          <Text variant="display-m">{title}</Text>
          <Text variant="body-sm" color="ink-secondary">
            {body}
          </Text>
        </View>
      </PressableScale>
    </View>
  );
}

export default function Start() {
  const me = useMe();
  const name = me.data?.profile.displayName;

  // Arrived through an invite link? Go straight to joining.
  useEffect(() => {
    pendingInvite.get().then((c) => c && router.push("/join"));
  }, []);
  return (
    <Screen>
      <View className="gap-10 pt-12">
        <View className="gap-3">
          <Text variant="label" color="ink-tertiary">
            Hi {name}
          </Text>
          <Text variant="display-l">Let's make your space.</Text>
          <Text variant="body" color="ink-secondary">
            One of you starts it, the other joins with a code.
          </Text>
        </View>
        <View className="gap-5">
          <Animated.View entering={FadeInDown.delay(100).springify().damping(18)}>
            <Choice
              title="Start our space"
              body="You'll get a code to send to your person."
              tone="butter"
              tilt={-1.5}
              icon={<Sparkle size={28} color={palette.ink} weight="bold" />}
              onPress={() => router.push("/create")}
            />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(200).springify().damping(18)}>
            <Choice
              title="I have an invite"
              body="Enter the code they sent you."
              tone="sky"
              tilt={1.2}
              icon={<Envelope size={28} color={palette.ink} weight="bold" />}
              onPress={() => router.push("/join")}
            />
          </Animated.View>
        </View>
      </View>
    </Screen>
  );
}
