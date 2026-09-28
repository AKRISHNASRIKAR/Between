# 2. API (`apps/api`)

A single Bun process running Hono ([ADR 0001](../adr/0001-hono-on-bun-modular-monolith.md)). It serves JSON over HTTPS, one WebSocket endpoint for realtime, and (in dev only) signed local file URLs.

```
src/
  index.ts            boot: Bun.serve, bind realtime, sync quiz content, hourly cleanup
  app.ts              composition: middleware, auth handler, every router mounted here
  app-type.ts         exports AppType for the mobile RPC client
  env.ts              validated environment (refuses dev flags in production)
  auth.ts             Better Auth: email OTP, Expo plugin, sessions
  http/               cross-cutting HTTP: requireUser, requireSpaceMember, local file routes
  lib/                small shared helpers: errors, scope, tx, validate, cursor, storage, time, ids, email
  realtime/           hub (publish, presence) and the WebSocket handler
  db/                 Drizzle client, schema (one file per area), migrate script
  modules/<m>/        features, each routes → service → repo behind an index.ts
```

## Request pipeline

```
request
  → requestId, CORS (dev), no-store caching
  → /v1/auth/*            Better Auth (email OTP sign-in, sessions)
  → /v1/*                 requireUser            → c.var.user
  → /v1/spaces/:sid/*     requireSpaceMember     → c.var.scope  (404 for non-members)
  → validate(json|param|query, ContractSchema)
  → module route → service → repo
  → app.onError: AppError → { error: { code, message, fields? } }; anything else → 500 INTERNAL (logged without bodies)
```

All routes are composed in `app.ts`. The space-scoped ones are mounted under one router, so none can skip the gate:

| Path | Router | Module |
|---|---|---|
| `/v1/me` | `meRoutes` (+ `notificationRoutes`) | me, notifications |
| `/v1/spaces` (POST) | `createSpaceRoutes` | spaces |
| `/v1/spaces/:sid` | `spaceRoutes` (get/update, invites, leave) | spaces |
| `/v1/spaces/:sid/pet` | `petRoutes` (+ `/timeline`) | pet |
| `/v1/spaces/:sid/vibe` | `vibeRoutes` | vibes |
| `/v1/spaces/:sid/notes` | `noteRoutes` | notes |
| `/v1/spaces/:sid/quizzes`, `/daily` | `quizRoutes`, `dailyRoutes` | quizzes |
| `/v1/spaces/:sid/future` | `futureRoutes` | future |
| `/v1/spaces/:sid/journal`, `/media`, `/memories` | `journalRoutes`, `mediaRoutes`, `memoryRoutes` | journal |
| `/v1/spaces/:sid/export` | `exportRoutes` | privacy |
| `/v1/invites/:code` | `inviteRoutes` (preview, accept) | spaces |
| `/v1/quiz-packs` | `quizPackRoutes` | quizzes |
| `/v1/dev/*` | `devRoutes` (404 unless `DEV_TOOLS`) | dev |
| `/v1/realtime` | WebSocket | realtime |

## Authorization: `SpaceScope`

`lib/scope.ts` defines a **branded** `SpaceScope { spaceId, userId, partnerId, writable, timezone }`. Only `requireSpaceMember` (and `activeScope()` for `/me`, the socket and dev tools) creates one, after checking membership in the database. Every space-scoped repo function takes a scope instead of an id, so "forgot to check membership" can't compile ([ADR 0002](../adr/0002-space-scope-is-the-authorization-boundary.md)).

- Not a member, or a malformed id → **404** `SPACE_NOT_FOUND`, so space ids can't be probed.
- Closed space → the scope has `writable: false`. Reads still work for 30 days, and every write calls `assertWritable(scope)` → 403 `SPACE_CLOSED`.
- Per-item rules live in services: only the author edits a Block, only the recipient opens a Note, and so on.
- `test/authz.test.ts` is the matrix: every space-scoped route × {member, partner, stranger, closed}.

## Modules

Each module is a folder with the same four parts:

```
modules/notes/
  notes.routes.ts    HTTP only: validate, read c.var.scope, call the service, pick the status code
  notes.service.ts   the use cases: rules, the transaction, and what to announce after commit
  notes.repo.ts      the only file that touches notes tables; every function takes (tx, scope, …)
  index.ts           the module's front door: what other modules and app.ts may use
```

| Module | Owns (tables) | Uses |
|---|---|---|
| `members` | — (read-only view of `space_members` + `users`) | — |
| `activity` | `activity_events` | — |
| `notifications` | `notification_prefs`, `push_tokens` | realtime hub |
| `pet` | `pets`, `pet_interactions`, `pet_milestones` | activity, members, notifications |
| `spaces` | `spaces`, `space_members`, `space_invites` | members, pet, activity |
| `vibes` | `mood_checkins` | pet, members, notifications |
| `notes` | `notes` | pet, members, notifications |
| `quizzes` | `quiz_*` | pet, members, notifications, spaces |
| `future` | `future_items` | pet, members, notifications |
| `journal` | `journal_*`, `media` | pet, members, notifications |
| `me` | `users` (profile fields) | members, spaces, journal |
| `privacy` | — | every feature's read functions |
| `dev` | test users | the public API of every module |

Two rules, both checked by `bun run lint` (`scripts/check-architecture.ts`):

1. **Only `*.repo.ts` imports `db/schema`.** Services never write SQL, so every query sits in one place per module and is scoped.
2. **Modules import each other only through `index.ts`.** A module's internals can change without breaking others, and the dependency graph stays readable (it's acyclic: `members` and `activity` sit at the bottom, `privacy` and `dev` at the top).

Why `members` is separate: nearly every feature needs names ("Ananya left you a note"), but `spaces` depends on `pet` (hatching on join). A read-only member directory keeps names available without a cycle.

## Transactions and side effects

`withTx(fn)` wraps `db.transaction`. A service does its reads and writes inside, **returns what happened**, and announces it after `withTx` resolves:

```ts
const r = await withTx(async (tx) => {
  const note = await notesRepo.insert(tx, scope, input);
  const pet = await growPet(tx, scope, "note.created", note.id); // bond + milestones, same tx
  return { note, pet, from: displayName(await membersRepo.of(tx, scope), scope.userId) };
});
publish(scope.spaceId, { t: "note.created", note: r.note });   // realtime
await announcePet(scope, r.pet);                                  // pet.updated + milestone notices
await notifyPartner(scope, { type: "note.waiting", noteId: r.note.id, from: r.from }, petName);
```

So a rolled-back write never sends an event or a push, and a failed push never fails the write (`notify` never throws).

## Idempotency and concurrency

- **Client-generated ids** ([ADR 0008](../adr/0008-client-generated-ids.md)): creates use `onConflictDoNothing` on the client's UUID, so a retried request returns the same row.
- **Optimistic concurrency** on shared editable things (Future items, journal Blocks): a `version` column, and a stale write gets 409 `VERSION_CONFLICT`.
- **Row locks** (`for update`) where two members can race: quiz completion (so the Reveal unlocks exactly once), pet naming, pet care.
- **Unique indexes** settle "both opened Today at once" (one Daily question per space per day) and "one open session per pack".
- **Fractional-index positions** for user ordering (Future list) — moves write one row.

## Pagination

Keyset cursors, never offsets. `lib/cursor.ts` encodes `(createdAt, id)`. Journal pages sort by page date, so their cursor carries `(pageDate, createdAt, id)` in `journal.repo.ts`.

## Realtime

`realtime/hub.ts` is the only publisher: `publish(spaceId, event)` and `isOnline(spaceId, userId)`. Today it runs on Bun's in-process pub/sub, one topic per space. It can be swapped for Postgres `LISTEN/NOTIFY` or Redis when there is more than one instance, without changing callers.

`realtime/ws.ts`: the client authenticates with its **first message** (never a token in the URL), and the server picks the topic from the user's active space. Presence is counted per connection. Events are small, mostly "something changed, refetch this key" (see `ServerEvent` in contracts). `pet.updated` carries the whole Pet, and `notice` carries a Notice for one member.

## Jobs

`index.ts` runs `runCleanup()` (privacy module) 10 seconds after boot and hourly:

- `purgeExpiredSpaces`: closed spaces past `purge_after` lose their storage prefix, then the row (everything cascades).
- `purgeStaleUploads`: uploads never completed within a day, or never attached within a week.

Quiz content is upserted from `content/quizzes/*.json` on every boot (`syncQuizContent`, [ADR 0007](../adr/0007-quiz-content-lives-in-the-repo.md)).

## Errors

`lib/errors.ts`: `AppError(code, status, message, fields?)` plus the helpers `notFound`, `forbidden`, `conflict`. Codes come from contracts, so the app can switch on them. Messages are human and safe to show.

## Adding a feature module

1. Add schemas to `packages/contracts/src/<feature>.ts` and export them.
2. Add tables to `db/schema/<feature>.ts`, then run `bun run db:generate` and review the SQL.
3. Create `modules/<feature>/{<feature>.repo.ts, .service.ts, .routes.ts, index.ts}`. Repo functions take `(tx, scope, …)`.
4. Mount the router in `app.ts`: under `spaceScoped` if it belongs to a Space.
5. Add rows to `test/authz.test.ts`, plus a feature test.
6. `bun run lint && bun run typecheck && bun run test`.
