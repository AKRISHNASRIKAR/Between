import { LIMITS, PAPERS, type Paper } from "@lovenotes/contracts";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { BackButton } from "@/components/BackButton";
import {
  Button,
  Chip,
  dur,
  ease,
  haptics,
  lift,
  PaperInput,
  PaperPlaneTilt,
  paperFill,
  radius,
  Screen,
  Text,
  useToast,
} from "@/design-system";
import { useThemeSubscription } from "@/design-system/theme/ThemeProvider";
import { useSendNote } from "@/features/notes/hooks";
import { partnerOf, useMe } from "@/features/space/hooks";
import { noteAcknowledges } from "@/lib/draft-ack";
import { humanError } from "@/lib/errors";
import { useReducedMotion } from "@/lib/preferences";
import { useDraft } from "@/lib/use-draft";

type NoteDraft = { body: string; paper: Paper };
const emptyNote = (): NoteDraft => ({ body: "", paper: "cream" });
const validNote = (value: unknown): value is NoteDraft =>
  typeof (value as NoteDraft)?.body === "string" &&
  (value as NoteDraft).body.length <= LIMITS.noteBody.max &&
  PAPERS.includes((value as NoteDraft)?.paper);

const PAPER_LABEL: Record<Paper, string> = { cream: "Cream", blush: "Blush", kraft: "Kraft", sky: "Sky" };

/** Write on paper; sending folds it and sends it off with the pet (DESIGN §10.3). */
export default function NewNote() {
  useThemeSubscription();
  const me = useMe();
  const space = me.data?.space;
  const partner = partnerOf(space, me.data?.profile.id);
  const send = useSendNote(space?.id, me.data?.profile.id, partner?.id);
  const toast = useToast();
  const draft = useDraft(
    me.data?.profile.id && space?.id ? { userId: me.data.profile.id, spaceId: space.id, editor: "note:new" } : null,
    emptyNote,
    validNote,
  );
  const sentSnapshot = useRef<NoteDraft | null>(null);
  const { body, paper } = sentSnapshot.current ?? draft.value;
  const setBody = (body: string) => draft.update((old) => ({ ...old, body }));
  const setPaper = (paper: Paper) => draft.update((old) => ({ ...old, paper }));
  const [departing, setDeparting] = useState(false);
  const submitting = useRef(false);
  const reduced = useReducedMotion();
  const id = draft.id;

  const fold = useSharedValue(1);
  const fly = useSharedValue(0);
  useEffect(
    () => () => {
      cancelAnimation(fold);
      cancelAnimation(fly);
    },
    [fold, fly],
  );
  const paperStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -fly.value * 500 },
      { scaleY: fold.value },
      { scaleX: 1 - fly.value * 0.5 },
      { rotate: `${fly.value * -12}deg` },
    ],
    opacity: 1 - fly.value * 0.9,
  }));

  const finished = useRef(false);
  const petStatus = space?.pet.status;
  const petName = space?.pet.name;
  const done = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    toast({
      kind: "success",
      message:
        petStatus === "ACTIVE"
          ? `On its way — ${petName ?? "your pet"} is carrying it`
          : "Your note is waiting for them",
    });
    router.back();
  }, [toast, petStatus, petName]);
  useEffect(() => {
    if (!departing) return;
    // An interrupted animation must not trap an already-saved note in its sending state.
    const timer = setTimeout(done, dur.base + dur.slow + dur.instant);
    return () => clearTimeout(timer);
  }, [departing, done]);

  const submit = () => {
    const text = body.trim();
    if (!text || submitting.current || departing || send.isPending) return;
    const token = { id: draft.id, revision: draft.revision };
    submitting.current = true;
    haptics.thud();
    send.mutate(
      { id, body: text, paper },
      {
        onSuccess: (saved) => {
          if (!noteAcknowledges(saved, { body: text, paper })) {
            draft.rebase(token);
            submitting.current = false;
            toast({
              kind: "error",
              message:
                "An earlier version was already saved. Your newer edits are kept here; send again to save them as a new note.",
            });
            return;
          }
          if (!draft.acknowledge(token)) {
            submitting.current = false;
            toast({ kind: "error", message: "Your sent note is saved. Newer edits are kept here as a new draft." });
            return;
          }
          sentSnapshot.current = { body, paper };
          setDeparting(true);
          if (reduced) {
            done();
            return;
          }
          fold.value = withTiming(0.12, { duration: dur.base });
          fly.value = withSequence(
            withTiming(0, { duration: dur.base }),
            withTiming(1, { duration: dur.slow, easing: ease.in }, (f) => {
              if (f) runOnJS(done)();
            }),
          );
        },
        onError: (e) => {
          submitting.current = false;
          toast({ kind: "error", message: humanError(e) });
        },
      },
    );
  };

  const left = LIMITS.noteBody.max - body.length;

  return (
    <Screen
      footer={
        <Button
          fullWidth
          label={`Leave it for ${partner?.displayName ?? "them"}`}
          icon={PaperPlaneTilt}
          loading={send.isPending || departing}
          disabled={!body.trim() || send.isPending || departing}
          onPress={submit}
        />
      }
    >
      <View style={{ gap: 20, paddingTop: 8 }}>
        <BackButton label="Close" />
        {body ? (
          <Text variant="caption" color={draft.savedLocally ? "ink-secondary" : "tomato-deep"}>
            {draft.savedLocally
              ? "Draft saved on this phone"
              : "Draft could not be saved on this phone. Keep this screen open."}
          </Text>
        ) : null}
        <Text variant="display-m">A note for {partner?.displayName ?? "them"}</Text>
        <Animated.View
          style={[
            { backgroundColor: paperFill[paper], borderRadius: radius.paper, padding: 20, ...lift[1] },
            paperStyle,
          ]}
        >
          <PaperInput
            editable={!send.isPending && !departing}
            value={body}
            onChangeText={setBody}
            placeholder="Good luck today…"
            maxLength={LIMITS.noteBody.max}
            autoFocus
            accessibilityLabel="Your note"
          />
          <Text variant="caption" color={left < 40 ? "tomato-deep" : "ink-tertiary"} align="right">
            {left}
          </Text>
        </Animated.View>
        <View style={{ gap: 8 }}>
          <Text variant="label" color="ink-secondary">
            Paper
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {PAPERS.map((p) => (
              <Chip
                key={p}
                label={PAPER_LABEL[p]}
                family="pink"
                disabled={send.isPending || departing}
                selected={paper === p}
                onPress={() => setPaper(p)}
              />
            ))}
          </View>
        </View>
      </View>
    </Screen>
  );
}
