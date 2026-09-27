import { Image } from "expo-image";
import { View } from "react-native";
import { Text } from "./Text";
import { identity, palette } from "./tokens";

type Props = {
  name: string | null;
  uri?: string | null;
  size?: 28 | 40 | 64;
  who?: "you" | "partner";
  online?: boolean;
};

/** DESIGN §7.2 Avatar with identity ring and presence dot. */
export function Avatar({ name, uri, size = 40, who, online }: Props) {
  const initial = (name?.trim()[0] ?? "·").toUpperCase();
  const ring = who ? identity[who] : "transparent";
  return (
    <View
      accessibilityLabel={name ? `${name}${online ? ", here now" : ""}` : "Avatar"}
      style={{ width: size, height: size }}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: ring,
          backgroundColor: palette.sunken,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {uri ? (
          <Image source={{ uri }} style={{ width: size, height: size }} contentFit="cover" />
        ) : (
          <Text variant={size >= 64 ? "display-m" : size >= 40 ? "heading" : "caption"} color="ink-secondary">
            {initial}
          </Text>
        )}
      </View>
      {online ? (
        <View
          style={{
            position: "absolute",
            right: -1,
            bottom: -1,
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: palette["green-base"],
            borderWidth: 2,
            borderColor: palette.paper,
          }}
        />
      ) : null}
    </View>
  );
}
