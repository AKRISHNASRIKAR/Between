import { LIMITS, MOOD_IDS, MOODS, type MoodId, type MoodVisibility } from "@lovenotes/contracts";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, ScrollView, View } from "react-native";
import Animated, { useAnimatedStyle, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Button,
  haptics,
  LockSimple,
  layout,
  MoodCreature,
  moodCardFill,
  PressableScale,
  palette,
  radius,
  Segmented,
  scale,
  spring,
  stroke,
  Text,
  TextField,
  X,
} from "@/design-system";
import { useThemeSubscription } from "@/design-system/theme/ThemeProvider";

function MoodOption({ mood, selected, onPress }: { mood: MoodId; selected: boolean; onPress: () => void }) {
  useThemeSubscription();
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(selected ? scale.select : 1, spring.bouncy) }],
  }));
  return (
    <Animated.View style={style}>
      <PressableScale
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        accessibilityLabel={MOODS[mood].label}
        onPress={onPress}
        style={{
          width: 68,
          alignItems: "center",
          gap: 4,
          paddingVertical: 8,
          borderRadius: radius.md,
          borderWidth: 2,
          borderColor: selected ? palette.action : "transparent",
          backgroundColor: selected ? palette["action-soft"] : "transparent",
        }}
      >
        <MoodCreature mood={mood} size={44} backdrop={selected ? palette["action-soft"] : palette.canvas} />
        <Text variant="caption" numberOfLines={1} color={selected ? "on-action-soft" : "ink"}>
          {MOODS[mood].label}
        </Text>
      </PressableScale>
    </Animated.View>
  );
}

type Props = {
  open: boolean;
  onClose: () => void;
  partnerName: string | null;
  initial?: { mood: MoodId; note: string | null } | null;
  saving: boolean;
  onSave: (v: { mood: MoodId; note: string | null; visibility: MoodVisibility }) => void;
};

/**
 * Today's check-in (SPEC §4.1), Check-in · Full screen (design decision 2026-11-21): the chosen
 * mood large and centred, every mood on one shelf, and the privacy choice right above save.
 */
export function CheckinSheet({ open, onClose, partnerName, initial, saving, onSave }: Props) {
  useThemeSubscription();
  const insets = useSafeAreaInsets();
  const [mood, setMood] = useState<MoodId | null>(initial?.mood ?? null);
  const [note, setNote] = useState(initial?.note ?? "");
  const [visibility, setVisibility] = useState<MoodVisibility>("shared");
  const who = partnerName ?? "your person";

  useEffect(() => {
    if (open) {
      setMood(initial?.mood ?? null);
      setNote(initial?.note ?? "");
    }
  }, [open, initial?.mood, initial?.note]);

  const save = () => mood && onSave({ mood, note: note.trim() || null, visibility });
  const hero = layout.minTouch * 3; // 132

  return (
    <Modal
      visible={open}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, backgroundColor: palette.canvas }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 16,
            paddingHorizontal: layout.gutter,
            gap: 20,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <PressableScale
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close check-in"
              style={{
                width: layout.minTouch,
                height: layout.minTouch,
                borderRadius: radius.pill,
                backgroundColor: palette.sunken,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={20} color={palette.ink} weight="bold" />
            </PressableScale>
            <Text variant="caption" color="ink-tertiary">
              Check-in
            </Text>
            <View style={{ width: layout.minTouch }} />
          </View>

          <Text variant="display-l" accessibilityRole="header">
            How are you feeling?
          </Text>

          <View style={{ alignItems: "center", gap: 12 }} accessibilityLiveRegion="polite">
            <View
              style={{
                width: hero + 36,
                height: hero + 36,
                borderRadius: radius.pill,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: mood ? moodCardFill(MOODS[mood].family, "base") : "transparent",
                borderWidth: mood ? 0 : stroke.regular,
                borderStyle: "dashed",
                borderColor: palette["line-strong"],
              }}
            >
              {mood ? <MoodCreature mood={mood} size={hero} /> : null}
            </View>
            <Text variant="display-m">{mood ? MOODS[mood].label : "Pick one below"}</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            accessibilityRole="radiogroup"
            style={{ marginHorizontal: -layout.gutter }}
            contentContainerStyle={{ paddingHorizontal: layout.gutter, gap: 4 }}
          >
            {MOOD_IDS.map((m) => (
              <MoodOption
                key={m}
                mood={m}
                selected={mood === m}
                onPress={() => {
                  haptics.tick();
                  setMood(m);
                }}
              />
            ))}
          </ScrollView>

          <TextField
            label="A few words (optional)"
            value={note}
            onChangeText={setNote}
            maxLength={LIMITS.moodNote.max}
            placeholder="long day, good coffee"
            returnKeyType="done"
          />

          <View style={{ marginTop: "auto", gap: 12 }}>
            <Segmented<MoodVisibility>
              value={visibility}
              onChange={setVisibility}
              options={[
                { value: "shared", label: `Share with ${who}` },
                { value: "private", label: "Just for me" },
              ]}
            />
            <Button
              fullWidth
              label={visibility === "shared" ? `Share with ${who}` : "Save just for me"}
              icon={visibility === "private" ? LockSimple : undefined}
              disabled={!mood}
              loading={saving}
              onPress={save}
            />
            <Text variant="caption" color="ink-tertiary" align="center">
              {visibility === "shared"
                ? `${who} will see your mood today.`
                : `Private moods stay on your side. ${who} won't see anything.`}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
