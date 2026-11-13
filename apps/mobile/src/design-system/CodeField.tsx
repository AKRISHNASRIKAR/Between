import { useEffect, useRef, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import { useThemeSubscription } from "@/design-system/theme/ThemeProvider";
import { haptics } from "./haptics";
import { Text } from "./Text";
import { fonts, palette, radius, stroke } from "./tokens";

type Props = {
  label: string;
  length: number;
  value: string;
  onChange: (v: string) => void;
  /** Insert a visual dash after this many characters (e.g. 4 for XXXX-XXXX). */
  groupAt?: number;
  error?: string | null;
  keyboard?: "number-pad" | "default";
  alphabet?: RegExp;
  autoFocus?: boolean;
  editable?: boolean;
  onComplete?: (v: string) => void;
};

/** Segmented code input (DESIGN §7.2). Pasting auto-fills; shakes on error. */
export function CodeField({
  label,
  length,
  value,
  onChange,
  groupAt,
  error,
  keyboard = "default",
  alphabet = /[0-9A-Z]/,
  autoFocus,
  editable = true,
  onComplete,
}: Props) {
  useThemeSubscription();
  const input = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  useEffect(() => {
    if (!error) return;
    haptics.oops();
    shake.value = withSequence(...[6, -6, 6, -6, 6, 0].map((x) => withTiming(x, { duration: 50 })));
  }, [error, shake]);

  const handle = (raw: string) => {
    const clean = raw
      .toUpperCase()
      .split("")
      .filter((ch) => alphabet.test(ch))
      .join("")
      .slice(0, length);
    onChange(clean);
    if (clean.length === length) onComplete?.(clean);
  };

  const cells = Array.from({ length }, (_, i) => value[i] ?? "");
  const activeIndex = Math.min(value.length, length - 1);

  return (
    <View className="gap-2">
      <Text variant="label" color="ink-secondary">
        {label}
      </Text>
      <Pressable
        onPress={() => input.current?.focus()}
        disabled={!editable}
        accessibilityLabel={label}
        accessibilityHint={error ?? undefined}
      >
        <Animated.View
          style={[{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, shakeStyle]}
        >
          {cells.map((ch, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: cells are positional slots of a fixed-length code
            <View key={i} style={{ flex: 1, flexDirection: "row", alignItems: "center", marginLeft: i ? 3 : 0 }}>
              {groupAt && i === groupAt ? (
                <Text variant="display-m" color="ink-tertiary" style={{ marginHorizontal: 4 }}>
                  –
                </Text>
              ) : null}
              <View
                style={{
                  flex: 1,
                  minWidth: 0,
                  height: 52,
                  borderRadius: radius.sm,
                  borderWidth: stroke.regular,
                  borderColor: error
                    ? palette["tomato-deep"]
                    : focused && i === activeIndex
                      ? palette.action
                      : palette["line-strong"],
                  backgroundColor: palette.paper,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text variant="display-m" style={{ fontFamily: fonts.display600 }}>
                  {ch}
                </Text>
              </View>
            </View>
          ))}
        </Animated.View>
      </Pressable>
      <TextInput
        ref={input}
        editable={editable}
        accessibilityLabel={label}
        value={value}
        onChangeText={handle}
        autoFocus={autoFocus}
        autoCapitalize="characters"
        autoCorrect={false}
        keyboardType={keyboard}
        textContentType={keyboard === "number-pad" ? "oneTimeCode" : "none"}
        autoComplete={keyboard === "number-pad" ? "one-time-code" : "off"}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        maxLength={length + 2}
        caretHidden
        style={{ position: "absolute", opacity: 0, height: 1, width: 1 }}
      />
      {error ? (
        <Text variant="caption" color="tomato-deep" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
