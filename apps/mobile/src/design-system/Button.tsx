import type { ComponentType, ReactNode } from "react";
import { View, type ViewStyle } from "react-native";
import { useThemeSubscription } from "@/design-system/theme/ThemeProvider";
import { Dots } from "./Dots";
import type { IconProps } from "./Icon";
import { PressableScale } from "./PressableScale";
import { Text } from "./Text";
import { recipes } from "./theme/recipes";
import { type ColorToken, type Family, palette, space, stroke } from "./tokens";

type Variant = "primary" | "secondary" | "quiet" | "accent" | "destructive";
type Size = "lg" | "md";

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  /** accent variant only */
  family?: Family;
  icon?: ComponentType<IconProps>;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  accessibilityHint?: string;
  trailing?: ReactNode;
};

/** DESIGN §7.2. Looks come from `recipes.button` (theme/recipes.ts). Only one `primary` per screen. */
export function Button({
  label,
  onPress,
  variant = "primary",
  size = "lg",
  family = "butter",
  icon: Icon,
  loading,
  disabled,
  fullWidth,
  accessibilityHint,
  trailing,
}: ButtonProps) {
  useThemeSubscription();
  const look = recipes.button(variant, family, size);
  const fgToken = look.fg as ColorToken;

  const style: ViewStyle = {
    minHeight: look.height,
    paddingVertical: space[3],
    paddingHorizontal: look.paddingHorizontal,
    borderRadius: look.radius,
    backgroundColor: look.bg,
    borderWidth: look.border ? stroke.regular : 0,
    borderColor: look.border,
    alignSelf: fullWidth ? "stretch" : "flex-start",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <PressableScale
      onPress={loading ? undefined : onPress}
      disabled={disabled || loading}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled || !!loading, busy: !!loading }}
      style={style}
    >
      {loading ? (
        <Dots color={fgToken} />
      ) : (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: space[2],
            maxWidth: "100%",
          }}
        >
          {Icon ? <Icon color={palette[fgToken]} size={20} /> : null}
          <Text variant="button" color={fgToken} align="center" style={{ flexShrink: 1 }}>
            {label}
          </Text>
          {trailing}
        </View>
      )}
    </PressableScale>
  );
}
