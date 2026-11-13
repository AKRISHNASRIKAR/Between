# Between: product and execution review

Date: 10 October 2026. Scope: current mobile routes, feature logic, API domains, contracts, content, deployment documentation, and prior verification notes. This is a code and product review, not a new full device test or penetration test. Recommendations are hypotheses until tested with couples. No product code was changed for this review.

## 1. Overall assessment

The app has a coherent emotional premise and a substantial working foundation. Its strongest promise is **small gestures that become your shared story**: leave something, discover something, keep something, and look forward to something. Private moods and an optional pet support that promise without making participation compulsory.

The main weakness is that the five destinations currently behave more like separate tools than stages of one relationship experience. A quiz ends in a report; a future ticket ends in a stamp; a note remains a note. The opportunity is to connect these moments into a history that becomes more valuable over time.

I would position the initial beta for couples with different schedules or living apart who already communicate elsewhere. This is a proposed focus, not a validated audience finding. The app should earn a brief visit by offering something personal from their partner, then preserve it. Broadening into messaging, relationship coaching, a social network, and a large pet game would dilute this purpose.

The execution is ahead of a simple prototype but needs a real two-device beta before public-launch claims. Shared server state, authorization boundaries, secret quiz answers, privacy lifecycle, and cache isolation are meaningful strengths. Durable drafts, recoverable media, lasting exports, content operations, and production verification remain more valuable than widening the feature list.

## 2. Market and naming

There is already an established couples product called [Between](https://between.us/?lang=en), advertising private photos, notes, anniversaries, chat, and a shared calendar. This is a concrete naming and discoverability problem; it is not a conclusion about trademark rights. Resolve naming before investing heavily in store assets and acquisition.

[Paired](https://www.paired.com/frequently-asked-questions) already offers paired questions, quizzes, and games, while [Agapé](https://www.getdailyagape.com/) offers daily and categorized questions. Consequently, questions alone and a private archive alone are not a distinctive position. These official pages establish advertised features, not comparative quality or retention.

The proposed difference is the connection between gestures and keepsakes: a playful discovery becomes a remembered preference; a plan becomes a two-sided memory; a note resurfaces when it matters. The optional pet can embody that history, but should not be the only reason the product exists.

## 3. Review of the whole experience

| Area | What works | What needs improvement | Recommended next behavior |
|---|---|---|---|
| Welcome and sign-in | Simple email-code flow; clear private space premise | A user must commit before experiencing the value; social providers in the old spec are not presented in the current sign-in screen | Show a short sample of a note, reveal, and shared memory before authentication; measure code delivery and completion |
| Pairing | Code/link invite; exact two-person space; partner simulation for development | Waiting screen is largely invite/send/cancel; no first gesture to prepare | Let the inviter draft a welcome note or prepare one memory while waiting, without inventing partner activity |
| Space setup | Optional naming and pet | Create screen says the name can change later, but Settings presents it as a read-only row; egg imagery still implies pet ownership | Finish basic profile/space editing and use neutral shared-space artwork before pet consent |
| Today | At most three moments; actual unread notes and daily reveal; no-pet path | Ranking input only includes daily quiz, notes, vibes and pet. Ready pack quizzes, new journal contributions and future plans do not participate | Prioritize partner-created moments across all pillars; retain one obvious action and a calm caught-up state |
| Vibes | Private by default; unsharing; private and absent partner states deliberately indistinguishable | Sharing a feeling does not communicate what response would help | Optional, explicitly shared support request: “A little reassurance”, “Company”, or “Space”. No inference from private data |
| Quizzes | Server secrecy; answer/prediction in one question view; review before locking; both answers in report | Dual selectors still need comprehension testing; totals can dominate the emotional value; content is small | Brief first-use example, conversation follow-up per reveal, and optional saving of a useful discovery |
| Daily question | Same space/day question and asynchronous answering | Thirty daily questions; after exhaustion the selector falls back to random, allowing quick repeats. Past daily history lacks a dedicated discovery experience | Expand and curate the pool; use a repeat cooldown and accessible past answers; allow a gentle topic skip |
| Notes | Distinctive paper expression and reveal; author deletion and recipient reaction | Draft lives in component state; detail lacks visible edit/save-to-journal controls promised by the spec. Success toast still says the pet carries it even with no active pet | Durable drafts, appropriate no-pet copy, author editing rules, and “Keep in our story” |
| Journal | Each partner has their own blocks; shared photos and reactions | Creation fixes the page date to today; detail offers add/remove but no edit flow. Photos group by upload creation date rather than the historical event date | Backdate, edit own contributions, dedicated fast photo memory entry, search and date navigation |
| Future | Lightweight categories, completion, and undo | Current composer is title/category; list interactions mainly complete/remove. A dream does not become an actionable agreed plan or a memory | Select a ticket → suggest a date → partner agrees → after the event add both perspectives, with a stable link |
| Pet | Optional shared consent; pause; nondecreasing bond; activity-based growth | Care can still become the most obvious activity when there is nothing new | Tie selected milestones to genuine shared keepsakes; keep pet-free couples equally well served |
| Widgets and notifications | Shared snapshot, no-pet layouts, freshness treatment, preferences and quiet hours | Native widgets and delivery need physical-device coverage; quiet hours only offer preset schedules in Settings | Test stale/auth/logout/timezone states, offer custom quiet hours, and prioritize actual partner gestures |
| Settings and lifecycle | Export, account deletion, closed-space retention, themes and motion preferences | Profile/space editing incomplete; export permanence does not match “everything”; app lock absent | Clear ownership, durable exports, editable basics, and optional biometric lock with a safe fallback |

## 4. Concrete execution risks

### Durable work and media recovery — high priority

`notes/new.tsx`, `journal/new.tsx`, and journal detail hold unsent text in React state. Keeping text after a failed request is useful, but leaving a screen or restarting the app can lose it. `lib/query.ts` persists read cache and sets mutation retries to zero; it is not a durable outbox. The original specification describes a stronger offline experience than the current code provides.

Photo uploads run immediately in parallel in `features/journal/PhotoPicker.tsx`. Failed photos get a “failed” label and a remove action, without an explicit retry action. Ready media IDs alone are submitted, so a page can be saved with some intended images omitted. Add persistent upload records, bounded concurrency, per-photo retry, and an explicit choice before saving an incomplete set. Show “Saved on this phone”, “Sending”, and “Shared” accurately.

### Historical quiz consistency — high priority

Quiz sessions retain question IDs; `quizzes.service.ts` fetches current question records and recomputes the result on reads. Both partners use the same scoring function today, but future content or scoring changes can alter an old report. Store immutable question/option snapshots or immutable content versions, plus a scoring version and canonical completed result. Viewer-specific prediction counts can swap perspective; the shared conclusion must remain stable. Test old sessions across content updates, not only the symmetry of current scoring.

### Export is not yet a lasting photo backup — high priority

`privacy.service.ts` exports JSON with temporary photo links. It explicitly says those links expire. Exporting “everything” should produce original accessible media plus readable content, ideally an archive containing files, JSON, and a simple HTML index. Large archives need streaming/background generation rather than collecting the entire history in memory.

Quiz export currently delegates to `listSessions`, whose repository limits pack history to 50; the export has no independent paginated history traversal. Verify and expand export coverage for both pack sessions and daily history before claiming completeness.

### Production media enforcement — high priority before cloud launch

The S3 adapter accepts a maximum-byte argument through its interface but does not enforce it in the signed PUT implementation. Upload completion checks object existence and records main-object size; it does not validate the declared maximum, thumbnail size, or actual image format in that path. The quota reservation checks declared main-image bytes. Review server-side object validation and quota accounting for concurrent reservations and both objects. This is a launch hardening finding, not evidence of an observed exploit.

Deletion helpers catch object-storage deletion errors and continue. Define durable retry records and monitor failed cleanup so database deletion does not silently leave stored media behind.

### Operations and verification — beta gate

The current architecture intentionally uses one Bun API instance and an in-process realtime hub. That is reasonable for a controlled beta; multiple replicas need shared event distribution. Do not add distributed infrastructure without a measured need.

There are meaningful pure/domain tests and API tests, but no checked-in `.github` workflow or Maestro flow surfaced in the inspected repository. The old spec promises both. Add automated release checks and a focused end-to-end suite covering pairing, a private mood, note delivery, quiz completion/reveal, interrupted upload, logout, and closed-space access.

Verify production email, physical-device push, signed media, background/foreground transitions, timezone boundaries, Android widgets and iOS widgets. Perform an actual database-and-media restore drill; a backup setting is not proof of recovery. Existing deployment cost/free-tier statements should be revalidated separately before budgeting.

Scope the privacy promise accurately: two-person authorization and private storage are valuable, but this implementation is not end-to-end encrypted. Add app lock as local privacy protection, without presenting it as server encryption. Review notification previews for sensitive text.

## 5. What more the app could offer

Priority is based on fit with this product, not measured customer demand. Effort is relative and includes UX, backend, lifecycle and testing.

| Addition | Example | Why it fits | Relative effort | Suggested order |
|---|---|---|---|---|
| Our Story with saved moments | Save a note or reveal; link it to a dated page | Connects the existing pillars and makes the archive valuable | Medium | First |
| Plan → experience → memory | Agree on a picnic date; afterward each adds one photo and a sentence | Turns Future into something with an outcome | Medium | First |
| Memory resurfacing | “A little moment from last month”, not only anniversaries | Gives early couples value before a year of history exists | Medium | First |
| Open When notes | “Open when you miss me” | Personal asynchronous care using an existing strength | Medium | Next |
| Voice keepsakes | A short recording attached to a note or memory | Carries tone and presence, especially across schedules | Medium–large | Next, after media reliability |
| Important dates and next visit | A mutually saved anniversary or visit countdown | Helps long-distance couples anticipate shared time | Medium | Next |
| Optional weekly ritual | Both answer “What should we keep from this week?” | Creates a two-perspective keepsake without a streak | Medium | Experiment |
| A private preference collection | Explicitly save “Their comfort meal” from a reveal | Makes discoveries useful later without profiling secretly | Medium | Experiment |
| Time capsule | Each adds something; open on a chosen date | Strong archive/payoff fit | Medium–large | Later |
| Printable memory book | Couple-selected photos, notes and milestones | Tangible value and a potential premium offering | Large | Later |

The standout bundle is **Our Story + planned moments + resurfacing**. Voice notes and Open When notes are strong follow-ons. None requires AI to deliver its core value.

Preserve consent boundaries: future date invitations need explicit responses; “Open When” emotional conditions should be recipient-chosen, never inferred from private moods; importing old photos should be deliberate; reminders should be optional. A missed ritual must not become a relationship failure message.

## 6. What I would defer

- Full chat, calling, and a shared productivity calendar: expensive surfaces that need a demonstrated reason to replace existing habits.
- Live location and partner activity scoring: poor fit with the current trust model.
- Compatibility percentages, public leaderboards, and punitive streaks: turn discoveries into evaluations or obligation.
- AI interpretation of private notes, moods or quiz answers: unproven benefit, substantial trust burden. Start with explicit saved moments and curated follow-ups.
- A large pet room economy, many species and collectible systems: broaden only if couples value the shared companion beyond repetitive care taps.
- Many additional tabs: connect the existing destinations before expanding navigation.

## 7. Business model hypothesis

Test one subscription per couple. Keep the basic daily exchange, partner access, deletion, and usable data export available. Potential premium value: expanded curated content, voice/time capsules, richer keepsake presentation, and memory-book creation. Storage tiers require actual cost measurement and transparent limits.

Do not set pricing from this audit. First test willingness to pay for a specific outcome: “preserve our story” or “make meaningful time together easier.” Pet cosmetics may be optional secondary revenue; they should not gate closeness or data recovery.

## 8. Roadmap and evidence

**Stage 1 — trust and a complete first experience.** Resolve naming; fix misleading setup/no-pet copy; enable profile/space edits; durable drafts and upload recovery; immutable quiz history; complete durable export; production-media hardening. Test that two real phones can pair and complete a note and reveal without developer help.

**Stage 2 — connect the pillars.** Save notes/reveals into Our Story, historical dates/editing/search, future-plan-to-memory linkage, and a first welcome gesture. Expand and editorially review quiz content. Test whether couples revisit and contribute to their history voluntarily.

**Stage 3 — controlled beta.** Recruit roughly 12–20 couples across long-distance, different schedules and co-located situations for several weeks. This is a proposed research sample, not a statistical proof. Observe each partner separately so an enthusiastic inviter does not mask a reluctant partner. Cover iOS/Android combinations and different timezones.

**Stage 4 — choose one expansion.** Test Open When notes or voice keepsakes. Add the second only if the first creates useful repeat behavior. Explore memory-book demand after sufficient real history exists.

Measure invitation-to-pair conversion, time to first two-way moment, both-partner participation, D7/D30 couple return, weekly reciprocal moments, saved/revisited keepsakes, upload recovery, and delivery-to-open rates. Count meaningful contributions separately from pet care and raw screen opens. Current analytics provide a starting point, not evidence that retention already exists.

Ask couples: “What did you do here that you would not have done in chat?”, “Which moment would you miss if the app vanished?”, and “Did anything feel like homework or pressure?” Predefine success criteria with the beta team before evaluating an experiment; do not invent retention targets after observing results.

## 9. Evidence map and limits

Primary implementation references:

- Onboarding and editing: `apps/mobile/src/app/{waiting,create,sign-in,settings}.tsx`.
- Home ranking: `apps/mobile/src/features/home/moments.ts`.
- Quiz UX: `apps/mobile/src/features/quizzes/{QuizPlay,ChoiceGrid,QuizReveal}.tsx`.
- Quiz history/content: `apps/api/src/modules/quizzes/{quizzes.service,quizzes.repo}.ts`; `content/quizzes/*.json` (five six-question packs and thirty daily questions).
- Journal and photos: `apps/mobile/src/app/journal/{new,[id]}.tsx`; `apps/mobile/src/app/(tabs)/remember.tsx`; `features/journal/PhotoPicker.tsx`; `lib/media-upload.ts`.
- Plans: `apps/mobile/src/app/(tabs)/future.tsx`.
- Cache/export/storage: `apps/mobile/src/lib/query.ts`; `apps/api/src/modules/privacy/privacy.service.ts`; `apps/api/src/modules/journal/media.service.ts`; `apps/api/src/lib/storage.ts`.
- Previous verification and architecture: `docs/PRODUCT-OVERHAUL.md`, `docs/OPTIMIZATION-PASS.md`, and `docs/architecture/09-deployment.md`.

The review distinguishes observed implementation gaps from product hypotheses. It does not establish accessibility across every device, production delivery reliability, conversion, willingness to pay, regulatory compliance, or exploitability. Those need the focused checks and real-couple research described above. The original `docs/SPEC.md` is partly stale; update it to match optional pets, current themes/widgets, quiz interaction, and actual offline behavior.
