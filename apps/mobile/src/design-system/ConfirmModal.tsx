import { Modal, Pressable, View } from "react-native";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";
import { Button } from "./Button";
import { Text } from "./Text";
import { lift, palette, radius, scrim } from "./tokens";

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
  return (
    <Modal transparent visible={open} onRequestClose={onCancel} animationType="none" statusBarTranslucent>
      <Animated.View
        entering={FadeIn.duration(180)}
        style={{ flex: 1, backgroundColor: scrim, justifyContent: "center", padding: 20 }}
      >
        <Pressable accessibilityLabel="Cancel" style={{ position: "absolute", inset: 0 }} onPress={onCancel} />
        <Animated.View
          entering={ZoomIn.springify().damping(18).stiffness(180)}
          accessibilityViewIsModal
          style={{
            backgroundColor: palette.paper,
            borderRadius: radius.xl,
            padding: 24,
            gap: 16,
            maxWidth: 420,
            width: "100%",
            alignSelf: "center",
            ...lift[2],
          }}
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
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
