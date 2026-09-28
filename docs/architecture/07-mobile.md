# 7. Mobile (`apps/mobile`)

Expo SDK 57 (React Native 0.86, New Architecture) with Expo Router, NativeWind, Reanimated 4, TanStack Query and expo-sqlite. One codebase for iOS and Android; the web build is a dev preview only.

```
src/
  app/              routes only (Expo Router). Thin: read hooks, compose components
  features/<f>/     one folder per feature: hooks.ts (queries/mutations) + feature components
  design-system/    tokens, primitives, content objects, illustrations, motion, haptics
  components/       app-level chrome (tab bar, back button, dev button)
  lib/              platform plumbing: api client, auth/session, query cache, realtime, push, storage
```

## Layers and what may import what

```
app/ (screens) → features/ → design-system/
       ↘            ↘
        lib/  ←──────┘       design-system/ imports nothing from features/ or lib/
```

- **Screens** stay thin: they read hooks and lay out components.
- **Features** own their server state (`hooks.ts`) and their components (`PetStage`, `QuizPlay`, `NoticeHost`, …).
- **The design system** is presentational and dumb. `NoticeCard` takes a title and a pillar; it doesn't know about realtime.
- **Only `design-system/tokens.ts` has raw values.** `scripts/check-design-tokens.ts` fails the lint on hex colours, `fontSize`/`fontFamily` or off-scale spacing anywhere else ([DESIGN.md §13](../../DESIGN.md)).

## Routing and flow guards

`app/_layout.tsx` computes one `FlowState` from the session and `/me`:

```
loading → signed-out → needs-name → no-space → waiting (for partner) → naming (the pet) → ready
```

Each group of screens sits in a `<Stack.Protected guard={state === …}>`, so a user can never land on a screen that doesn't fit their state. Deep links that arrive before the state is known (a cold start from a push or an invite link) are held and restored once `ready` (`restorablePath`).

## Server state

- **Typed client.** `lib/api.ts` is Hono's `hc<AppType>`. Paths, params, bodies and responses are typed from the API's own routes, so a server change that breaks the app fails `tsc`.
- **`unwrap()`** turns responses into data or a typed `ApiError` (code, status, message, fields). `humanError()` gives UI copy.
- **TanStack Query** holds all server state: `offlineFirst`, 30 seconds stale, no retries on 4xx. The cache is **persisted to SQLite** (`lib/kv.ts` → expo-sqlite kv-store), so every screen opens instantly with the last known data. Bump `CACHE_BUSTER` when cached shapes change.
- **Query keys** are scoped by space: `["space", sid, "notes", …]`, `["space", sid, "pet", "timeline"]`. So one invalidation clears a feature, and signing out (`queryClient.clear()` + `persister.removeClient()`) wipes everything.
- **Mutations** create ids on the device (`lib/ids.ts`), update caches optimistically, and roll back on error with a toast.

## Realtime

`lib/realtime.ts` holds one WebSocket per signed-in app. It authenticates with the session cookie as the first message, pings every 25 seconds, and reconnects with jittered backoff. It stops for good on 4401/4404.

`features/space/realtime-sync.tsx` (`RealtimeProvider`) routes events into the cache:

| Event | Effect |
|---|---|
| `pet.updated` | Write the Pet into `me`; refresh the Pet timeline; trigger the partner-care animation |
| `note.*`, `journal.changed`, `quiz.updated`, `future.changed`, `mood.*` | Invalidate that feature's keys |
| `space.*` | Refetch `me` (joins, leaving, renames) |
| `presence`, `hello` | Who is online (Today and the Pet stage show when your partner is here) |
| (reconnect) | Invalidate everything, since events may have been missed |

`notice` events are handled separately by `NoticeHost` ([Notifications](05-notifications.md)).

## Features at a glance

| Folder | Screens | Notes |
|---|---|---|
| `space` | welcome, sign-in, verify, your-name, start/create/join, waiting, hatch, settings | Flow state, `me`, invites, realtime provider |
| `pet` | pet room | `PetStage` (tap/stroke care with haptics), `WellbeingCard`, `PetTimeline` |
| `vibe` | Today card, vibes calendar | Check-in sheet; private/shared toggle |
| `notes` | notes wall, new note, note | Envelope-open moment, reactions |
| `quizzes` | know, quiz, daily | Play → wait → Reveal; guesses per choice question |
| `journal` | remember, new page, page | Photo picker + upload pipeline (`lib/media-upload.ts`) |
| `future` | future | Tickets, stamp to complete |
| `notices` | — | `NoticeHost`: in-app themed notices |
| `settings` | settings | Notification preferences (incl. Pet updates), export, leave, delete account |
| `dev` | dev/partner, dev/gallery | Simulated partner, design-system gallery (dev builds only) |

## Push on the device

`lib/push.ts` (with a no-op `push.web.ts`):

- `registerForPush()` runs once the user is `ready`. It asks for permission, gets the Expo token (needs an EAS project id) and registers it with the API.
- `unregisterPush()` is called by `signOut()` **before** the session ends, so a shared phone stops getting the previous person's notifications.
- In the foreground the system banner is suppressed and `onForegroundPush` hands the push to `NoticeHost`.
- `useNotificationRouting` opens `data.url` when a push is tapped.
- Custom sound: `assets/sounds/chime.wav`, declared in `app.json` → `expo-notifications` → `sounds`.

## Native configuration

Everything native goes through `app.json` config plugins, so `ios/` and `android/` are generated (Continuous Native Generation) and never edited by hand. Notable settings: `expo-build-properties` → `ios.enableSceneSupport: true` (required on iOS 27), image-picker permission strings, and the notification colour and sounds. Adding a native module or sound means a new dev build (`bunx expo run:ios`).

## Tests

Pure logic sits in plain `.ts` files so Bun can test it without React Native: `features/space/flow.ts` (flow state, deep-link restore) and `features/pet/timeline.ts` (grouping care). UI is verified on the simulator.
