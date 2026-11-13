# Between: developer testing plan

Proposal, 31 October 2026. Existing code inspected; nothing restored or added in this audit.

## What exists and what history says

- `apps/mobile/src/components/DevFab.tsx`: developer entry during waiting/pet setup/ready. Settings also links developer routes under `__DEV__`.
- `src/app/dev/partner.tsx`, `features/dev/hooks.ts`: create a partner and run notes, moods, quizzes, journal/photos, Future and pet actions through the real API.
- `src/app/dev/gallery.tsx`: actual design components, appearance preview and safelisted dev theme parameters; redirects in release builds.
- `apps/api/src/modules/dev/{dev.routes,dev.service,dev.repo}.ts`: authenticated dev routes, checked by `assertDevTools`. Server refuses `DEV_TOOLS` / fixed OTP in production (`env.ts`).
- `apps/mobile/src/lib/dev.ts`: all development builds currently skip normal email-code UX with fixed `000000`. This hides the very flow we need to evaluate.
- `apps/api/test/helpers.ts`: actual OTP/session helpers and `pairedCouple`, plus destructive `resetDb()` truncation. This is a useful integration foundation, not a safe interactive reset menu.
- `git log --all -- .../dev` contains `8be7fc2`, `622acc4`, `30911f1`, `8fe3bca`; partner utilities evolved with the app and remain present. No removed deterministic scenario catalog was identified in inspected history. Restore access/documentation where needed; do not claim to recover a missing fixture system.

Current partner actions intentionally randomize moods, answers, notes and photo colors. They are good exploratory tools but unreliable screenshot/regression fixtures. Source also derives partner scope from the other active member without marking that member as synthetic. Therefore `DEV_TOOLS=true` must never be used against a live/shared user database: it can act as the other member, not merely an isolated fake identity. Add explicit synthetic identity provenance before broadening this utility.

## Two complementary modes

**UI scenarios:** a development-only scenario provider with deterministic read models and a separate QueryClient/SQLite namespace. Render the actual screens/components but replace their data transport at a clear boundary. Mock auth is a demo state only; no real session cookie or production endpoint. Intercept writes into scenario memory; explicit reset regenerates that scenario. Never put fixtures into the real persisted cache.

**Local integration:** separate API, Postgres database, media root and console email/push. Uses real OTP, membership, services, transactions and WebSocket behavior with two seeded synthetic users. These credentials are only for that instance. API endpoints must verify development environment and fixture provenance before partner impersonation or reset. Keep ordinary authorization enabled.

Do not build a mock copy of each feature's business logic. UI fixtures provide response shapes; integration mode proves real behavior. Reuse shared contracts to prevent drift.

## Scenario catalog

| Stable scenario ID | Seed / purpose |
|---|---|
| `new-unpaired` | New account, no name/space; test both create and join intents |
| `waiting-invite` | Creator, active invite, no partner; empty and expired-code variants |
| `paired-empty` | Two named members, zero artifacts, pet disabled; first useful action |
| `active-3-days` | Three activity days, one unread note, one pending quiz, some journal content; “short streak” visual candidate only until a streak exists |
| `history-1-year` | Hundreds of notes/photos, >50 quiz sessions, long names, completed plans; pagination, archive and memory use |
| `missed-day` | Past activity, yesterday empty, today empty; proposed history/streak recovery behavior, not fabricated current production feature |
| `returning-30-days` | Genuine old artifacts and pending responses; no shameful backlog or pet punishment |
| `pet-consent` | NONE / proposal / ACTIVE unnamed / ACTIVE named / PAUSED, replaced decision IDs |
| `closed-space` | Read-only retained data, expiry boundary and deleted partner data |
| `session-expired` | Cached owned data plus auth failure; safe retry/sign-out/deep link |

Apply composable network states: initial loading, slow response, partial data, 401/404/409/429/500, failed save, offline, recovery after reconnect. Add permissions denied for photos/notifications, signed media URL expiry, duplicate request and two simultaneous partner completions. Preserve stable UUIDs and bundled images; no real names/emails/content in committed fixtures.

## Time and reset safety

Introduce a small injectable clock for domain logic and UI scenarios; default is real time. Scenarios set an absolute UTC instant plus IANA user and space zones. Test shared Daily boundaries separately from personal mood dates. Never change machine time, the user's device clock, production data timestamps or production request semantics to simulate a day. Keep HTTP endpoint validation server-authoritative.

Resets must display the active scenario and target environment. In UI mode clear only that namespace. In integration mode reset only a disposable run ID, never blanket-truncate an arbitrary configured database. CLI startup must reject a target lacking an explicit test database allowlist/run marker and refuse public production hosts. UI reset may never be served by a release build. Keep reset metadata outside actual user records.

The current audit created `between_audit_20261031`, applied real migrations and used existing API tests there. Do not copy `resetDb()` into a general-purpose app button. Integration media should also use a per-run temp directory; the existing local adapter uses `.data/media` independently of DB selection.

## Production isolation acceptance

1. UI entry points and scenario routing are compile-time `__DEV__` gated; verify a release bundle by attempting direct links, not only checking button visibility.
2. Server startup rejects dev flags in production; add tests for production-like configurations. Extend current gate to reject synthetic actions without a synthetic partner and local integration marker.
3. Mock transport has no auth secret, real session, push token registration, widget publication or fallback to live fetch. Fail closed if scenario data is missing.
4. Dev builds must display their target and disallow production API origins when impersonation/fixtures are enabled. Staging with real accounts uses normal OTP, no partner impersonation.
5. Review bundle/assets to ensure no real fixture identities or privileged credentials ship. Do not treat `__DEV__` alone as a security boundary for a remote server.
6. Feature flags hide unfinished features and default off, but do not grant authorization. Server still validates every operation; flag version belongs in scenario metadata.

## Verification layers and sequence

| Layer | Keep / add | Specific failures it should catch |
|---|---|---|
| Pure Bun | Existing contracts, flow, cache ownership, rollback, push sequencing, quiet hours; add injected-time boundaries | Asymmetric results, duplicate reward, stale callbacks, timezone boundary |
| Real Postgres HTTP | Existing 118-test suite; expand media enforcement, export >50+Daily, deletion retries, concurrent starts | Cross-space leakage, races, partial storage operations |
| Native component | Explain then select a renderer compatible with SDK57; not installed now | Resend failure, empty/error states, quiz editing, scaled text semantics |
| E2E | Explain then add small device workflow runner, e.g. Maestro after evaluation | Real OTP, invite link, note reception, shared reveal, logout ownership |
| Physical devices | iOS and Android release candidate | Push permissions/receipts, widgets, camera/gallery, background/offline, screen reader and frame timing |

Recommended first approved scope: make normal OTP selectable, add deterministic `paired-empty` / `active-3-days` / `returning-30-days` scenarios, and introduce safe reset+clock boundaries. Keep partner actions intact. Add long-history and network cases next. Do not bundle all retention features into the developer harness.

Done means two developers can select the same scenario and obtain the same content/date, tests never contact production, and a release binary cannot enter mock mode even through a deep link. Screenshot comparison supplements task completion; it is not a substitute for delivery/authorization tests.
