import { LIMITS, PAPERS, type Paper } from "@lovenotes/contracts";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
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
import { draftNoteId, useSendNote } from "@/features/notes/hooks";
import { partnerOf, useMe } from "@/features/space/hooks";
import { humanError } from "@/lib/errors";

const PAPER_LABEL: Record<Paper, string> = { cream: "Cream", blush: "Blush", kraft: "Kraft", sky: "Sky" };

/** Write on paper; sending folds it and sends it off with the pet (DESIGN §10.3). */
export default function NewNote() {
  const me = useMe();
  const space = me.data?.space;
  const partner = partnerOf(space, me.data?.profile.id);
  const send = useSendNote(space?.id, me.data?.profile.id, partner?.id);
  const toast = useToast();
  const [body, setBody] = useState("");
  const [paper, setPaper] = useState<Paper>("cream");
  const id = useRef(draftNoteId()).current;

  const fold = useSharedValue(1);
  const fly = useSharedValue(0);
  const paperStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -fly.value * 500 },
      { scaleY: fold.value },
      { scaleX: 1 - fly.value * 0.5 },
      { rotate: `${fly.value * -12}deg` },
    ],
    opacity: 1 - fly.value * 0.9,
  }));

  const done = () => {
    toast({ kind: "success", message: `On its way — ${space?.pet.name ?? "your pet"} is carrying it` });
    router.back();
  };

  const submit = () => {
    const text = body.trim();
    if (!text) return;
    haptics.thud();
    send.mutate(
      { id, body: text, paper },
      {
        onSuccess: () => {
          fold.value = withTiming(0.12, { duration: 260 });
          fly.value = withSequence(
            withTiming(0, { duration: 260 }),
            withTiming(1, { duration: 520, easing: Easing.in(Easing.quad) }, (f) => {
              if (f) runOnJS(done)();
            }),
          );
        },
        onError: (e) => toast({ kind: "error", message: humanError(e) }),
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
          loading={send.isPending}
          disabled={!body.trim()}
          onPress={submit}
        />
      }
    >
      <View style={{ gap: 20, paddingTop: 8 }}>
        <BackButton label="Close" />
        <Text variant="display-m">A note for {partner?.displayName ?? "them"}</Text>
        <Animated.View
          style={[
            { backgroundColor: paperFill[paper], borderRadius: radius.paper, padding: 20, ...lift[1] },
            paperStyle,
          ]}
        >
          <PaperInput
            value={body}
            onChangeText={setBody}
            placeholder="Good luck today…"
            maxLength={LIMITS.noteBody.max}
            autoFocus
            accessibilityLabel="Your note"
          />
          <Text variant="caption" color={left < 40 ? "coral-deep" : "ink-tertiary"} align="right">
            {left}
          </Text>
        </Animated.View>
        <View style={{ gap: 8 }}>
          <Text variant="label" color="ink-secondary">
            Paper
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {PAPERS.map((p) => (
              <Chip key={p} label={PAPER_LABEL[p]} family="pink" selected={paper === p} onPress={() => setPaper(p)} />
            ))}
          </View>
        </View>
      </View>
    </Screen>
  );
}
