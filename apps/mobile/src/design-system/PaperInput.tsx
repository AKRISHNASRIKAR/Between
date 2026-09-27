import { forwardRef } from "react";
import { Platform, TextInput, type TextInputProps } from "react-native";
import { palette, type as typeScale } from "./tokens";

/** Borderless handwriting input for writing on paper (notes). */
export const PaperInput = forwardRef<TextInput, TextInputProps>(function PaperInput({ style, ...rest }, ref) {
  const t = typeScale["hand-l"];
  return (
    <TextInput
      ref={ref}
      multiline
      placeholderTextColor={palette["ink-tertiary"]}
      maxFontSizeMultiplier={t.maxScale}
      style={[
        {
          fontFamily: t.fontFamily,
          fontSize: t.fontSize,
          lineHeight: t.lineHeight,
          color: palette.ink,
          minHeight: 200,
          textAlignVertical: "top",
          padding: 0,
          ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : null),
        },
        style,
      ]}
      {...rest}
    />
  );
});
