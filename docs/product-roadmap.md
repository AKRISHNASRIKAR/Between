# Between: prioritized roadmap

Proposal, 31 October 2026. No implementation authorized by this document. Evidence IDs refer to [product audit](product-audit.md); architecture teaching accompanies every later change.

## Ordering and acceptance

Effort is an engineering estimate for one developer familiar with the repo, including focused tests but excluding vendor approval and store review. Validate after design; these are not deadlines.

| Stage / priority | Work and dependencies | Effort | Acceptance criteria |
|---|---|---|---|
| 0 / P0 | A1 media bounds, quota serialization, write ownership; A2 retryable deletion and honest export scope | 4–8 days | Oversized main/thumb rejected and cleaned; concurrent reservations cannot exceed quota; foreign uploader/read-only completion denied; storage failure retains retry job; all accessible quiz history including Daily exported; archives remain usable after signed URLs expire |
| 0 / P0 | Production guards, resolve pet test, reproducible signed preview build | 2–4 days | No dev flags/transports or HTTP fallback accepted in production; deterministic pause tests; explicit build profile/environment/project; two actual devices sign in, pair and see same reveal |
| 1 / P1 | Developer scenarios and selectable normal OTP, before new onboarding | 3–5 days | Empty/active/returning fixtures deterministic, isolated; release direct links fail; no real-account impersonation |
| 1 / P1 | A3 durable note/journal drafts, A4 resend failure/retry | 3–5 days | Kill app mid-draft and restore for same account only; retry cannot duplicate note/page; failed resend displays accurate error without discarding email |
| 1 / P1 | Three-slide local preview and refined create/join journey | 3–5 days after fixtures/drafts | Skip/sign-in/invite context preserved; no real network in demo; first real note possible with minimal decisions; accessibility text and reduced motion checked |
| 1 / P1 | A5 immutable quiz content/scoring history; server/UI prediction policy | 3–5 days | Both viewers share canonical headline/counts after content deployment; personal prediction counts swap correctly; old session prompts/options do not mutate; no premature answer exposure |
| 2 / V1 | One history/weekly recap surface and plan→memory link | 5–8 days after event/history rules | Accurate shared artifacts, no private moods, no duplicate imports; usable without pet; late partner actions handled |
| 2 / V1 | Optional personal intention and opt-in reminders | 3–5 days after completion/timezone rules | One choice, easy pause, no penalty, no reminders after completion/quiet hours/sign-out; no new tab |
| 3 / Future | Resumable offline sending and deeper history/search | 5–10+ days after stable IDs/drafts | Process death, reconnect, ordering/conflict/expiry and account-change tested; explicit acknowledged delivery states |

If scope must shrink, ship fewer promises: offline reads + saved drafts, no claim of offline delivery; explicit JSON export until a real archive exists. Do not reduce privacy/authorization gates to hit a feature date.

## Five strongest new feature candidates

### 1. Pre-account interactive preview — MVP

Problem: users must commit before seeing the value. They care because this app asks them to invite someone into a private shared space. Fit: existing welcome and three actual capabilities, no new tab. Flow: open sample note → answer demo question → view sample memory → create/join/sign in. Dependencies: pure components, separate local demo state, preserved onboarding intent. Complexity: medium. Measure: first real action and accepted invites, time-to-value, signup drop-off; preview completion alone is not success. Full design: [onboarding plan](onboarding-plan.md).

### 2. “Our week,” a shared recap — V1

Problem: good moments disappear across separate features. Users care about seeing what they made together rather than a usage total. Fit: a small Today card linking to a read-only Memories section. Flow: at most once per week show a note opened, a shared photo, a completed plan and one quiz discovery; either person can open any artifact. Dependencies: stable shared activity history, permission-aware reads, week/timezone definition, immutable quizzes; exclude private moods and deleted content. Complexity: medium/high. Measure: recap opens leading to meaningful revisits and both-member weekly return, dismissals as a guardrail. No automatic notification until users opt in; insufficient data should show nothing rather than manufacture a summary.

### 3. Completed plan → memory — V1

Problem: Future completion is an endpoint disconnected from Remember. Users care because a plan becomes their lived story. Flow: stamp plan → optional “Keep this moment” → existing journal composer with plan title and date → linked memory on plan. Dependencies: optional plan/page relationship, contracts, existing composer and owned photos; unique link/idempotent creation. Complexity: medium. Measure: completed plans producing voluntary memories and later revisits; no required photo. This is an extension to two existing features, not a separate destination.

### 4. One personal connection intention — V1 experiment

Problem: returning users may want a small prompt without an endless checklist. Offer “Leave a note,” “Answer a question,” or “Keep a memory,” with optional cadence chosen privately. Flow: choose one in Settings/Today → existing Today action → quiet acknowledgement → change/pause anytime. Dependencies: user preference, eligible server completion ledger, timezone rules; does not require partner consent or partner participation. Complexity: medium. Measure: repeat meaningful actions per member/couple, opt-out and pressure feedback. Do not infer the intention from private mood or require all three actions daily.

### 5. Personal reminders and widget quick actions — V1

Problem: users forget the intention or cannot quickly reach the action. Flow: after receiving value, optionally choose a local time/days → notification opens the relevant existing action; widget gives one relevant real shortcut. Dependencies: existing push prefs/widgets, permission request timing, scheduler with dedupe, timezone/quiet hours and completed-action suppression, revoked-token handling. Complexity: medium/high for reliable delivery. Measure: useful action following a reminder, notification disables, no repeat reminders for already completed days. Existing category event notifications are not a reminder scheduler. Do not add a separate quick-action dashboard.

## Retention: a consistent proposed model

The recurring objective is mutual attention, not app attendance. Current mechanics: real notes/reveals, Daily, finite Today, gentle pet bond/milestones, optional pet-update pushes and widgets. No consecutive-day streak model exists. Preserve non-punitive return and pet's calm floor.

Recommend **activity days / weekly rhythm** first. If a streak is shown later, it is personal and optional; do not break it because a partner did not act. Show a shared calendar of overlapping activity only if both choose it. Never compute relationship quality from it.

- **Qualifying completion:** first server-accepted note sent, journal text/photo contribution, quiz/Daily answer submission, or first transition completing a Future plan in a member's day. Quiz editing/viewing, opening the app, pet taps and preview demos do not qualify. A private mood may count toward a separate private check-in intention; it never contributes to shared activity or exposes a private completion signal to the partner.
- **Authority/storage:** new Postgres `member_activity_days` with unique `(spaceId, userId, localDate, ruleVersion)`; source contributions deduped by `(operationId, ruleVersion)`. Store event instant UTC, IANA timezone snapshot, applied local date, kind, source ID and rule version. A private ledger must be access-scoped separately if private check-ins count. Analytics is not the source of truth.
- **Day boundary:** personal IANA timezone, midnight to next local midnight, using calendar dates rather than 24-hour subtraction; DST days can be 23/25 hours. Save timezone changes prospectively, do not rewrite history. Shared Daily retains its existing space timezone. UI must explain different dates for a traveling couple. Ask users to confirm a timezone change; no silent streak rewriting.
- **Duplicate prevention:** ledger insertion in the same transaction as accepted qualifying action; unique source/operation prevents retries and toggling a plan from farming completions. Concurrent requests can add several events but at most one activity day.
- **Offline:** until outbox exists, an unsent draft is not completion. With an outbox, show Pending locally; server confirms once synced. Proposed late-sync policy: accept claimed event time within 48 hours only after validating server receipt bounds and action, keep original zone, dedupe operation; beyond that allow saving content but do not backdate the streak. Device time is untrusted; no claim of tamper-proof offline timing. Test clock skew, midnight and expired sessions. Forty-eight hours is a policy proposal to discuss, not existing behavior.
- **Calculation/persistence:** authoritative day rows; derive current consecutive dates, longest run and total days at read time or rebuildable materialized summary. Today's unfinished day preserves a run ending yesterday; after a full missed day current run restarts, historical days and longest stay. Never trust client incremented counters.
- **Recovery:** missed days remain honest gaps; no paid freezes, guilt copy or fake completion. Celebrate cumulative days/weekly rhythm and offer resume today. “Recovery” means a welcoming next action, not rewriting the past. Both members can take breaks independently.
- **History/milestones:** calendar and totals from authorized ledger; recognize first 7/30 meaningful days privately or cumulative shared milestones, independent of optional pet. No duplicate celebration on refetch. Delete/cascade member data consistently; decide whether removed artifacts remove historical counts and document it before building.
- **Reminders:** opt-in after value; one scheduled reminder maximum on selected days, suppress after completion and respect recipient timezone/quiet hours. Pause and disable in one place. Closed spaces, signed-out tokens and inactive intentions receive none.

Dependencies: versioned completion contract, injected clock, date-aware foreground refresh, durable delivery/operation identity, privacy review and scenario fixtures. This is too much infrastructure to add merely for a streak badge.

## Simple user journey and navigation

First session: preview → email/OTP → name if missing → create/join → invite/confirm → one useful note → optional discovery. Delay pet setup and notification prompt until value, retaining consent. Typical return: owned cache/session → Today → pending note/reveal/check-in → caught up. Inactive return: existing pending moment, no missed-task wall.

Keep five tabs for corrective work. Test four-tab prototype before migration: Today, Discover, Notes, Memories; Future/Plans reachable directly from Today and within Memories. Do not add tabs for recap, goals, pet or streaks. Keep Settings secondary. Acceptance: participant finds every current feature and open plan without explanation, in no more navigation steps than today.

## Analytics and decision checkpoints

Already present: allowlisted server `analytics_events`, account/pairing/note/quiz/journal/mood/widget events and `docs/analytics/couple-metrics.sql`. No arbitrary content properties. Distinguish members from couples, sign-in from first signup, retries from new events, and shared from private activity.

Add only necessary funnel events: preview/auth entry, invite conversion, first real member value, both-member value, and active-day retention by signup and pairing cohort. Record step enum/version and IDs where justified; no note text, quiz choices, mood value, photo URL or raw email. Report D1/D7/W4 member and paired-couple return based on meaningful accepted actions, pending-response time, save/upload failures and onboarding drop-off. Record denominators (started signup vs paired users) to avoid misleading rates. Review retention/consent policy and event expiry; aggregation does not eliminate privacy obligations.

Before implementing: choose Stage 0 scope, then one feature at a time. For each use Understand → Design → Explain → Implement → Test → Review; show the current trace, proposed contract/state transitions, changed files, failure behavior, tests and one small hands-on task. Start learning with the note-send trace in the architecture guide, then add a display-only variant yourself before changing persistence.
