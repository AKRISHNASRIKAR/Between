import { Image } from "expo-image";
import { View } from "react-native";
import { lift, palette, radius, seededTilt } from "../tokens";

type Props = { id: string; uri: string; width: number; aspect?: number; tilt?: boolean };

/** DESIGN §7.3 MemoryCard: photo in a paper border with two tape corners. cacheKey = media id. */
export function PhotoFrame({ id, uri, width, aspect = 4 / 3, tilt = true }: Props) {
  const inner = width - 12;
  return (
    <View style={{ width, transform: tilt ? [{ rotate: `${seededTilt(id, 2)}deg` }] : undefined }}>
      <View style={{ backgroundColor: palette.paper, borderRadius: radius.paper, padding: 6, ...lift[1] }}>
        <Image
          source={{ uri, cacheKey: id }}
          style={{ width: inner, height: inner / aspect, borderRadius: 2, backgroundColor: palette.sunken }}
          contentFit="cover"
          transition={200}
          accessibilityIgnoresInvertColors
        />
      </View>
      {[
        { top: -6, left: -8, r: -35 },
        { top: -6, right: -8, r: 35 },
      ].map((t) => (
        <View
          key={t.r}
          style={{
            position: "absolute",
            top: t.top,
            left: t.left,
            right: t.right,
            width: 36,
            height: 14,
            backgroundColor: palette["butter-soft"],
            opacity: 0.85,
            transform: [{ rotate: `${t.r}deg` }],
          }}
        />
      ))}
    </View>
  );
}
