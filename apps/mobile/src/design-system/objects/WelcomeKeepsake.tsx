import { View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { Text } from "../Text";
import { useThemeSubscription } from "../theme/ThemeProvider";
import { lift, palette, radius, space } from "../tokens";

/** A small postcard and handwritten note: original artwork for a shared keepsake. */
export function WelcomeKeepsake({ width }: { width: number }) {
  useThemeSubscription();
  const height = width * 0.7;
  return (
    <View
      accessible
      accessibilityLabel="A postcard tucked behind a handwritten note: Saved you the last cookie."
      style={{ width, height }}
    >
      <View
        style={{
          position: "absolute",
          left: width * 0.05,
          top: height * 0.04,
          width: width * 0.67,
          height: height * 0.77,
          backgroundColor: palette.paper,
          borderRadius: radius.paper,
          padding: space[2],
          transform: [{ rotate: "-5deg" }],
          ...lift[1],
        }}
      >
        <View style={{ flex: 1, overflow: "hidden", borderRadius: radius.paper }}>
          <Svg width="100%" height="100%" viewBox="0 0 220 150" preserveAspectRatio="xMidYMid slice">
            <Rect width={220} height={150} fill={palette.highlight} />
            <Circle cx={165} cy={38} r={18} fill={palette.paper} />
            <Path d="M0 150V104L60 50L131 121L175 85L220 128V150Z" fill={palette.action} />
            <Path d="M0 150V137L80 98L150 144L220 112V150Z" fill={palette["action-soft"]} />
          </Svg>
        </View>
      </View>
      <View
        style={{
          position: "absolute",
          right: width * 0.02,
          bottom: height * 0.02,
          width: width * 0.55,
          minHeight: height * 0.58,
          backgroundColor: palette.paper,
          padding: space[4],
          borderRadius: radius.paper,
          borderWidth: 1,
          borderColor: palette.line,
          gap: space[3],
          justifyContent: "center",
          transform: [{ rotate: "3deg" }],
          ...lift[1],
        }}
      >
        <View
          style={{
            position: "absolute",
            alignSelf: "center",
            top: -space[2],
            width: space[12],
            height: space[4],
            backgroundColor: palette.highlight,
            opacity: 0.85,
            transform: [{ rotate: "-4deg" }],
          }}
        />
        <Text variant="hand-m" allowFontScaling={false}>
          Saved you the last cookie.
        </Text>
        <Text variant="caption" color="ink-secondary" allowFontScaling={false}>
          a little note from them
        </Text>
      </View>
    </View>
  );
}
