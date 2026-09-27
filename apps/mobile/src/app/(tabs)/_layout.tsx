import { Tabs } from "expo-router";
import { TabBar } from "@/components/TabBar";
import { palette } from "@/design-system";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: palette.canvas }, animation: "fade" }}
    >
      <Tabs.Screen name="today" />
      <Tabs.Screen name="know" />
      <Tabs.Screen name="notes" />
      <Tabs.Screen name="remember" />
      <Tabs.Screen name="future" />
    </Tabs>
  );
}
