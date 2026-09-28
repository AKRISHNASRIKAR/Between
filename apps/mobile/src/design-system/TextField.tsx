import { forwardRef, useState } from "react";
import { Platform, TextInput, type TextInputProps, View } from "react-native";
import { Text } from "./Text";
import { fonts, palette, radius, stroke, type as typeScale } from "./tokens";

export type TextFieldProps = TextInputProps & {
  label: string;
  error?: string | null;
  help?: string;
  multiline?: boolean;
};

/** DESIGN §7.2 Input. Errors render at the field, never at the top of a form. */
export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, help, editable = true, multiline, style, onFocus, onBlur, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const borderColor = error ? palette["tomato-base"] : focused ? palette["teal-base"] : palette["line-strong"];
  return (
    <View className="gap-2">
      <Text variant="label" color="ink-secondary">
        {label}
      </Text>
      <TextInput
        ref={ref}
        editable={editable}
        multiline={multiline}
        accessibilityLabel={label}
        accessibilityHint={error ?? help}
        placeholderTextColor={palette["ink-tertiary"]}
        maxFontSizeMultiplier={typeScale.body.maxScale}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          {
            minHeight: multiline ? 120 : 52,
            paddingHorizontal: 16,
            paddingVertical: multiline ? 14 : 0,
            borderRadius: radius.sm,
            borderWidth: stroke.regular,
            borderColor,
            backgroundColor: editable ? palette.paper : palette.sunken,
            color: palette.ink,
            fontFamily: fonts.ui400,
            fontSize: typeScale.body.fontSize,
            textAlignVertical: multiline ? "top" : "center",
            // Web: our border already shows focus; drop the browser outline.
            ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : null),
          },
          style,
        ]}
        {...rest}
      />
      {error ? (
        <Text variant="caption" color="tomato-deep" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : help ? (
        <Text variant="caption" color="ink-tertiary">
          {help}
        </Text>
      ) : null}
    </View>
  );
});
