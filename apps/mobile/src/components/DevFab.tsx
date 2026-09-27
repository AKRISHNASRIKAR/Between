import { router, usePathname } from "expo-router";
import { lift, PressableScale, palette, radius, Text } from "@/design-system";

/**
 * Dev builds only: a small tab on the left edge that opens the simulated-partner panel from
 * any screen once you're in a space. Never rendered in release builds.
 */
export function DevFab() {
  const path = usePathname();
  if (!__DEV__ || path.startsWith("/dev")) return null;
  return (
    <PressableScale
      accessibilityLabel="Developer: simulated partner"
      onPress={() => router.push("/dev/partner")}
      hitSlop={8}
      style={{
        position: "absolute",
        left: 0,
        top: "42%",
        backgroundColor: palette["purple-soft"],
        borderTopRightRadius: radius.sm,
        borderBottomRightRadius: radius.sm,
        paddingHorizontal: 6,
        paddingVertical: 10,
        borderWidth: 1.5,
        borderLeftWidth: 0,
        borderColor: palette["purple-deep"],
        opacity: 0.9,
        ...lift[1],
      }}
    >
      <Text variant="label-sm" color="purple-deep">
        DEV
      </Text>
    </PressableScale>
  );
}
