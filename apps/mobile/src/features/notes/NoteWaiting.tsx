import { router } from "expo-router";
import { View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ArrowRight, EnvelopeBody, EnvelopeFlap, lift, PressableScale, palette, radius, Text } from "@/design-system";
import { partnerOf, useMe } from "@/features/space/hooks";
import { useNotes } from "./hooks";

export function useWaitingNotes() {
  const me = useMe();
  const inbox = useNotes(me.data?.space?.id, "inbox");
  return (inbox.data?.pages.flatMap((p) => p.items) ?? []).filter((n) => !n.openedAt);
}

/** A Today "moment": an envelope that's waiting for you. Disappears once opened. */
export function NoteWaitingMoment() {
  const me = useMe();
  const partner = partnerOf(me.data?.space, me.data?.profile.id);
  const waiting = useWaitingNotes();
  const next = waiting.at(-1); // oldest first
  if (!next) return null;
  return (
    <Animated.View entering={FadeInDown.springify().damping(18)}>
      <PressableScale
        accessibilityLabel={`${waiting.length} note${waiting.length > 1 ? "s" : ""} from ${partner?.displayName} waiting. Open.`}
        onPress={() => router.push(`/notes/${next.id}`)}
        style={{
          backgroundColor: palette["pink-soft"],
          borderRadius: radius.lg,
          padding: 16,
          flexDirection: "row",
          alignItems: "center",
          gap: 16,
          ...lift[1],
        }}
      >
        <View style={{ transform: [{ rotate: "-6deg" }] }}>
          <EnvelopeBody paper={next.paper} width={72} />
          <View style={{ position: "absolute", top: 0 }}>
            <EnvelopeFlap paper={next.paper} width={72} />
          </View>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="heading">
            {waiting.length > 1 ? `${waiting.length} notes are waiting` : "A note is waiting"}
          </Text>
          <Text variant="body-sm" color="ink-secondary">
            From {partner?.displayName ?? "your person"}
          </Text>
        </View>
        <ArrowRight size={20} color={palette.ink} weight="bold" />
      </PressableScale>
    </Animated.View>
  );
}
