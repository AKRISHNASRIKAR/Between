# Between product experience overhaul

## Audit and implementation

The existing Expo57/React Native mobile app, Hono domain modules, Postgres transactions, shared Zod contracts, realtime channel, and semantic design system were retained. Before this pass, every space automatically created and hatched a pet; setup required naming it. Today was a fixed stack, and widgets always included a pet. Settings lacked a shared pet decision and personal haptic/motion preferences. Existing list, asset, theme, mutation rollback, and animation optimizations remain in place.

New spaces begin with an inactive pet record (`NONE`), not an adopted animal. Pairing offers an explicit no-pet choice. Neither partner can activate or pause a pet alone: a proposal carries a unique decision ID, and the other current member accepts that exact proposal. Pending agreement never blocks the app after setup. Pausing preserves identity, name, history, bond, age and care state; resuming shifts care/age timestamps by the paused interval. Existing couples retain active pets through migration.

Pet state is derived from server timestamps when requested, with no background ticking. Fullness settles over20 hours to a forgiving0.35 floor, energy recovers after play, and love settles gently over14 days. Bond never decays. Shared meaningful activity grows bond, and a partner contribution to the same activity earns a small reciprocal bonus. Rolling daily caps and30-second care cooldowns prevent farming. Undo/re-complete of a future goal cannot earn another reward. Row locks serialize care, proposals, and growth; request IDs prevent duplicate effects; pet versions protect client cache from stale realtime updates. Clients cannot submit stats or timestamps.

Today selects up to three actual moments and one primary action: partner notes, unlocked quiz reveal, partner suggestion, personal check-in, daily question, and optional active pet. Private moods remain private. Waiting on a partner does not prevent the caught-up endpoint. Error/loading states do not falsely claim completion. Existing notes, questions, journal and future tabs remain available.

Widgets consume a platform-neutral snapshot with an optional pet, quiz/memory identifiers, moods shared by the partner, note counts, and server generation time. Focus priority is notes, pending daily quiz, an existing anniversary journal page, mood check-in, active pet, then shared default. iOS small/medium/large and lock variants have dedicated branches; Android uses its separate renderer. iOS uses only precomputed props in its isolated runtime and shared app-group art. No-pet publication avoids pet art copying. A six-hour timeline marks saved data stale; platform scheduling remains system-controlled. Native publications are serialized, account/logout wipes supersede older writes, and identical content within the same freshness hour is not republished. Android authorization failures erase cached personal data.

Personal preferences include theme, haptics and reduced motion, with system reduced motion always respected. Shared pet decisions are clearly separate. Granular note/vibe/quiz/journal/future preferences and quiet hours remain; pet updates default off and disappear when the pet is inactive. Dispatch rechecks current pet status. No marketing or guilt notifications were added.

Analytics stores only allowlisted event names, actor/space/entity IDs and server time. Signup uses the actual account-create hook. Successful transitions are observed; repeated reads/retries do not inflate events. Private mood values, answers, text, photos and arbitrary client properties are never stored. Meaningful shared activity is recorded even without an active pet. Notification taps record a content-free open event once per handled response, allowing comparison with subsequent meaningful events. Widget links report observed opens/deep links; Android reports actual widget-add callbacks.

## Models

- SharedSpace: membership, timezone, relationship metadata, setup completion, shared pet decision.
- Pet: preserved ID/species/name, shared name proposal, status NONE/PENDING/ACTIVE/PAUSED, proposal ID/actor, version.
- PetState: last server update, last care/shared activity times, pause time, nondecreasing bond/stage, derived soft wellbeing.
- PetInteraction: unique request ID, actor, space/pet, care kind, server timestamp and earned bond.
- WidgetSnapshot: ready/closed, optional pet, viewer/partner shared vibes, waiting note count, daily session ID/state, memory page ID and generation time.
- Settings: persisted personal theme/haptic/motion preferences; shared pet settings use authenticated server decisions.
- NotificationPreferences: personal category opt-ins and local quiet hours.
- AnalyticsEvent: content-free event name, identities, deduplicating event ID and server timestamp.

## Measurement

The north star is meaningful shared moments per active couple. Healthy activation requires a connected couple and a meaningful contribution from both members; the first shared event alone is not activation. `docs/analytics/couple-metrics.sql` provides a read-only activation, D1/D7/D30, weekly moments and reciprocity query using space-local contribution dates, plus feature adoption counts. Pet care and app opens are excluded from meaningful contribution metrics. Metrics are event counts, not time spent. Retention denominators exclude cohorts that have not reached the requested day.

## Final audit and validation

Five focused audit passes covered design/home hierarchy, mobile UX/accessibility, pet logic, widgets/notifications, and product/analytics. Findings fixed include stale consent acceptance, replayed hatch animation, long settings strings, missing preference validation, pet care cooldown bypass, repeated future reward, paused widget/push leaks, stale widget content, logout publication races, and inflated analytics on retries. The pet and product agents reached an account usage limit before their final summaries; the primary agent completed integration and verification directly.

Validation includes full lint/architecture/token checks,98 theme contrast pairs, all workspace typechecks, API integration tests on an isolated PostgreSQL database, mobile and contract tests, production iOS/Android exports, a native iOS build, and inspection of the updated home on iPhone17 simulator. Pet tests cover5 minutes,12 hours,3 days,30 days, duplicate retries, simultaneous partner feeds, stale consent/names, cooldown/caps, pause/resume and no-pet widget/push behavior.

## Practical limits

Actual widget placement/lock-screen rendering, Android launcher placement, push delivery on physical devices, VoiceOver gestures and real-device frame measurements remain device QA tasks; successful compilation is not evidence of those interactions. The installed Expo widget API exposes no iOS installation callback, so iOS widget-added adoption cannot be measured reliably; observed widget opens are a proxy. Widgets use one automatic focus mode; optional configurable native modes were not added. The current memory resurfacing uses an existing journal page from the same date last year, without fabricated memories or copying private content. A push request already sent to the provider cannot be recalled by a later pause. Analytics dashboards and scheduled daily digests were not introduced; the SQL reports are runnable against the stored events.

## Quiz UX follow-up

Choice questions now occupy one page: a single options list has independent “My answer” and “My guess” columns. Continue saves both picks together; progress counts actual questions, and a review screen edits individual answers before sending. Local drafts survive failed saves and moving between questions. Who/open questions keep one response and never invent a prediction. Waiting uses category artwork instead of an unsolicited pet.

The reveal is now an immediate shared report: overall agreement, both members’ prediction accuracy, real answers grouped per question, and expandable prediction comparisons. Differing answers use neutral language. Open-ended quizzes avoid a meaningless scored label. Symmetry tests verify both viewers receive the same overall label/agreement and swapped personal prediction counts. Layouts were inspected on iPhone17 for a resumed choice question and a completed report;54 mobile/contracts tests and production iOS export pass.

## Pairing reference pass (10 October 2026)

Adapted the three user-supplied Paired/Mobbin pairing screenshots into Between's semantic lilac/blush cards. Start now offers invite creation and inline partner-code entry on one page; direct invitation links use the same join card. Invite creation remains explicit because Between requires a space before issuing a code. Waiting shows eight responsive code cells, copy/share actions, server-confirmed regeneration feedback and a confirmation before invalidating an invite. Switching to a partner's invite explicitly cancels the current empty space first. Code entry confirms the inviter before accepting and locks while submitting.

Added `expo-clipboard` through `expo install` for native, user-triggered copy feedback; this requires a rebuilt development client. The shared CodeField now fits the available card width rather than overflowing narrow phones with fixed-width cells. Existing palette, fonts, privacy and pairing API remain the foundation.

## Pinterest memory browsing (10 October 2026)

Used the Mobbin MCP Pinterest [Home flow](https://mobbin.com/flows/06e91b10-c9ee-40a8-bc54-bd8b37719b95) and [pin detail reference](https://mobbin.com/screens/4da28ef9-ce8a-421d-b0ba-e8ff575f4ae9) to guide Remember → Photos: rounded two-column masonry, varied image heights, compact captions/dates, and a full-photo viewer. The viewer supports swiping, accessible previous/next controls, Android back/Close, and opening the linked journal story. The mounted grid retains its scroll position beneath the viewer. Gallery thumbnails remain separate from full-size image loads; pagination includes retry and end-of-history states, and duplicate media IDs are removed across pages.

Added Expo-compatible FlashList v2 for recycled masonry rather than rendering the complete archive in a ScrollView. Item reordering is disabled to retain the API's chronological ordering. Extreme photo ratios are cropped only in the grid; the viewer contains the full photo. This adapts interaction patterns, not Pinterest's images, social actions or recommendation system.

## Personal color themes and landing (30 October 2026)

Ink & butter is now the default palette, with Rosewater, Evergreen and Apricot as alternatives. Settings separates color selection from System/Light/Dark and previews the actual palette in the current brightness. Each choice is local to the phone. Versioned persistence upgrades the old raw Light/Candlelit values and keeps color and brightness together; changes keep the screen tree mounted so drafts and navigation survive.

Added semantic action, selected-surface, highlight and separate authorship roles. Primary actions, tab selection, focus and header actions follow the chosen palette. Category/mood/pet artwork keeps its established colors through ART_THEME, while quiz cards/reports use themed paper. Control boundaries were darkened after independent review and now join text and selected-checkmark checks in the contrast audit.

Welcome uses an original code-drawn postcard and personal note, the short “Your story, just for two” promise, and create/join actions that carry intent through sign-in. Today uses paired identity, an explicit Settings button, one paper hero and compact secondary moments. Optional-pet language in notes and the outdated creation promise were corrected.

Validation: full workspace lint and typecheck; 44 mobile unit tests including preference migration/system resolution; production iOS export. Native screenshots cover the actual AppearancePicker in the development gallery for all four palettes in both modes and the welcome screen in Ink & butter/Rosewater. A large-text welcome check exposed decorative artwork scaling, which was corrected by keeping illustrative handwriting fixed while real headings/body/actions scale. The iPhone 17e first-launch URL confirmation prevented completing the narrow-device run; no narrow-device pass is claimed. Full authenticated Today/settings flow, physical-device gestures and release-frame-rate profiling were not revalidated in this pass. Native theme changes/navigation were recorded; the variable-frame-rate simulator recording is not a 60fps performance measurement. Captures and review evidence are under the ignored .design-system/implementation-2026-10-30/ folder.
