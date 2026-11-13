import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeSubscription } from "@/design-system/theme/ThemeProvider";
import { layout, palette, space } from "./tokens";

type Props = {
  children: ReactNode;
  scroll?: boolean;
  /** Pinned below scroll content (primary actions). */
  footer?: ReactNode;
  /** Set false when a tab bar handles the bottom inset. */
  bottomInset?: boolean;
  header?: ReactNode;
};

/** Every screen uses this: safe areas, gutter, max width, keyboard avoidance (DESIGN §4). */
export function Screen({ children, scroll = true, footer, bottomInset = true, header }: Props) {
  useThemeSubscription();
  const insets = useSafeAreaInsets();
  const pad = { paddingHorizontal: layout.gutter };
  const bottom = bottomInset ? Math.max(insets.bottom, space[4]) : space[4];
  const body = (
    <View style={[{ width: "100%", maxWidth: layout.maxContentWidth, alignSelf: "center" }]} className="flex-1">
      {children}
    </View>
  );
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1"
      style={{ paddingTop: insets.top, backgroundColor: palette.canvas }}
    >
      {header}
      {scroll ? (
        <ScrollView
          contentContainerStyle={[pad, { flexGrow: 1, paddingBottom: footer ? space[4] : bottom }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {body}
        </ScrollView>
      ) : (
        <View style={[pad, { flex: 1, paddingBottom: footer ? 0 : bottom }]}>{body}</View>
      )}
      {footer ? (
        <View
          style={[
            pad,
            {
              paddingBottom: bottom,
              paddingTop: space[3],
              width: "100%",
              maxWidth: layout.maxContentWidth + layout.gutter * 2,
              alignSelf: "center",
            },
          ]}
          className="gap-3"
        >
          {footer}
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}
