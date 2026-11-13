import { Modal, Pressable, ScrollView, useWindowDimensions, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeSubscription } from "@/design-system/theme/ThemeProvider";
import { Button } from "./Button";
import { fadeIn, pop } from "./motion";
import { Text } from "./Text";
import { layout, lift, palette, radius, space } from "./tokens";

type Props = {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Centered confirmation (DESIGN §7.2 Modal). Used only for confirmations. */
export function ConfirmModal({ open, title, body, confirmLabel, destructive, loading, onConfirm, onCancel }: Props) {
  useThemeSubscription();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const top = Math.max(insets.top, space[5]);
  const bottom = Math.max(insets.bottom, space[5]);
  return (
    <Modal transparent visible={open} onRequestClose={onCancel} animationType="none" statusBarTranslucent>
      <Animated.View
        entering={fadeIn}
        style={{
          flex: 1,
          backgroundColor: palette.scrim,
          justifyContent: "center",
          paddingHorizontal: layout.gutter,
          paddingTop: top,
          paddingBottom: bottom,
        }}
      >
        <Pressable accessibilityLabel="Cancel" style={{ position: "absolute", inset: 0 }} onPress={onCancel} />
        <Animated.View
          entering={pop()}
          accessibilityViewIsModal
          style={{
            backgroundColor: palette.paper,
            borderRadius: radius.xl,
            maxHeight: height - top - bottom,
            maxWidth: 420,
            width: "100%",
            alignSelf: "center",
            ...lift[2],
          }}
        >
          <ScrollView
            style={{ flexGrow: 0 }}
            contentContainerStyle={{ padding: space[6], gap: space[4] }}
            keyboardShouldPersistTaps="handled"
          >
            <Text variant="display-m">{title}</Text>
            <Text variant="body" color="ink-secondary">
              {body}
            </Text>
            <View className="gap-3 pt-2">
              <Button
                fullWidth
                variant={destructive ? "destructive" : "primary"}
                label={confirmLabel}
                loading={loading}
                onPress={onConfirm}
              />
              <Button fullWidth variant="quiet" label="Not now" onPress={onCancel} />
            </View>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
