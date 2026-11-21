import { MOODS, type MoodId, PET_MOOD_WORD } from "@lovenotes/contracts";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import {
  Avatar,
  Button,
  Gear,
  layout,
  MoodCreature,
  moodCardFill,
  Pet,
  PressableScale,
  palette,
  radius,
  Screen,
  Skeleton,
  space as spacing,
  Text,
  useThemeSubscription,
  useToast,
} from "@/design-system";
import { MomentCard } from "@/features/home/MomentCard";
import { MomentDeck } from "@/features/home/MomentDeck";
import { type HomeMoment, homeMoments } from "@/features/home/moments";
import { useDaily } from "@/features/quizzes/hooks";
import { partnerOf, useMe } from "@/features/space/hooks";
import { useRealtime } from "@/features/space/realtime-sync";
import { CheckinSheet } from "@/features/vibe/CheckinSheet";
import { useCheckin, useVibe } from "@/features/vibe/hooks";
import { widgetKey } from "@/features/widgets/useWidgetSync";
import { api, unwrap } from "@/lib/api";
import { humanError } from "@/lib/errors";

const longDate = (d: Date) => d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
const COUNT_TITLE = ["", "One little thing", "Two little things", "Three little things"];

/** One person's vibe as a compact pill (Home · The Deck). An empty pill invites a check-in. */
function VibePill({ mood, who, onPress }: { mood: MoodId | null; who: string; onPress?: () => void }) {
  return (
    <PressableScale
      disabled={!onPress}
      onPress={onPress}
      accessibilityLabel={mood ? `${who}: ${MOODS[mood].label}` : `${who}: not shared yet`}
      style={{
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing[2],
        minHeight: layout.minTouch + spacing[1],
        paddingVertical: spacing[1],
        paddingLeft: spacing[1],
        paddingRight: spacing[3],
        borderRadius: radius.pill,
        backgroundColor: mood ? moodCardFill(MOODS[mood].family, "base") : "transparent",
        borderWidth: mood ? 0 : 1.5,
        borderStyle: "dashed",
        borderColor: palette["line-strong"],
      }}
    >
      {mood ? <MoodCreature mood={mood} size={spacing[10]} /> : <View style={{ width: spacing[10] }} />}
      <View style={{ flexShrink: 1 }}>
        <Text variant="body-sm-strong" numberOfLines={1}>
          {mood ? MOODS[mood].label : "Not shared yet"}
        </Text>
        <Text variant="caption" color="ink-tertiary" numberOfLines={1}>
          {who}
        </Text>
      </View>
    </PressableScale>
  );
}

/** One easy action, a few real moments, and a natural stopping point. */
export default function Today() {
  useThemeSubscription();
  const me = useMe();
  const { online } = useRealtime();
  const space = me.data?.space;
  const myId = me.data?.profile.id;
  const partner = partnerOf(space, myId);
  const partnerName = partner?.displayName ?? "your person";
  const partnerHere = !!partner && online.includes(partner.id);
  const now = new Date();
  const daily = useDaily(space?.id);
  const vibe = useVibe(space?.id);
  // Reuse the snapshot already loaded for widgets: its count covers the whole inbox, not one page.
  const snapshot = useQuery({
    queryKey: widgetKey(space?.id ?? ""),
    queryFn: () => unwrap(api.spaces[":sid"].widget.$get({ param: { sid: space?.id ?? "" } })),
    enabled: !!space?.id,
  });
  const checkin = useCheckin(space?.id, myId);
  const toast = useToast();
  const [checkinOpen, setCheckinOpen] = useState(false);
  const { moments, caughtUp } = homeMoments({
    notesWaiting: snapshot.data?.notesWaiting ?? 0,
    daily: daily.data,
    vibe: vibe.data,
    pet: space?.pet,
    myId,
    partnerName,
  });
  const loading =
    me.isPending ||
    (snapshot.isPending && !snapshot.data) ||
    (vibe.isPending && !vibe.data) ||
    (daily.isPending && !daily.data);
  const failed = me.isError || snapshot.isError || vibe.isError || daily.isError;
  const complete = !loading && !failed && caughtUp;
  const pendingCount = moments.filter((moment) => moment.pending).length;
  const pet = space?.pet?.status === "ACTIVE" ? space.pet : undefined;
  const openMoment = (moment: HomeMoment) => {
    if (moment.kind === "note") router.push("/notes");
    else if (moment.kind === "quiz" && daily.data) router.push(`/quiz/${daily.data.id}`);
    else if (moment.kind === "vibe") setCheckinOpen(true);
    else if (moment.kind === "pet") router.push("/pet");
    else if (moment.kind === "pet-decision") router.push("/settings");
  };

  return (
    <Screen bottomInset={false}>
      <View style={{ gap: layout.sectionGap, paddingTop: spacing[4], paddingBottom: spacing[6] }}>
        <View style={{ gap: spacing[4] }}>
          <View
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing[4] }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing[2], flex: 1 }}>
              <View style={{ flexDirection: "row" }}>
                <Avatar
                  size={28}
                  name={me.data?.profile.displayName ?? null}
                  uri={me.data?.profile.avatarUrl}
                  who="you"
                />
                {partner ? (
                  <View style={{ marginLeft: -spacing[3] }}>
                    <Avatar
                      size={28}
                      name={partner.displayName}
                      uri={partner.avatarUrl}
                      who="partner"
                      online={partnerHere}
                    />
                  </View>
                ) : null}
              </View>
              <Text variant="body-sm" color="ink-secondary" numberOfLines={1} style={{ flexShrink: 1 }}>
                {partnerHere ? `${partnerName} is here` : `${me.data?.profile.displayName ?? "You"} & ${partnerName}`}
              </Text>
            </View>
            <PressableScale
              accessibilityLabel="Open your settings"
              onPress={() => router.push("/settings")}
              style={{
                minWidth: layout.minTouch,
                minHeight: layout.minTouch,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Gear size={24} color={palette.action} />
            </PressableScale>
          </View>
          <View style={{ gap: spacing[1] }}>
            <Text variant="label" color="ink-tertiary">
              {longDate(now)}
            </Text>
            <Text variant="display-l" accessibilityRole="header">
              {loading
                ? "Between you two."
                : complete
                  ? "All caught up"
                  : (COUNT_TITLE[pendingCount] ?? "A few little things")}
            </Text>
          </View>
        </View>

        {loading && moments.length === 0 ? (
          <View style={{ gap: spacing[3] }} accessibilityLabel="Loading today's moments">
            <Skeleton height={spacing[20] * 3} radius="lg" />
            <Text variant="caption" color="ink-secondary">
              Finding your little moments…
            </Text>
          </View>
        ) : null}
        {failed ? (
          <View
            style={{
              gap: spacing[2],
              padding: layout.cardPadding,
              backgroundColor: palette.sunken,
              borderRadius: radius.md,
            }}
          >
            <Text variant="body-sm">Some updates couldn't load. Your saved moments are still here.</Text>
            <Button
              variant="quiet"
              label="Try updates again"
              onPress={() => {
                void me.refetch();
                void snapshot.refetch();
                void vibe.refetch();
                void daily.refetch();
              }}
            />
          </View>
        ) : null}
        {caughtUp ? (
          <View>
            {moments.map((moment) => (
              <MomentCard
                key={moment.kind}
                moment={moment}
                primary={false}
                onPress={() => openMoment(moment)}
                vibe={vibe.data}
                pet={space?.pet}
              />
            ))}
          </View>
        ) : (
          <MomentDeck
            moments={moments}
            onOpen={openMoment}
            vibe={vibe.data}
            pet={space?.pet}
            partnerName={partnerName}
          />
        )}

        {vibe.data ? (
          <View style={{ gap: spacing[2] }}>
            <Text variant="label" color="ink-tertiary">
              Today's vibes
            </Text>
            <View style={{ flexDirection: "row", gap: spacing[2] }}>
              <VibePill mood={vibe.data.me?.mood ?? null} who="You" onPress={() => setCheckinOpen(true)} />
              {partner ? <VibePill mood={vibe.data.partner?.mood ?? null} who={partnerName} /> : null}
            </View>
          </View>
        ) : null}

        {pet ? (
          <PressableScale
            onPress={() => router.push("/pet")}
            accessibilityLabel={`${pet.name ?? "Your pet"} is ${PET_MOOD_WORD[pet.mood]}. Open the pet room`}
            style={{ flexDirection: "row", alignItems: "center", gap: spacing[3] }}
          >
            <Pet stage={pet.stage} mood={complete ? "sleepy" : pet.mood} size={spacing[16]} />
            <View
              style={{
                flex: 1,
                backgroundColor: palette.paper,
                borderWidth: 1.5,
                borderColor: palette.ink,
                borderRadius: radius.md,
                paddingVertical: spacing[2],
                paddingHorizontal: spacing[3],
              }}
            >
              <Text variant="body-sm">
                {complete
                  ? `${pet.name ?? "Your little one"} is dozing. Nothing needs you right now.`
                  : `${pet.name ?? "Your little one"} is ${PET_MOOD_WORD[pet.mood]} and keeping an eye on things.`}
              </Text>
            </View>
          </PressableScale>
        ) : null}

        {!loading ? (
          <View style={{ gap: spacing[3], alignItems: "center", paddingVertical: spacing[4] }}>
            <Text variant="heading" align="center">
              {complete ? "You're all caught up" : failed ? "A quiet moment is enough" : "Take it at your own pace"}
            </Text>
            <Text variant="body-sm" color="ink-secondary" align="center">
              {complete
                ? "Nothing else you need to do. Just a little space for the two of you."
                : "These moments will be here whenever you feel like it."}
            </Text>
            <Button variant="quiet" label="Leave a little note" onPress={() => router.push("/notes/new")} />
          </View>
        ) : null}
      </View>
      <CheckinSheet
        open={checkinOpen}
        onClose={() => setCheckinOpen(false)}
        partnerName={partner?.displayName ?? null}
        initial={vibe.data?.me ? { mood: vibe.data.me.mood, note: vibe.data.me.note } : null}
        saving={checkin.isPending}
        onSave={(input) =>
          checkin.mutate(input, {
            onSuccess: () => {
              setCheckinOpen(false);
              toast({
                kind: "success",
                message: input.visibility === "shared" ? `Shared with ${partnerName}` : "Saved — just for you",
              });
            },
            onError: (error) => toast({ kind: "error", message: humanError(error) }),
          })
        }
      />
    </Screen>
  );
}
