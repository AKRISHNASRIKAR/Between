import { View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";
import { Text } from "../Text";
import { palette, radius } from "../tokens";

type Props = {
  title: string;
  emoji?: string | null;
  category: string;
  doneOn?: string | null;
  right?: React.ReactNode;
};

/**
 * DESIGN §7.3 FutureTicket: paper ticket with notches and a perforation line.
 * Completed → green tint + a rotated "DONE" stamp that drops in.
 */
export function FutureTicket({ title, emoji, category, doneOn, right }: Props) {
  const done = !!doneOn;
  const bg = done ? palette["green-soft"] : palette.paper;
  const notch = {
    position: "absolute" as const,
    top: "50%" as const,
    marginTop: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: palette.canvas,
  };
  return (
    <View
      style={{
        backgroundColor: bg,
        borderRadius: radius.paper,
        flexDirection: "row",
        minHeight: 76,
        overflow: "hidden",
      }}
    >
      <View style={{ flex: 1, padding: 16, paddingRight: 12, justifyContent: "center", gap: 4 }}>
        <Text variant="label-sm" color="ink-tertiary">
          {category}
        </Text>
        <Text
          variant="heading"
          style={done ? { textDecorationLine: "line-through", color: palette["ink-secondary"] } : undefined}
        >
          {title}
        </Text>
      </View>
      {/* perforation */}
      <View
        style={{
          width: 0,
          borderLeftWidth: 1.5,
          borderStyle: "dashed",
          borderColor: palette["line-strong"],
          marginVertical: 12,
        }}
      />
      <View style={{ width: 72, alignItems: "center", justifyContent: "center" }}>
        {right ?? <Text variant="display-m">{emoji ?? "✦"}</Text>}
      </View>
      <View style={[notch, { top: -10 }]} />
      <View style={[notch, { bottom: -10 }]} />
      {done ? (
        <Animated.View
          entering={ZoomIn.springify().damping(11).stiffness(200)}
          pointerEvents="none"
          style={{
            position: "absolute",
            right: 84,
            top: 10,
            transform: [{ rotate: "-8deg" }],
            borderWidth: 2,
            borderColor: palette["green-deep"],
            borderRadius: radius.sm,
            paddingHorizontal: 8,
            paddingVertical: 2,
          }}
        >
          <Text variant="label" color="green-deep">
            Done · {doneOn}
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
}
