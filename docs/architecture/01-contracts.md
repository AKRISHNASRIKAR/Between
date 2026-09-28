# 1. Contracts (`packages/contracts`)

The contracts package is the one thing both the app and the API import. It holds:

| File | What's in it |
|---|---|
| `common.ts` | Ids, dates, cursors, pagination envelopes |
| `errors.ts` | `ApiErrorBody` and the closed list of error codes |
| `limits.ts` | Every numeric limit (note length, photos per block, retention days…) |
| `space.ts`, `me.ts` | Space, Member, Invite, the `Me` payload |
| `pet.ts` | Pet, Stage, mood, **Well-being** (`WELLBEING_FLOOR`), Milestones, `MILESTONE_COPY`, the Pet timeline |
| `pet-lines.ts` | What the pet "says" on Today, by mood |
| `moods.ts`, `observations.ts` | Vibes and the hand-written Observations |
| `notes.ts`, `journal.ts`, `future.ts`, `quizzes.ts` | Each feature's inputs and outputs (`scoreQuiz` lives here too) |
| `notifications.ts` | Notification preferences (`notes`, `vibes`, `quizzes`, `journal`, `future`, `petUpdates`, quiet hours) |
| `notices.ts` | The `Notice` union and `noticeCopy()` — the words for every notification |
| `realtime.ts` | Every WebSocket event (`ServerEvent`) and client message |
| `dev.ts` | Simulated-partner actions (dev tools only) |

## How it's used

- **API input.** Every route validates `json`, `param` and `query` with a contract schema via `lib/validate.ts`. An invalid body becomes a 422 with per-field messages.
- **API output.** Services return contract types, and the Hono RPC type (`AppType`) carries them to the app. So when a response shape changes, the app stops compiling.
- **Mobile.** The app never declares its own copy of a server type; it imports them from here.

## Shared copy lives here too

Some *words* must match on both sides, so they live in contracts rather than in either app:

- `noticeCopy(notice, petName)` → `{ title, body, url, pillar, pref }`. The API uses it for push text; the app uses it for the in-app banner. See [Notifications](05-notifications.md).
- `MILESTONE_COPY` + `fillPetCopy()`: Milestone titles and lines in the Pet's voice, used in pushes and in the Pet timeline.
- `withPartner()`: quiz prompts that mention the partner by name.

## Rules

- Zod v4, no runtime dependencies besides Zod. Nothing platform-specific (no Node, no React Native).
- A breaking change to a contract is made in one commit together with the API and the app.
- Tests live beside the code (`*.test.ts`) and cover the pure logic: quiz scoring, Observations, notice copy.
