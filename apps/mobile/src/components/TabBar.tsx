import type { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { useEffect, useState } from "react";
import { type LayoutChangeEvent, Pressable, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BookOpenText,
  Brain,
  Envelope,
  haptics,
  layout,
  palette,
  pillar,
  SunHorizon,
  spring,
  Text,
  Ticket,
} from "@/design-system";

const TABS = {
  today: { label: "Today", Icon: SunHorizon, family: pillar.today },
  know: { label: "Know", Icon: Brain, family: pillar.know },
  notes: { label: "Notes", Icon: Envelope, family: pillar.notes },
  remember: { label: "Remember", Icon: BookOpenText, family: pillar.remember },
  future: { label: "Future", Icon: Ticket, family: pillar.future },
} as const;

type TabName = keyof typeof TABS;
export type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0];

/** DESIGN §7.2 Tabs: sunken bar, bold→fill icons, a pillar-colored dot that slides to the active tab. */
export function TabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const count = state.routes.length;
  const slot = width / count;
  const x = useSharedValue(0);
  const activeName = state.routes[state.index]?.name as TabName;

  useEffect(() => {
    x.value = withSpring(state.index * slot + slot / 2 - 3, spring.gentle);
  }, [state.index, slot, x]);

  const dot = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      accessibilityRole="tablist"
      style={{
        backgroundColor: palette.sunken,
        borderTopWidth: 1,
        borderTopColor: palette.line,
        paddingBottom: insets.bottom,
        height: layout.tabBarHeight + insets.bottom,
        flexDirection: "row",
      }}
    >
      {state.routes.map((route, i) => {
        const tab = TABS[route.name as TabName];
        if (!tab) return null;
        const focused = state.index === i;
        const color = focused ? palette.ink : palette["ink-tertiary"];
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={tab.label}
            onPress={() => {
              const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) {
                haptics.tick();
                navigation.navigate(route.name);
              }
            }}
            style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 2, paddingTop: 6 }}
          >
            <tab.Icon size={24} color={color} weight={focused ? "fill" : "bold"} />
            <Text variant="label-sm" style={{ color }} numberOfLines={1}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
      {width > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              top: layout.tabBarHeight - 10,
              left: 0,
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: palette[`${TABS[activeName]?.family ?? "sky"}-base`],
            },
            dot,
          ]}
        />
      ) : null}
    </View>
  );
}
