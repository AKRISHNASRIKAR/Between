import { MOODS, type MoodId } from "@lovenotes/contracts";
import { View } from "react-native";
import { LockSimple } from "../Icon";
import { MoodCreature, SleepingCreature } from "../illustrations/MoodCreature";
import { PressableScale } from "../PressableScale";
import { Text } from "../Text";
import { lift, moodCardFill, palette, radius, stroke } from "../tokens";

type Props =
  | { state: "empty"; owner: string; onPress?: () => void; tilt: number }
  | { state: "hidden"; owner: string; tilt: number }
  | {
      state: "mood";
      owner: string;
      mood: MoodId;
      isPrivate?: boolean;
      note?: string | null;
      onPress?: () => void;
      tilt: number;
    };

/** DESIGN §7.3 VibeCard — tilted, tactile, one per person. */
export function VibeCard(props: Props) {
  const def = props.state === "mood" ? MOODS[props.mood] : null;
  const bg =
    props.state === "mood" && def
      ? moodCardFill(def.family, def.tone)
      : props.state === "hidden"
        ? palette.sunken
        : palette.canvas;
  const pressable = (props.state === "empty" || props.state === "mood") && props.onPress;

  const body = (
    <View
      style={{
        aspectRatio: 1 / 1.1,
        backgroundColor: bg,
        borderRadius: radius.lg,
        borderWidth: props.state === "empty" ? stroke.regular : 0,
        borderStyle: props.state === "empty" ? "dashed" : "solid",
        borderColor: palette["line-strong"],
        padding: 14,
        justifyContent: "space-between",
        alignItems: "center",
        ...(props.state === "mood" ? lift[1] : null),
      }}
    >
      <View style={{ alignSelf: "stretch", flexDirection: "row", justifyContent: "flex-end", minHeight: 22 }}>
        {props.state === "mood" && props.isPrivate ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              backgroundColor: palette.paper,
              borderRadius: radius.pill,
              paddingHorizontal: 8,
              paddingVertical: 3,
            }}
          >
            <LockSimple size={11} color={palette.ink} weight="bold" />
            <Text variant="label-sm">only you</Text>
          </View>
        ) : null}
      </View>
      {props.state === "mood" ? (
        <MoodCreature mood={props.mood} size={84} backdrop={bg} />
      ) : props.state === "hidden" ? (
        <SleepingCreature size={84} />
      ) : (
        <View style={{ height: 84, justifyContent: "center" }}>
          <Text variant="display-m" color="ink-tertiary" align="center">
            How are{"\n"}you?
          </Text>
        </View>
      )}
      <View style={{ alignItems: "center", alignSelf: "stretch" }}>
        {props.state === "mood" && def ? (
          <Text variant="display-m" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {def.label}
          </Text>
        ) : props.state === "hidden" ? (
          <Text variant="body-sm" color="ink-tertiary">
            Not shared yet
          </Text>
        ) : (
          <Text variant="body-sm" color="ink-tertiary">
            Tap to check in
          </Text>
        )}
        <Text variant="label" color="ink-secondary" numberOfLines={1}>
          {props.owner}
        </Text>
      </View>
    </View>
  );

  const a11y =
    props.state === "mood" && def
      ? `${props.owner}: ${def.label}${props.isPrivate ? ", private" : ""}`
      : props.state === "hidden"
        ? `${props.owner}: not shared yet`
        : `${props.owner}: check in`;

  return (
    <View style={{ flex: 1, transform: [{ rotate: `${props.tilt}deg` }] }}>
      {pressable ? (
        <PressableScale accessibilityLabel={a11y} accessibilityHint="Opens today's check-in" onPress={props.onPress}>
          {body}
        </PressableScale>
      ) : (
        <View accessible accessibilityLabel={a11y}>
          {body}
        </View>
      )}
    </View>
  );
}
