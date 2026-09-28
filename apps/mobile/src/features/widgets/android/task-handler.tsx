import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import { api, unwrap } from "@/lib/api";
import { loadSnapshot, saveSnapshot } from "./snapshot-store";
import { UsWidget } from "./UsWidget";

/**
 * Fetch a fresh snapshot with the signed-in session. The widget updates every 30 minutes on its
 * own (updatePeriodMillis), so notes and vibes reach it even while the app is closed.
 */
async function fresh() {
  try {
    const me = await unwrap(api.me.$get());
    if (!me.space) return null;
    const s = await unwrap(api.spaces[":sid"].widget.$get({ param: { sid: me.space.id } }));
    await saveSnapshot(s);
    return s;
  } catch {
    return undefined; // offline or signed out: fall back to what we had
  }
}

/** Runs headless whenever Android asks the widget to draw (added, periodic update, resized). */
export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  if (props.widgetInfo.widgetName !== "Us") return;
  switch (props.widgetAction) {
    case "WIDGET_ADDED":
    case "WIDGET_UPDATE":
    case "WIDGET_RESIZED": {
      // null = signed in without a space (show nothing personal); undefined = unreachable (use the last one).
      const latest = await fresh();
      const snapshot = latest === undefined ? await loadSnapshot() : latest;
      props.renderWidget(<UsWidget snapshot={snapshot} width={props.widgetInfo.width} />);
      break;
    }
    default:
      break;
  }
}
