import type { ReactNode } from "react";
import { View } from "react-native";
import { palette, radius, Text } from "@/design-system";
import { useThemeSubscription } from "@/design-system/theme/ThemeProvider";

export function PairingCard({ children, tone = "purple" }: { children: ReactNode; tone?: "purple" | "pink" }) {
  useThemeSubscription();
  return (
    <View
      style={{
        backgroundColor: tone === "purple" ? palette["action-soft"] : palette.sunken,
        borderRadius: radius.xl,
        padding: 20,
        gap: 18,
      }}
    >
      {children}
    </View>
  );
}

export function PairingDivider() {
  useThemeSubscription();
  return (
    <View style={{ alignItems: "center", marginVertical: -10, zIndex: 1 }}>
      <View
        style={{
          backgroundColor: palette.canvas,
          borderRadius: radius.pill,
          paddingHorizontal: 16,
          paddingVertical: 8,
        }}
      >
        <Text variant="label" color="ink-secondary">
          or
        </Text>
      </View>
    </View>
  );
}
