import type { Paper } from "@lovenotes/contracts";
import { View } from "react-native";
import { Text } from "../Text";
import { lift, palette, paperFill, radius, seededTilt } from "../tokens";

type Props = {
  id: string;
  body: string;
  paper: Paper;
  /** Wall = clipped preview; full = the whole note. */
  size?: "wall" | "full";
  footer?: React.ReactNode;
};

/** A paper note with a strip of tape (DESIGN §7.3). Tilt is seeded by id so it never jumps. */
export function NoteCard({ id, body, paper, size = "wall", footer }: Props) {
  const full = size === "full";
  return (
    <View style={{ transform: [{ rotate: `${seededTilt(id)}deg` }], paddingTop: 10 }}>
      <View
        style={{
          backgroundColor: paperFill[paper],
          borderRadius: radius.paper,
          padding: full ? 24 : 16,
          minHeight: full ? 280 : 140,
          gap: 12,
          justifyContent: "space-between",
          ...lift[1],
        }}
      >
        <Text variant={full ? "hand-l" : "hand-m"} numberOfLines={full ? undefined : 5}>
          {body}
        </Text>
        {footer}
      </View>
      {/* tape */}
      <View
        style={{
          position: "absolute",
          top: 0,
          alignSelf: "center",
          width: 64,
          height: 20,
          backgroundColor: palette["butter-soft"],
          opacity: 0.85,
          transform: [{ rotate: `${-seededTilt(id, 4)}deg` }],
        }}
      />
    </View>
  );
}
