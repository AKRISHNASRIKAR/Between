import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { ArrowRight, PressableScale, palette, Skeleton, Text, useToast, VibeCard } from "@/design-system";
import { partnerOf, useMe } from "@/features/space/hooks";
import { humanError } from "@/lib/errors";
import { CheckinSheet } from "./CheckinSheet";
import { useCheckin, useVibe } from "./hooks";

/** Today's Vibe (SPEC §4.1): two tilted cards, yours and theirs, plus a gentle observation. */
export function VibeSection() {
  const me = useMe();
  const space = me.data?.space;
  const myId = me.data?.profile.id;
  const partner = partnerOf(space, myId);
  const vibe = useVibe(space?.id);
  const checkin = useCheckin(space?.id, myId);
  const toast = useToast();
  const [open, setOpen] = useState(false);

  const mine = vibe.data?.me;
  const theirs = vibe.data?.partner;

  return (
    <View style={{ gap: 14 }}>
      <View className="flex-row items-center justify-between">
        <Text variant="label" color="sky-deep">
          Today's vibe
        </Text>
        <PressableScale accessibilityLabel="Our vibes history" onPress={() => router.push("/vibes")} hitSlop={10}>
          <View className="flex-row items-center gap-1">
            <Text variant="label" color="ink-secondary">
              Our vibes
            </Text>
            <ArrowRight size={14} color={palette["ink-secondary"]} weight="bold" />
          </View>
        </PressableScale>
      </View>

      {vibe.isPending ? (
        <View className="flex-row gap-3">
          <View style={{ flex: 1, aspectRatio: 1 / 1.1 }}>
            <Skeleton height={176} radius="lg" />
          </View>
          <View style={{ flex: 1, aspectRatio: 1 / 1.1 }}>
            <Skeleton height={176} radius="lg" />
          </View>
        </View>
      ) : (
        <View className="flex-row gap-3">
          {mine ? (
            <VibeCard
              state="mood"
              owner="You"
              mood={mine.mood}
              isPrivate={mine.visibility === "private"}
              tilt={-2}
              onPress={() => setOpen(true)}
            />
          ) : (
            <VibeCard state="empty" owner="You" tilt={-2} onPress={() => setOpen(true)} />
          )}
          {theirs ? (
            <VibeCard state="mood" owner={partner?.displayName ?? "Them"} mood={theirs.mood} tilt={2} />
          ) : (
            <VibeCard state="hidden" owner={partner?.displayName ?? "Them"} tilt={2} />
          )}
        </View>
      )}

      {vibe.data?.observation ? (
        <Text variant="hand-m" color="ink-secondary" align="center">
          {vibe.data.observation}
        </Text>
      ) : null}
      {vibe.isError && !vibe.data ? (
        <Text variant="caption" color="tomato-deep">
          {humanError(vibe.error)}
        </Text>
      ) : null}

      <CheckinSheet
        open={open}
        onClose={() => setOpen(false)}
        partnerName={partner?.displayName ?? null}
        initial={mine ? { mood: mine.mood, note: mine.note } : null}
        saving={checkin.isPending}
        onSave={(v) =>
          checkin.mutate(v, {
            onSuccess: () => {
              setOpen(false);
              toast({
                kind: "success",
                message:
                  v.visibility === "shared"
                    ? `Shared with ${partner?.displayName ?? "your person"}`
                    : "Saved — just for you",
              });
            },
            onError: (e) => toast({ kind: "error", message: humanError(e) }),
          })
        }
      />
    </View>
  );
}
