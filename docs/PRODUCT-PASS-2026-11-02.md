# Between product pass — 2 November 2026

The requested priorities 2, 3, 4, and 1 are implemented in the current checkout. No commit or push was made.

## What changed

- Notes, Memories, Future, and Settings now share the existing semantic theme, headers, empty states, and action styles. All eight themes remain available.
- Three interactive, skippable previews introduce notes, questions, and keepsakes before account creation. Pet setup is optional after pairing. Sign-in and resend errors have clear recovery states.
- Note and journal text, photo selection state, and unsaved quiz selections persist in scoped SQLite drafts. Stable operation IDs make retries idempotent. Returned content and draft revision must match before clearing; ambiguous acknowledgements retain newer edits. Restored quiz edits take precedence over previously saved answers.
- Upload reservations enforce per-space quota and uploader ownership, bounded main/thumbnail sizes, and supported image signatures. Completion seals files under keys separate from temporary upload URLs. Physical deletion uses durable retry jobs that survive account/space deletion.
- Export downloads a streaming TAR with JSON and actual photo/thumbnail files, including all eligible quiz sessions. Authorization and unrevealed partner-answer privacy still apply.
- Development mock scenarios create fresh local Sam/Alex couples: Empty, Active, and Returning. Sample content includes notes, moods, memories, plans, and quizzes. Existing simulated-partner controls can advance the other side.

## Run and test the UI

Run `bun run iphone` from the repository root. The iPhone 17 development client must already be installed. The command checks migrations, starts missing local services, launches the app, and opens the correct Xcode device viewer.

Open **Settings → Mock couple scenarios**, or **Test with a mock couple** on Welcome. Mock setup is restricted to development builds using an HTTP localhost API with server development tools enabled. Creating a scenario creates new accounts; signing out from a nonmock account requires confirmation. Returning scenarios use dated sample entries, not authentic account-age or streak history.

## Verified

- Lint, architecture boundaries, semantic tokens, and 494 contrast checks across eight themes pass.
- All workspace typechecks pass.
- API: 127 tests, 469 assertions, zero failures, against a separate local verification database.
- Mobile/contracts: 69 tests, 310 assertions, zero failures.
- Expo production exports complete for iOS, Android, and web.
- Native Device Hub: onboarding note interaction, active mock bootstrap, Today content, note persistence across process restart, and successful send returning to Today were observed. The user’s main iPhone 17 was kept separate from restart testing on iPhone 17e.

## Practical limits

Drafts are local recovery, not a background delivery outbox. An OS-removed photo source must be selected again. Image signature validation is not full image decoding. Android native sharing and device performance still need physical-device QA; bundle export does not establish either. No sustained 60 fps claim is made. The existing deployment configuration still needs production-specific setup.

## Architecture learning artifact

Open [the interactive Expo architecture guide](expo-architecture.html), with [the source walkthrough](expo-architecture-guide.md) alongside it. It follows this app from Router screens through local drafts, Query hooks, shared contracts, API services/repositories, Postgres, media storage, realtime, and exports.
