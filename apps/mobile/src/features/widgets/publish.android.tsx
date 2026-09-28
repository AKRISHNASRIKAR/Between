import type { WidgetSnapshot } from "@lovenotes/contracts";
import { requestWidgetUpdate } from "react-native-android-widget";
import { saveSnapshot } from "./android/snapshot-store";
import { UsWidget } from "./android/UsWidget";

/** Redraw every "Us" widget on the home screen, and remember the snapshot for the widget's own updates. */
export async function publishWidgets(snapshot: WidgetSnapshot | null): Promise<void> {
  await saveSnapshot(snapshot);
  await requestWidgetUpdate({
    widgetName: "Us",
    renderWidget: (info) => <UsWidget snapshot={snapshot} width={info.width} />,
  });
}
