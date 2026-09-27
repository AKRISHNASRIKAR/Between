import { router } from "expo-router";
import { ArrowLeft, PressableScale, palette } from "@/design-system";

/** Round back affordance used on pushed screens (DESIGN §7.2 Navigation header). */
export function BackButton({ onPress, label = "Back" }: { onPress?: () => void; label?: string }) {
  return (
    <PressableScale
      accessibilityLabel={label}
      // If history was cleared (e.g. a guard flipped after hatching), go home instead of doing nothing.
      onPress={onPress ?? (() => (router.canGoBack() ? router.back() : router.replace("/")))}
      hitSlop={8}
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: palette.sunken,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ArrowLeft size={22} color={palette.ink} weight="bold" />
    </PressableScale>
  );
}
