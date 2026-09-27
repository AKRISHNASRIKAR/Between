import { router } from "expo-router";
import { View } from "react-native";
import { Avatar, PressableScale, Screen, Text } from "@/design-system";
import { NoteWaitingMoment } from "@/features/notes/NoteWaiting";
import { PetStage } from "@/features/pet/PetStage";
import { partnerOf, useMe } from "@/features/space/hooks";
import { useRealtime } from "@/features/space/realtime-sync";
import { VibeSection } from "@/features/vibe/VibeSection";

const weekday = (d: Date) => d.toLocaleDateString(undefined, { weekday: "long" });
const monthDay = (d: Date) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });

/** "What's happening between us today?" — never a dashboard (SPEC §5.3). */
export default function Today() {
  const me = useMe();
  const { online } = useRealtime();
  const space = me.data?.space;
  const partner = partnerOf(space, me.data?.profile.id);
  const partnerHere = !!partner && online.includes(partner.id);
  const now = new Date();

  return (
    <Screen bottomInset={false}>
      <View className="gap-8 pt-4">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 gap-1 pr-4">
            <Text variant="label" color="ink-tertiary">
              {monthDay(now)}
            </Text>
            <Text
              variant="display-xl"
              accessibilityRole="header"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {weekday(now)}
            </Text>
          </View>
          <PressableScale accessibilityLabel="Settings" onPress={() => router.push("/settings")} hitSlop={8}>
            <Avatar name={me.data?.profile.displayName ?? null} uri={me.data?.profile.avatarUrl} who="you" />
          </PressableScale>
        </View>

        {partner ? (
          <View className="flex-row items-center gap-2">
            <Avatar size={28} name={partner.displayName} uri={partner.avatarUrl} who="partner" online={partnerHere} />
            <Text variant="body-sm" color="ink-secondary">
              {partnerHere ? `${partner.displayName} is here now` : `You & ${partner.displayName}`}
            </Text>
          </View>
        ) : null}

        <NoteWaitingMoment />

        <VibeSection />

        <View className="pt-2">
          <PetStage size={170} onPressPet={() => router.push("/pet")} />
        </View>
      </View>
    </Screen>
  );
}
