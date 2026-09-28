# 8. Local development & testing

## Everything runs offline

Every external service has a local stand-in, chosen by environment variables ([ADR 0006](../adr/0006-every-external-service-has-a-local-stand-in.md)):

| Real thing | Local stand-in | Variable |
|---|---|---|
| Sign-in email (Resend) | The code is printed to the API log | `EMAIL_TRANSPORT=console` |
| …or skip email entirely | Every code is `000000`; the dev app fills it in | `DEV_FIXED_OTP=000000` |
| Push (Expo → APNs/FCM) | Logged, and kept in `pushOutbox` | `PUSH_TRANSPORT=console` |
| Photo bucket (R2) | Files in `apps/api/.data/media`, HMAC-signed URLs | `STORAGE_DRIVER=local` |
| A second person | The simulated partner | `DEV_TOOLS=true` |

The API **refuses to start** in production if `DEV_TOOLS` or `DEV_FIXED_OTP` is set.

## The simulated partner

`/v1/dev/partner` (dev module) creates a pretend partner who joins your space; the egg hatches. `/v1/dev/partner/act` performs one action *as* them, through the real services, so Bond, Milestones, realtime events and Notices behave exactly as they would with a real person:

- come online / go offline (presence)
- feed / pet / play; suggest or accept a name
- share a Vibe (random mood or a chosen one)
- send a Note; open or love your latest
- answer every open quiz and today's question
- add or complete a Future item
- write in today's journal page, or add a placeholder photo

In the app: the **DEV** tab on the left edge → *Simulated partner*, or open `lovenotes://dev/partner`. The design-system gallery (`lovenotes://dev/gallery`) shows every primitive, including a `NoticeCard` for each pillar.

## Running on the iOS simulator

```bash
bun run dev:api
```

```bash
bun run dev:mobile
```

Press `i`, or after a native change (new module, sound, plugin config) rebuild the dev client:

```bash
cd apps/mobile && LANG=en_US.UTF-8 bunx expo run:ios
```

The `LANG` setting avoids a CocoaPods encoding error with Ruby 4.

## Test suites

| Suite | Runner | What it covers |
|---|---|---|
| `packages/contracts` | `bun test` | Quiz scoring, Observations, notice copy (every Notice has words and a link) |
| `apps/api` unit | `bun test` | Growth and Milestone rules, Well-being floor, quiet hours |
| `apps/api/test/*` | `bun test` against real Postgres (`.env.test`) | Full HTTP flows through `app.request`: pairing, every feature, privacy, pagination, notices |
| `apps/api/test/authz.test.ts` | — | The authorization matrix: every space route × member / partner / stranger / closed space |
| `apps/mobile` | `bun test` | Pure logic: flow state, deep-link restore, timeline grouping |

Test helpers (`test/helpers.ts`): `resetDb()` truncates everything; `signIn(email)` goes through the real OTP flow with the console outbox; `pairedCouple()` returns two signed-in Members in one space with the egg hatched. Realtime is observed by binding a collector to the hub, and pushes by reading `pushOutbox`.

## Lints

`bun run lint` runs three checks:

1. **Biome**: formatting and lint rules.
2. **Design tokens** (`scripts/check-design-tokens.ts`): no raw colours, font sizes or families, or off-scale spacing outside the design system; no `className` on Animated components.
3. **Architecture** (`scripts/check-architecture.ts`): only `*.repo.ts` touches `db/schema`, and modules import each other only via `index.ts`.

The rule for every commit: `bun run lint && bun run typecheck && bun run test` all green.
