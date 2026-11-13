import { View } from "react-native";
import { useThemeSubscription } from "@/design-system/theme/ThemeProvider";
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
 * Completion stays in the personal theme and dates remain in normal text flow.
 */
export function FutureTicket({ title, emoji, category, doneOn, right }: Props) {
  useThemeSubscription();
  const done = !!doneOn;
  const bg = done ? palette["action-soft"] : palette.paper;
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
        borderWidth: 1,
        borderColor: palette.line,
        borderRadius: radius.lg,
        borderCurve: "continuous",
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
        {doneOn ? (
          <Text variant="caption" color="action">
            Made it happen · {doneOn}
          </Text>
        ) : null}
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
      <View style={[notch, { top: undefined, bottom: -10, marginTop: 0 }]} />
    </View>
  );
}
