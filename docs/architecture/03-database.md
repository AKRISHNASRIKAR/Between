# 3. Database (Postgres + Drizzle)

Postgres 16+ (18 locally, Neon in production). Drizzle ORM with `casing: "snake_case"`: TypeScript fields are camelCase and columns are snake_case. The schema is in `apps/api/src/db/schema/`, one file per area.

## Tables and who owns them

Each table is written by exactly one module's repo (see [API → Modules](02-api.md#modules)).

| Area | Tables | Notes |
|---|---|---|
| auth | `users`, `sessions`, `accounts`, `verifications` | Managed by Better Auth. `users` adds `timezone`. UUID ids |
| spaces | `spaces`, `space_members`, `space_invites` | At most 2 active members (trigger, migration 0001). Invites are stored as a **hash** of the code |
| pet | `pets`, `pet_interactions`, `pet_milestones` | One pet per space. Care timestamps (`last_fed_at`…) feed mood and Well-being. Milestones have PK `(pet_id, kind)`, so each is recorded once |
| activity | `activity_events` | Every bond-earning action, used for daily caps and audit |
| vibes | `mood_checkins` | One per member per local day (`unique(space_id, user_id, local_date)`); `visibility` is private/shared |
| notes | `notes` | `recipient_id` becomes null if the recipient deletes their account |
| quizzes | `quiz_packs`, `quiz_questions`, `quiz_sessions`, `quiz_participants`, `quiz_answers` | Partial unique indexes: one Daily per space per day, one open session per pack |
| future | `future_items` | `position` is a fractional index; `version` for optimistic concurrency |
| journal | `journal_pages`, `journal_blocks`, `journal_reactions`, `media` | A Memory is a `media` row attached to a Block ([ADR 0005](../adr/0005-journal-and-memories-are-one-model.md)) |
| notifications | `notification_prefs`, `push_tokens` | Prefs default on, except `pet_greeting` (Pet updates), which is opt-in |

## Conventions (`_columns.ts`)

- UUID primary keys, generated **by the client** for anything the app creates ([ADR 0008](../adr/0008-client-generated-ids.md)).
- `created_at`/`updated_at` as `timestamptz`. Local calendar days (Vibes, Journal pages, the Daily question) are stored as `date` plus the timezone that defined them.
- **Every content row carries `space_id`.** Child tables use a composite foreign key `(parent_id, space_id) → parent(id, space_id)`, so a row can never point at a parent in another space, even if application code has a bug.
- Soft delete (`deleted_at`) only where the UI offers undo or where a row must keep old references valid (Notes, Journal pages, Future items). Everything else is hard-deleted.

## Deleting and retention

| Event | What happens |
|---|---|
| A member **leaves** | The space becomes **closed** for both: `status = 'closed'`, `purge_after = now + 30 days`, members' `left_at` set, open invites revoked. It stays readable, not writable |
| 30 days later | The hourly job deletes the space's storage prefix, then the `spaces` row. Every space-owned table cascades |
| A member **deletes their account** | Their active space is closed as above, their photos are removed from storage, and their `users` row is deleted. That cascades to their sessions, push tokens and authored content. References that belong to the partner are set to null instead (`notes.recipient_id`, `spaces.created_by`, `pet_milestones.by_user_id`) |

## Migrations

Drizzle Kit generates SQL into `apps/api/drizzle/`, and it's reviewed like code.

```bash
bun --cwd apps/api db:generate   # after editing db/schema
```

```bash
bun --cwd apps/api db:migrate    # applies pending migrations (also run on deploy)
```

Hand-written SQL (triggers, partial indexes Drizzle can't express) goes into the generated file before it's committed. Tests run against a separate database from `.env.test`; `resetDb()` truncates between tests.

## Performance notes

- Hot paths are indexed on `(space_id, created_at desc, id desc)`, matching the keyset cursors.
- The journal is hydrated in three queries per page of results (pages → blocks → photos + loves), never N+1.
- Pet mood and Well-being are **derived on read** from a handful of timestamps, never stored or decayed by a cron ([ADR 0003](../adr/0003-derived-pet-mood-and-soft-wellbeing.md)).
