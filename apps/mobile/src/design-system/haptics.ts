import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

/** Semantic haptics (DESIGN §10.4). Never call expo-haptics directly elsewhere. */
const run = (fn: () => Promise<void>) => {
  if (Platform.OS === "web") return;
  fn().catch(() => {});
};

export const haptics = {
  tick: () => run(() => Haptics.selectionAsync()),
  tap: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  thud: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  stamp: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),
  yay: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  oops: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
};
