import { LIMITS, MOOD_IDS, MOODS, type MoodId, type MoodVisibility } from "@lovenotes/contracts";
import { useEffect, useState } from "react";
import { View } from "react-native";
import Animated, { useAnimatedStyle, withSpring, withTiming } from "react-native-reanimated";
import {
  Button,
  dur,
  haptics,
  LockSimple,
  MoodCreature,
  opacity,
  PressableScale,
  palette,
  radius,
  Sheet,
  scale,
  spring,
  stroke,
  Text,
  TextField,
} from "@/design-system";

function MoodOption({
  mood,
  selected,
  dimmed,
  onPress,
}: {
  mood: MoodId;
  selected: boolean;
  dimmed: boolean;
  onPress: () => void;
}) {
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(selected ? scale.select : 1, spring.bouncy) }],
    opacity: withTiming(dimmed ? opacity.dimmed : 1, { duration: dur.fast }),
  }));
  return (
    <Animated.View style={[{ width: "31%" }, style]}>
      <PressableScale
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        accessibilityLabel={MOODS[mood].label}
        onPress={onPress}
        style={{
          alignItems: "center",
          paddingVertical: 8,
          borderRadius: radius.md,
          borderWidth: 2,
          borderColor: selected ? palette["cobalt-base"] : "transparent",
          backgroundColor: selected ? palette["cobalt-soft"] : "transparent",
        }}
      >
        <MoodCreature mood={mood} size={56} backdrop={selected ? palette["cobalt-soft"] : palette.paper} />
        <Text variant="caption" numberOfLines={1}>
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

/** Today's check-in (SPEC §4.1): pick a mood, optional note, then keep private or share. */
export function CheckinSheet({ open, onClose, partnerName, initial, saving, onSave }: Props) {
  const [mood, setMood] = useState<MoodId | null>(initial?.mood ?? null);
  const [note, setNote] = useState(initial?.note ?? "");

  useEffect(() => {
    if (open) {
      setMood(initial?.mood ?? null);
      setNote(initial?.note ?? "");
    }
  }, [open, initial?.mood, initial?.note]);

  const save = (visibility: MoodVisibility) => mood && onSave({ mood, note: note.trim() || null, visibility });

  return (
    <Sheet open={open} onClose={onClose} accessibilityLabel="How are you feeling?">
      <View style={{ gap: 16, paddingBottom: 8 }}>
        <Text variant="display-m">How are you feeling?</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 6 }}>
          {MOOD_IDS.map((m) => (
            <MoodOption
              key={m}
              mood={m}
              selected={mood === m}
              dimmed={mood !== null && mood !== m}
              onPress={() => {
                haptics.tick();
                setMood(m);
              }}
            />
          ))}
        </View>
        {mood ? (
          <>
            <TextField
              label="A few words (optional)"
              value={note}
              onChangeText={setNote}
              maxLength={LIMITS.moodNote.max}
              placeholder="long day, good coffee"
              returnKeyType="done"
            />
            <View style={{ gap: 10 }}>
              <Button
                fullWidth
                label={`Share with ${partnerName ?? "your person"}`}
                loading={saving}
                onPress={() => save("shared")}
              />
              <Button
                fullWidth
                variant="secondary"
                icon={LockSimple}
                label="Keep it private"
                disabled={saving}
                onPress={() => save("private")}
              />
            </View>
            <Text variant="caption" color="ink-tertiary" align="center">
              Private moods stay on your side — {partnerName ?? "they"} won't see anything.
            </Text>
          </>
        ) : (
          <View style={{ height: stroke.hairline }} />
        )}
      </View>
    </Sheet>
  );
}
