import type { ComponentType, ReactNode } from "react";
import { View, type ViewStyle } from "react-native";
import { Dots } from "./Dots";
import type { IconProps } from "./Icon";
import { PressableScale } from "./PressableScale";
import { Text } from "./Text";
import { type ColorToken, type Family, family as fam, palette, radius, stroke } from "./tokens";

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

const HEIGHT: Record<Size, number> = { lg: 56, md: 48 };

/** DESIGN §7.2. Only one `primary` per screen. */
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
  const f = fam(family);
  const look: { bg: string; fg: ColorToken | string; border?: string; r: number } = {
    primary: { bg: palette.ink, fg: "on-ink", r: radius.md },
    secondary: { bg: palette.paper, fg: "ink", border: palette.ink, r: radius.md },
    quiet: { bg: "transparent", fg: "ink", r: radius.md },
    accent: { bg: f.base, fg: family === "teal" ? "on-ink" : "ink", r: radius.pill },
    destructive: { bg: palette.paper, fg: "tomato-deep", border: palette["tomato-deep"], r: radius.md },
  }[variant];
  const fgToken = look.fg as ColorToken;

  const style: ViewStyle = {
    height: variant === "quiet" ? 44 : variant === "accent" ? 48 : HEIGHT[size],
    paddingHorizontal: variant === "quiet" ? 0 : 24,
    borderRadius: look.r,
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
      disabled={disabled}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      style={style}
    >
      {loading ? (
        <Dots color={fgToken} />
      ) : (
        <View className="flex-row items-center gap-2">
          {Icon ? <Icon color={palette[fgToken]} size={20} /> : null}
          <Text variant="button" color={fgToken} numberOfLines={1}>
            {label}
          </Text>
          {trailing}
        </View>
      )}
    </PressableScale>
  );
}
