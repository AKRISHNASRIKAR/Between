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
      <View className="gap-8 pt-4 pb-6">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 gap-1 pr-4">
            <Text variant="label" color={partnerHere ? "green-deep" : "ink-tertiary"}>
              {partnerHere ? `${monthDay(now)} · ${partner?.displayName} is here` : monthDay(now)}
            </Text>
            <Text
              variant="display-l"
              accessibilityRole="header"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {weekday(now)}
            </Text>
          </View>
          {/* The two of you, overlapping; tap for settings. */}
          <PressableScale
            accessibilityLabel="Settings"
            onPress={() => router.push("/settings")}
            hitSlop={8}
            style={{ flexDirection: "row" }}
          >
            {partner ? (
              <Avatar name={partner.displayName} uri={partner.avatarUrl} who="partner" online={partnerHere} />
            ) : null}
            <View style={{ marginLeft: partner ? -10 : 0 }}>
              <Avatar name={me.data?.profile.displayName ?? null} uri={me.data?.profile.avatarUrl} who="you" />
            </View>
          </PressableScale>
        </View>

        <NoteWaitingMoment />

        <VibeSection />

        <View className="pt-2">
          <PetStage size={170} onPressPet={() => router.push("/pet")} />
        </View>
      </View>
    </Screen>
  );
}
