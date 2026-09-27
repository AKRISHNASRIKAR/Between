import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from "react-native";
import { type ColorToken, palette, type TypeVariant, type as typeScale } from "./tokens";

export type TextProps = RNTextProps & {
  variant?: TypeVariant;
  color?: ColorToken;
  align?: TextStyle["textAlign"];
};

/** The only way to render text (DESIGN §3). Never set font properties directly. */
export function Text({ variant = "body", color = "ink", align, style, children, ...rest }: TextProps) {
  const t = typeScale[variant];
  const base: TextStyle = {
    fontFamily: t.fontFamily,
    fontSize: t.fontSize,
    lineHeight: t.lineHeight,
    letterSpacing: t.letterSpacing,
    color: palette[color],
    textAlign: align,
    ...("uppercase" in t && t.uppercase ? { textTransform: "uppercase" } : null),
    ...("tabular" in t && t.tabular ? { fontVariant: ["tabular-nums"] } : null),
  };
  return (
    <RNText maxFontSizeMultiplier={t.maxScale} style={[base, style]} {...rest}>
      {children}
    </RNText>
  );
}
