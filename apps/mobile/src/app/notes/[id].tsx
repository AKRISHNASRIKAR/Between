import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  FadeIn,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { BackButton } from "@/components/BackButton";
import {
  Button,
  ConfirmModal,
  EnvelopeBody,
  EnvelopeFlap,
  ErrorState,
  haptics,
  NoteCard,
  palette,
  Screen,
  Skeleton,
  spring,
  Text,
  Trash,
  useToast,
} from "@/design-system";
import { useDeleteNote, useNote, useOpenNote, useReactNote } from "@/features/notes/hooks";
import { partnerOf, useMe } from "@/features/space/hooks";
import { humanError } from "@/lib/errors";

const ENVELOPE_W = 280;

/** Opening a note: swipe up (or tap) the envelope, the flap flips, the paper slides out and unfolds. */
export default function NoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const me = useMe();
  const space = me.data?.space;
  const myId = me.data?.profile.id;
  const partner = partnerOf(space, myId);
  const note = useNote(space?.id, id);
  const open = useOpenNote(space?.id);
  const react = useReactNote(space?.id);
  const del = useDeleteNote(space?.id);
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const n = note.data;
  const mine = n?.authorId === myId;
  const sealed = !!n && !mine && !n.openedAt;
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    if (n && !sealed) setRevealed(true);
  }, [n, sealed]);

  const flap = useSharedValue(1);
  const lift = useSharedValue(0);
  const flapStyle = useAnimatedStyle(() => ({
    transformOrigin: ["50%", "0%", 0],
    transform: [{ scaleY: flap.value }],
  }));
  const envStyle = useAnimatedStyle(() => ({ transform: [{ translateY: lift.value * 260 }], opacity: 1 - lift.value }));

  const doOpen = () => {
    if (!n || open.isPending) return;
    haptics.tap();
    open.mutate(n.id, { onError: (e) => toast({ kind: "error", message: humanError(e) }) });
    flap.value = withTiming(-1, { duration: 420 });
    lift.value = withDelay(
      380,
      withSpring(1, spring.gentle, (f) => {
        if (f) {
          runOnJS(setRevealed)(true);
          runOnJS(haptics.yay)();
        }
      }),
    );
  };

  const swipe = Gesture.Pan()
    .runOnJS(true)
    .onEnd((e) => {
      if (e.translationY < -30) doOpen();
    });
  const tap = Gesture.Tap().runOnJS(true).onEnd(doOpen);

  if (note.isPending) {
    return (
      <Screen>
        <View style={{ gap: 20, paddingTop: 8 }}>
          <BackButton />
          <Skeleton height={300} radius="paper" />
        </View>
      </Screen>
    );
  }
  if (note.isError || !n) {
    return (
      <Screen>
        <View style={{ gap: 20, paddingTop: 8 }}>
          <BackButton />
          <ErrorState
            title="This note isn't here"
            body="It may have been removed. Check your connection and try again."
            onRetry={() => note.refetch()}
          />
        </View>
      </Screen>
    );
  }

  const when = new Date(n.createdAt).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  return (
    <Screen>
      <View style={{ gap: 24, paddingTop: 8 }}>
        <BackButton />
        <View style={{ gap: 4 }}>
          <Text variant="label" color="pink-deep">
            {mine ? `To ${partner?.displayName ?? "them"}` : `From ${partner?.displayName ?? "them"}`}
          </Text>
          <Text variant="body-sm" color="ink-tertiary">
            {when}
          </Text>
        </View>

        {!revealed ? (
          <View style={{ alignItems: "center", gap: 20, paddingTop: 24 }}>
            <GestureDetector gesture={Gesture.Exclusive(swipe, tap)}>
              <Animated.View
                style={envStyle}
                accessible
                accessibilityRole="button"
                accessibilityLabel="Sealed note. Double tap to open."
              >
                <EnvelopeBody paper={n.paper} width={ENVELOPE_W} />
                <Animated.View style={[{ position: "absolute", top: 0 }, flapStyle]}>
                  <EnvelopeFlap paper={n.paper} width={ENVELOPE_W} />
                </Animated.View>
              </Animated.View>
            </GestureDetector>
            <Text variant="hand-m" color="ink-secondary">
              swipe up to open
            </Text>
          </View>
        ) : (
          <Animated.View entering={FadeIn.duration(420)} style={{ gap: 20 }}>
            <NoteCard id={n.id} body={n.body} paper={n.paper} size="full" />
            {mine ? (
              <View style={{ gap: 12 }}>
                <Text variant="body-sm" color="ink-tertiary">
                  {n.reactedAt
                    ? `${partner?.displayName} loved this ♥︎`
                    : n.openedAt
                      ? `${partner?.displayName} opened it`
                      : "Not opened yet"}
                </Text>
                <Button variant="destructive" icon={Trash} label="Delete note" onPress={() => setConfirmDelete(true)} />
              </View>
            ) : (
              <Button
                variant="accent"
                family="pink"
                label={n.reactedAt ? "Loved ♥︎" : "Love it"}
                onPress={() => {
                  haptics.tick();
                  react.mutate({ id: n.id, on: !n.reactedAt });
                }}
              />
            )}
          </Animated.View>
        )}
      </View>
      <ConfirmModal
        open={confirmDelete}
        title="Delete this note?"
        body={`It'll disappear for ${partner?.displayName ?? "them"} too.`}
        confirmLabel="Delete"
        destructive
        loading={del.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() =>
          del.mutate(n.id, {
            onSuccess: () => {
              setConfirmDelete(false);
              router.back();
            },
            onError: (e) => toast({ kind: "error", message: humanError(e) }),
          })
        }
      />
      <View style={{ height: 1, backgroundColor: palette.transparent }} />
    </Screen>
  );
}
