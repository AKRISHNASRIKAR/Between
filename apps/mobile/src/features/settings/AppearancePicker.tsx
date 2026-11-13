import { View } from "react-native";
import {
  Check,
  haptics,
  PressableScale,
  palette,
  radius,
  Segmented,
  space,
  Text,
  THEMES,
  useTheme,
} from "@/design-system";
import { COLOR_THEMES } from "@/design-system/theme/themes";

/** Colors and brightness are separate personal choices; each palette previews the current mode. */
export function AppearancePicker() {
  const theme = useTheme();
  return (
    <View style={{ paddingVertical: space[4], gap: space[5] }}>
      <View style={{ gap: space[2] }}>
        <Text variant="body-sm-strong">Display</Text>
        <Segmented value={theme.preference} options={theme.options} onChange={theme.setPreference} />
        <Text variant="caption" color="ink-secondary">
          System follows your phone’s light or dark appearance.
        </Text>
      </View>
      <View style={{ gap: space[3] }}>
        <Text variant="body-sm-strong">Colors</Text>
        <View accessibilityRole="radiogroup" style={{ flexDirection: "row", flexWrap: "wrap", gap: space[3] }}>
          {COLOR_THEMES.map((option) => {
            const selected = theme.colorTheme === option.id;
            const preview = THEMES[option[theme.mode]];
            return (
              <PressableScale
                key={option.id}
                accessibilityRole="radio"
                accessibilityLabel={option.label}
                accessibilityHint={option.description}
                accessibilityState={{ selected, checked: selected }}
                onPress={() => {
                  if (!selected) {
                    haptics.tick();
                    theme.setColorTheme(option.id);
                  }
                }}
                style={{
                  flexGrow: 1,
                  flexBasis: "45%",
                  minWidth: 116,
                  padding: space[3],
                  gap: space[3],
                  borderWidth: 2,
                  borderColor: selected ? palette.action : palette.line,
                  borderRadius: radius.md,
                  borderCurve: "continuous",
                  backgroundColor: palette.canvas,
                }}
              >
                <View
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  style={{
                    height: 88,
                    backgroundColor: preview.foundation.canvas,
                    borderRadius: radius.sm,
                    borderCurve: "continuous",
                    borderWidth: 1,
                    borderColor: preview.foundation.line,
                    padding: space[2],
                    gap: space[2],
                  }}
                >
                  <View style={{ flexDirection: "row", gap: space[1] }}>
                    <View
                      style={{
                        width: 18,
                        height: 6,
                        borderRadius: radius.pill,
                        backgroundColor: preview.interaction.action,
                      }}
                    />
                    <View
                      style={{
                        width: 12,
                        height: 6,
                        borderRadius: radius.pill,
                        backgroundColor: preview.interaction.highlight,
                      }}
                    />
                  </View>
                  <View
                    style={{
                      flex: 1,
                      borderRadius: radius.paper,
                      backgroundColor: preview.foundation.paper,
                      padding: space[2],
                      justifyContent: "space-between",
                    }}
                  >
                    <View
                      style={{
                        height: 4,
                        width: "65%",
                        borderRadius: radius.pill,
                        backgroundColor: preview.foundation.ink,
                      }}
                    />
                    <View
                      style={{
                        height: 4,
                        width: "85%",
                        borderRadius: radius.pill,
                        backgroundColor: preview.foundation["ink-secondary"],
                      }}
                    />
                  </View>
                  <View
                    style={{ height: 14, borderRadius: radius.pill, backgroundColor: preview.interaction.action }}
                  />
                </View>
                <View style={{ flexDirection: "row", alignItems: "flex-start", gap: space[2] }}>
                  <View style={{ flex: 1, gap: space[1] }}>
                    <Text variant="body-sm-strong">{option.label}</Text>
                    <Text variant="caption" color="ink-secondary">
                      {option.description}
                    </Text>
                  </View>
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: radius.pill,
                      borderWidth: 1,
                      borderColor: selected ? palette.action : palette["line-strong"],
                      backgroundColor: selected ? palette.action : palette.paper,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {selected ? <Check size={12} color={palette["on-action"]} weight="bold" /> : null}
                  </View>
                </View>
              </PressableScale>
            );
          })}
        </View>
        <Text variant="caption" color="ink-secondary">
          Just for this phone. Your partner can choose their own colors.
        </Text>
      </View>
    </View>
  );
}
