import type { WidgetSnapshot } from "@lovenotes/contracts";

/** Web and other platforms have no home-screen widgets. See publish.ios.ts / publish.android.tsx. */
export async function publishWidgets(_snapshot: WidgetSnapshot | null): Promise<void> {}
