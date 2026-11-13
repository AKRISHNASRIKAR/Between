# Between: product and engineering audit

Audit date: 31 October 2026. Scope: current working tree, including existing uncommitted changes, not just HEAD `6ecd347`. This pass changes documentation only. Recommendations are proposals, not approved implementation.

## Product judgment

Between is a private shared space for an established couple, including people living apart. Its recurring need is small, low-pressure expressions of attention: “I thought of you,” “how are you?”, and “let's remember this.” It is neither a dating marketplace nor a relationship diagnosis tool. Its strongest loop is one person leaving something meaningful and the other discovering and responding in their own time.

The core is already substantial. Preserve the two-member authorization boundary, private mood filtering, asynchronous quiz reveal, optional pet consent, shared journal model, and existing semantic theme system. The main gap is confidence: users cannot explore before authentication, work in progress is not durably protected, and the production delivery/recovery path is less complete than the visible feature set.

## Evidence and limits

Evidence labels used throughout these documents:

- **V**: exercised by a command, test or capture in this audit. Verification applies only to that scope.
- **C**: confirmed by source inspection; not exercised end to end on a phone.
- **H**: suspected risk with a specific follow-up test.
- **R**: recommendation or product hypothesis.

| Check | Result and scope |
|---|---|
| `bun run lint` | V: exit 0, 342 files, token and architecture checks; 494 configured contrast pairs across eight themes |
| `bun run typecheck` | V: all three workspaces exit 0 |
| `bun test apps/mobile/src packages/contracts/src apps/api/src` | V: 76 pass, 0 fail, 324 assertions; pure logic, not rendered components |
| API suite | V: fresh database `between_audit_20261031`, migrations succeeded; `DATABASE_URL=postgres://localhost:5432/between_audit_20261031 NODE_ENV=test bun --cwd apps/api test`: 117 pass, 1 fail across 118 tests |
| Pet-only rerun | V: 15 pass, 1 fail; same pause/resume assertion, so unresolved rather than dismissed as a one-off |
| Expo compatibility | V: `bunx expo install --check`, mobile workspace, exit 1: thirteen installed packages differ from SDK-recommended patch ranges; no packages changed |
| iOS runtime | V: existing iPhone 17 development client launched against fresh Metro on 8081; welcome and isolated AppearancePicker rendered in Ink & butter dark at 402 logical points / 1206 image pixels wide |
| Main authenticated screens | Not visually exercised in this audit. No API was listening on port 3000 at initial probe; integration tests used in-process `app.request`, not the phone network |

Captures: `../.ui-review/2026-10-31-product/welcome.png` and `appearance.png` in that folder. Appearance was opened through the development gallery, not authenticated Settings. The floating gear is an environment tools overlay, not application UI. A bundling splash appeared initially and was replaced by the app before final capture. Older design-study captures are historical evidence only. No claim of physical-device, Android, accessibility-tree, screen-reader, keyboard, gesture-latency or release-performance verification. Token contrast checks are not a full accessibility audit.

Test logs are local artifacts under `.ui-review/2026-10-31-product/`. The API tests truncate their configured database; this audit created a dedicated database instead of touching normal local data. Test media uses the existing local adapter, so database isolation alone is not the complete future test-isolation design.

## Feature inventory

“Implemented and verified” below means the named automated logic/API scope, never blanket device certification.

| Major feature | Classification | Evidence and remaining work |
|---|---|---|
| Email OTP authentication | Implemented and API-verified; mobile incomplete | `src/auth.ts`, API helpers exercise actual OTP; mobile `sign-in.tsx`, `verify.tsx`. Resend ignores API error; normal OTP screen bypassed in all `__DEV__` runs |
| Pairing, invitations, closed spaces | Implemented and API-verified | `modules/spaces`, `test/pairing.test.ts`, `test/privacy.test.ts`; mobile identity preview/copy exists. Real two-device invite and expired-session recovery untested |
| Today finite moments | Implemented and pure-logic verified | `features/home/moments.ts`, seven tests; max three, unknown data does not manufacture completion. Actual first-use/long-history render untested |
| Notes, opening, reactions | Implemented and API-verified | `modules/notes`, `test/notes.test.ts`; cache optimism/rollback source traced. Unsent editor state only in memory |
| Private/shared moods and calendar | Implemented and API-verified | `modules/vibes`, `test/moods.test.ts`; partner private moods excluded. Source uses device dates for moods and space dates for Daily; midnight/travel UI needs testing |
| Quiz packs, Daily, review, reveal | Implemented and API/logic-verified, history incomplete | `modules/quizzes`, `test/quizzes.test.ts`, `answer-view.test.ts`; server hides answers until both complete. Historical scoring rereads mutable catalog; list capped at 50 pack sessions |
| Journal, photos, masonry gallery | Implemented and local API-verified; production upload incomplete | `modules/journal`, `test/journal.test.ts`, `MemoryGallery.tsx`; source contains image failure/retry. No real R2 upload or native gallery gesture verification |
| Future plans and completion | Implemented and API-verified | `modules/future`, `test/future.test.ts`; idempotence/reward checks exist. No journey from completion to a linked memory |
| Optional shared pet | Implemented; confirmed failing check | Consent/version/concurrency tests mostly pass. Pause/resume wellbeing equality fails twice; exact mechanism below |
| Four color themes × light/dark | Implemented, migration logic and configured contrast verified | `theme/themes.ts`, `theme-preference.ts`, `AppearancePicker.tsx`. Welcome visually checked this pass; every feature/theme combination not checked |
| Haptics/reduced motion | Implemented, source inspected | `lib/preferences.ts`, `design-system/motion.ts`, root reduced-motion config; OS setting and gestures require device testing |
| Notifications and quiet hours | Implemented, local transport/quiet-hours verified; delivery incomplete | `modules/notifications`, mobile push registration tests. No receipt handling/reliable retry worker; real APNs/FCM delivery untested |
| Home-screen widgets | Implemented, snapshot logic/API verified | `features/widgets`, `test/widget.test.ts`; actual installed widget lifecycle untested this pass |
| Export / deletion / retention | Implemented but incomplete | Export/deletion API tests pass for existing cases; export omits Daily and older packs, photos expire; failed object deletions can lose retry metadata |
| Profile and space editing in Settings | Displayed values, not functional editing | `settings.tsx` renders Name/Space rows without `onPress`; do not present these as editable settings |
| Developer partner and component gallery | Implemented; source/history verified | `dev/partner.tsx`, `dev/gallery.tsx`, `modules/dev`. They were not removed. Missing fixture catalog, reset boundary and deterministic dates |
| Pre-account product exploration, guest migration | Missing | Both welcome actions route to sign-in; protected stack has no preview route |
| Durable drafts/outbox, recap, activity history, streaks | Missing | Query persistence stores successful reads, not an acknowledged delivery queue; pet bond is not a streak |

## Five highest-priority existing-feature improvements

| ID / priority | Current issue and evidence | Files and proposed targeted fix | Benefit / technical consequence |
|---|---|---|---|
| A1 / P0 | C: production S3 PUT ignores `maxBytes`; completion checks only object existence then records actual main bytes. Quota uses declared bytes without serialized reservation. No uploader/writable assertion in `completeUpload` | `apps/api/src/lib/storage.ts`, `modules/journal/media.service.ts`, `media.repo.ts`, contracts `journal.ts`: enforce server-side maximums, actual main/thumb sizes/type, write access/uploader, quota reservation under lock; reject/clean oversized objects | Protect storage cost and integrity. Bucket upload policy or post-upload quarantine/verification plus transactional accounting; no UI rebuild |
| A2 / P0 | C: object deletion errors swallowed before database rows are deleted; identifiers needed for retries disappear. “Export everything” promises more than the payload delivers | `media.service.ts`, `me.service.ts`, `privacy.service.ts`, `quizzes.repo.ts`, mobile settings: retryable deletion jobs and complete paginated versioned export with durable media archive; change copy until fulfilled | Trustworthy deletion/export. Requires job persistence, storage retries, archive access expiry and authorization tests |
| A3 / P1, before larger beta | C: note/journal/unsaved quiz edits live in React state. `offlineFirst` and successful-query persistence do not make writes durable. Journal IDs are generated inside mutation functions | `app/notes/new.tsx`, `app/journal/new.tsx`, `QuizPlay.tsx`, `features/journal/hooks.ts`, `lib/query.ts`, `media-upload.ts`: first persist scoped drafts; later stable operation IDs, explicit pending/sent/failed states and resumable outbox | Prevent lost writing and duplicate retries. Introduce a small local record lifecycle; keep server authoritative |
| A4 / P1 | C: resend ignores error and restarts cooldown. Dev mode always bypasses verification screen. Pet test fails twice | `app/verify.tsx`, `lib/dev.ts`, `apps/api/test/pet.test.ts:169`, `pet.service.ts`, `pet.view.ts`: show resend failure without false success; selectable normal-OTP dev scenario; inject/freeze clock and resolve pause invariant | Reliable entry and test confidence. Preserve existing auth service; deterministic time before changing wellbeing rules |
| A5 / P1 | C: quiz stores question IDs, view loads current question content and calls current scorer; server permits choice without a guess while UI requires both | `db/schema/quizzes.ts`, `quizzes.service.ts`, `content.repo.ts`, `packages/contracts/src/quizzes.ts`: snapshot prompts/options/content and scoring version; explicitly decide whether predictions are required and align server/UI | Stable memories and the same shared result for both devices after content updates; data migration/versioning, not a new scoring engine |

A1's same-space write gap is source-confirmed, not a demonstrated cross-space breach: membership checks already protect other spaces. Unattached upload IDs should not let a partner change another uploader's pending object state. Add hostile HTTP tests before changing it.

## Other confirmed gaps and testable risks

- **C, P1:** no `eas.json`, configured EAS project ID, updates URL/runtime policy or `expo-updates` dependency found. `app.json` has native widget/push plugins but is not proof of a working release pipeline. Old deployment docs overstate OTA readiness.
- **C, P1:** production rejects dev flags but permits console email/push and local storage. Fail startup for inappropriate production transports and missing release API URL; `lib/config.ts` otherwise falls back to a development HTTP host.
- **C, P1:** `push-transport.ts` awaits fetch without checking status/tickets/receipts. Domain transactions commit before best-effort notification/realtime publication, so a crash can lose notifications. Add durable delivery only where product guarantees require it.
- **C, P1:** no project-defined route `ErrorBoundary` exports or error-reporting integration found. Framework boundaries exist; add recovery at important writing routes and scrubbed diagnostics, not an unsupported claim that all crashes are uncaught.
- **C, P1:** Daily query key has no date; mood date recomputes only on render, without a midnight timer. No explicit TanStack native online/focus-manager bridge found. **H:** stale Today after midnight/airplane-mode/background. Test both time zones, DST, foreground refetch and reconnection before prescribing implementation.
- **C, P2:** Settings notification toggles snapshot/restore the whole prefs object without serialization. **H:** rapid edits with out-of-order responses can overwrite newer toggles. Reproduce delayed A-success/B-failure before adopting per-field rollback or a mutation scope.
- **C, P2:** failed photo uploads can only be removed/reselected; all chosen photos upload in parallel; Add photos remains available at ten. **H:** picker limit zero, repeated taps and memory pressure. Add retry, capped concurrency and a clear remaining count after reproducing.
- **C, P2:** static Settings version `1.0.0` differs from app config `0.1.0`; splash/Android notification/icon backgrounds remain original pink while default app uses ink/butter. These are release consistency tasks, not grounds for replacing the theme system.
- **C, P2:** older architecture docs still say System/Light/Candlelit and omit pet-choice. Update as part of approved implementation; this guide records current behavior.
- **H, P1:** cache removal does not guarantee photo disk-cache/widget App Group erasure. Inspect logout/account-switch and device backups; define whether app lock/encrypted local cache is required by threat model. SecureStore protects session credentials, SQLite query cache is not explicitly encrypted; backend is not end-to-end encrypted.
- **H, P1:** raw unexpected-error logging may include sensitive exception details despite omitting request bodies. Review log redaction and retention using crafted validation/storage failures.

## Pet failure interpretation

`test/pet.test.ts:169` expected 0.94 and received 0.93 on the initial full run; same test fails in isolation. `wellbeing.ts` rounds linear time-derived stats to two decimals. The fixture uses “two hours ago,” exactly near a rounding boundary, and paused timestamps are shifted on resume (`pet.service.ts`), then viewed with a fresh clock (`pet.view.ts`). Millisecond skew is a plausible explanation, not proven root cause. Freeze a shared reference instant, inspect timestamp precision in Postgres and test just either side of each boundary. Decide whether the invariant is exact at the resume instant or within the displayed rounding tolerance. Do not weaken the assertion merely to make it green.

## Design and navigation review

Preserve Ink & butter as default, Rosewater/Evergreen/Apricot as personal options, Fraunces headings, DM Sans body, Caveat decorative notes, paper surfaces and restrained illustrative objects. The welcome capture has readable hierarchy and reachable create/join actions at 402 points. Its limitation is explanatory depth: it shows a note/memory motif but no playable example or route for existing users explicitly labeled “Sign in.” Source confirms both CTAs send users to email.

Today already selects at most three real moments; do not add a second competing daily checklist. Keep all five tabs for the first corrective release. Evaluate a four-destination structure through prototype tasks: **Today / Discover (Know) / Notes / Memories (Remember)**, with Future accessible from Today and a Plans section under Memories. This is a recommendation, not evidence that Future is redundant. Do not hide unfinished plans unless they remain one tap from Today. Pet and Settings stay secondary; moods stay on Today with history accessible there.

Avoid adding dashboard scores, compatibility percentages or punitive streak banners. There is no evidence these improve closeness. The report should describe answer agreement/prediction accuracy, not relationship health.

## Release gates and testing

Launch blockers: media validation/accounting and retryable deletion; production configuration guards and reproducible signed builds; complete privacy/export promises; resolve failing pause test; two-device auth/pairing/reveal smoke tests. Durable drafts and basic failure recovery should precede a broad beta. A full offline outbox can follow unless offline sending is marketed.

Existing tests are valuable, not redundant. Keep contracts/unit rules and real-Postgres API authorization tests. Add component tests for resend failure, note draft recovery, quiz review and settings races. Add E2E for creator and joiner, wrong/expired OTP and invite, no-pet and optional pet, note reception, simultaneous quiz completion, photo failure/retry, logout/account-switch, leave/export/delete. Use physical iOS/Android devices for push/widgets, accessibility and offline recovery; a simulator export cannot verify those integrations. Introduce a component/E2E dependency only after selecting the scenarios and explaining why the current Bun runner cannot render/test native interaction.

No CI workflow or E2E suite found. Proposed CI: disposable Postgres+media directory → migrate → lint/typecheck/unit/API → production bundle → scheduled device smoke. Never point reset helpers at shared or production databases.

## Unnecessary or redundant work to avoid

Do not replace Hono/Drizzle, add Redux for server state, introduce a second journal model for photos, add a second pet reward currency, build a full guest backend, or add tabs for every retention feature. Keep client-generated IDs and scoped query keys; improve where retry identity is currently regenerated. The welcome demo should reuse presentational components, not production hooks against fake authentication.
