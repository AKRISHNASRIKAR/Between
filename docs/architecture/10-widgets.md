# 10. Home-screen widgets

One widget, **"Us"** (shown as *Love Notes* in the widget gallery), on both platforms. It shows the Pet, today's two Vibes, and the one thing worth tapping into: notes waiting, a Reveal ready, today's question, or just how the Pet feels. Tapping opens that screen.

| Size | iOS family | Android | Shows |
|---|---|---|---|
| Small | `systemSmall` | ~2×2 | Pet picture, name, focus line, pet line |
| Medium | `systemMedium` | ~4×2 (resize wider) | Plus *You* and your partner's Vibe (or "not shared yet") |
| Lock screen | `accessoryRectangular`, `accessoryInline` | — | Pet name and focus line only, **never a mood** |

## The shape of it

```mermaid
flowchart LR
  subgraph API
    W["GET /spaces/:sid/widget<br/>widget module"] --> R["pet · members · vibes · notes · quizzes<br/>(their public reads)"]
  end
  subgraph App["Expo app"]
    S["useWidgetSync()"] -->|fetch| W
    RT["realtime events"] -->|invalidate| S
    BG["app → background"] -->|refetch| S
    S --> P["publishWidgets(snapshot)"]
  end
  P -->|iOS: UsWidget.updateSnapshot(props)| IOS["WidgetKit extension<br/>(expo-widgets, SwiftUI via @expo/ui)"]
  P -->|Android: requestWidgetUpdate + cache| AND["AppWidget<br/>(react-native-android-widget)"]
  AND -->|every 30 min, headless| TH["widgetTaskHandler → fetch /widget<br/>(falls back to cached snapshot)"]
  TH --> W
```

### 1. One snapshot (`packages/contracts/src/widget.ts`)

`WidgetSnapshot` is small, viewer-specific and **privacy-trimmed**: widgets live on the home and lock screen where anyone can glance at them.

- Notes appear as a **count**, never their text.
- The partner's Vibe appears only if they **shared** it. A private Vibe is indistinguishable from none, exactly as in the app ([ADR 0004](../adr/0004-private-vibes-have-no-read-path.md)).
- Lock-screen sizes never show a mood at all.
- `widgetFocus(snapshot)` decides the focus line and deep link in one place, so iOS and Android agree: notes → Reveal ready → today's question → "how are you?" → the Pet.

### 2. API (`apps/api/src/modules/widget`)

`GET /v1/spaces/:sid/widget` sits behind the same membership gate as everything else. It composes only other modules' public reads (`petView`, `getVibe`, `countWaitingNotes`, `getDaily`), so it can never show more than the app does. It's covered by the authz matrix and `test/widget.test.ts`.

### 3. App side (`apps/mobile/src/features/widgets`)

```
widgets/
  useWidgetSync.ts     fetch + publish; refetch on realtime events and on backgrounding; null on sign-out
  props.ts             snapshot → widget props (focus line, deep link, pet art, colours from tokens)
  publish.ts           no-op (web)
  publish.ios.ts       copy pet art into the App Group dir, UsWidget.updateSnapshot(props)
  publish.android.tsx  cache snapshot, requestWidgetUpdate("Us")
  ios/UsWidget.tsx     the SwiftUI widget ('widget' directive, @expo/ui components)
  android/UsWidget.tsx the Android widget (FlexWidget / TextWidget / ImageWidget)
  android/task-handler.tsx  headless redraws: added, resized, 30-min update
  android/snapshot-store.ts last snapshot in SQLite kv
  register(.android).ts     registers the Android task handler from the app entry (index.ts)
```

- **iOS** widgets run in an isolated JavaScript runtime: no imports, hooks, state or network. So the app passes *everything* in props, including the colours, which come from design tokens in `props.ts`. The widget file itself holds no hex values. The iOS widget only changes when the app publishes a snapshot.
- **Android** widgets are drawn by running `widgetTaskHandler` headlessly. Besides the app's pushes, Android asks for an update every 30 minutes (`updatePeriodMillis`). The handler fetches a fresh snapshot with the saved session, so notes and vibes reach the widget while the app is closed. When offline it redraws from the cached snapshot.
- **Pet pictures:** widgets can't run the app's animated SVG pet, so `scripts/make-icon.ts` renders three PNGs from the same paths (awake, sleepy, egg) into `assets/widget/`. iOS copies them into the shared App Group directory (`widgetsDirectory`); Android bundles them.

## When it refreshes

| Trigger | iOS | Android |
|---|---|---|
| Something changes while the app is open (any realtime event) | ✓ | ✓ |
| The app goes to the background | ✓ | ✓ |
| Every 30 minutes, app closed | — | ✓ (fetches itself) |
| Sign-out, or leaving the space | Wiped (signed-out card) | Wiped |

**Known gap (iOS):** while the app is closed, the iOS widget keeps its last snapshot, so a note that arrives then shows up after the next app open. The planned fix is to have the API send a silent background push (`content-available`) alongside the visible one, and let a background notification task republish the snapshot. The pieces are in place (push transport, `publishWidgets`); it needs `expo-notifications`' background task and the remote-notification background mode.

## Native configuration (`app.json`)

- `expo-widgets`: App Group `group.app.lovenotes.mobile`, widget `Us` with the four families above. The config plugin creates the `ExpoWidgetsTarget` extension and the entitlements, so nothing in `ios/` is edited by hand.
- `react-native-android-widget`: widget `Us`, min 110dp, 2×2 cells, resizable both ways, 30-minute updates.
- `package.json` `main` is `index.ts`, which loads `expo-router/entry` and registers the Android task handler, so it exists even when Android starts JS only to draw a widget.

## Why two libraries

See [ADR 0009](../adr/0009-widgets-snapshot-and-two-native-renderers.md). In short: `expo-widgets` is Expo's official iOS path (SwiftUI from JSX, App Groups handled). Its Android side is still stub code in SDK 57 (`enableAndroid` is opt-in and not functional), so Android uses the established `react-native-android-widget`. Both render the same `WidgetSnapshot`. When Expo ships Android widgets (planned for SDK 58), only `publish.android.tsx`, `android/` and the plugin entry change.
