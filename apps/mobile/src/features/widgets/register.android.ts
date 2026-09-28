import { registerWidgetTaskHandler } from "react-native-android-widget";
import { widgetTaskHandler } from "./android/task-handler";

/** Android draws widgets by running this handler in a headless JS task. */
export function registerWidgets() {
  registerWidgetTaskHandler(widgetTaskHandler);
}
