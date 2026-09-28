# Home-screen widgets: one server snapshot, two native renderers

Widgets on iOS and Android render one `WidgetSnapshot` built by the API (`GET /spaces/:sid/widget`), pushed by the app, and, on Android, re-fetched by the widget itself. iOS uses Expo's `expo-widgets` (SwiftUI via `@expo/ui`). Android uses `react-native-android-widget`, because `expo-widgets`' Android support is still non-functional stub code in SDK 57.

The snapshot is deliberately narrower than the app: note counts instead of text, the partner's Vibe only when shared, and no moods at all on lock-screen sizes, because a widget is readable by anyone holding the phone.

## Considered options

- **Compute the snapshot on the device from the query cache.** No new endpoint, but the Android widget couldn't refresh itself while the app is closed, and the privacy trimming would live in two places.
- **Hand-written native widgets (Swift + Kotlin/Glance) via custom config plugins.** Full control, but two more languages to maintain for one small surface, and it goes against CNG (`ios/`/`android/` are generated).
- **Wait for SDK 58's Android support in `expo-widgets`.** Would leave Android without widgets for now. The chosen split keeps that migration small (only `publish.android.tsx`, `android/` and the plugin entry change).

## Consequences

- The iOS widget only updates when the app publishes, so a note that arrives while the app is closed waits for the next open. The follow-up is a silent push plus a background task.
- Widget code on iOS can't import anything, so colours and all derived text are passed in as props (`features/widgets/props.ts`).
- `package.json` `main` points to `index.ts`, so the Android task handler is registered even in a headless JS start.
