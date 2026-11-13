# Between

A private little world for exactly two people: check in on how you feel, learn about each other, leave notes, keep a shared journal, plan what's next — and look after a small pet together.

```
apps/mobile         Expo (iOS/Android) app — Expo Router, NativeWind, TanStack Query
apps/api            Bun + Hono API — Drizzle/Postgres, Better Auth, WebSocket realtime
packages/contracts  Zod schemas + shared copy: the single source of truth for both sides
content/quizzes     Quiz packs and the Daily question pool (JSON, synced on boot)
docs/               Spec, architecture (layer by layer), ADRs, deployment
```

## Start here

| If you want to… | Read |
|---|---|
| Learn the words we use (Space, Pet, Vibe, Notice…) | [CONTEXT.md](CONTEXT.md) |
| Understand what the product does | [docs/SPEC.md](docs/SPEC.md) |
| Understand how it's built, layer by layer | [docs/architecture/](docs/architecture/README.md) |
| Know *why* it's built that way | [docs/adr/](docs/adr) |
| Change anything visual | [DESIGN.md](DESIGN.md) |
| Ship it | [docs/DEPLOY.md](docs/DEPLOY.md) |

## Run it locally (no accounts, no network services)

Everything external has a local stand-in ([ADR 0006](docs/adr/0006-every-external-service-has-a-local-stand-in.md)): sign-in codes are fixed, pushes are logged, photos go to disk, and a simulated partner can act for the other person.

```bash
bun install
```

```bash
cp apps/api/.env.example apps/api/.env   # Postgres URL + DEV_FIXED_OTP=000000 + DEV_TOOLS=true
```

```bash
bun --cwd apps/api db:migrate
```

```bash
bun run dev:api
```

```bash
bun run dev:mobile   # then press i for the iOS simulator
```

For the installed iPhone 17 development build, run `bun run iphone`. This checks local database migrations, starts missing API/Metro processes, launches Between, and opens Xcode’s Device Hub (or Simulator on older Xcode). It refuses to reuse unrelated services on the required ports.

For UI testing, choose **Test with a mock couple** on Welcome or **Settings → Mock couple scenarios**. Choose Empty, Active, or Returning. Each creates fresh local Sam/Alex accounts and sample content; it does not erase another space. These tools require a development build and a localhost API. See [the completed product pass](docs/PRODUCT-PASS-2026-11-02.md).

Sign in with any email; the code is `000000` (the dev build fills it in for you). Create a space, then open the **Dev** button → *Create partner* to pair with a simulated partner and make them write notes, share vibes, answer quizzes and look after the pet.

## Checks

```bash
bun run lint        # Biome + design-token lint + architecture lint
```

```bash
bun run typecheck
```

```bash
bun run test        # contracts, API (against a real Postgres), mobile
```

All three must be green before a commit.
