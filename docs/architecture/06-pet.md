# 6. The Pet

The **Pet** belongs to the Space, and both Members look after it together. It is the product's heartbeat, so its rules are deliberately gentle. It never dies, never gets sick, and never makes anyone feel guilty ([ADR 0003](../adr/0003-derived-pet-mood-and-soft-wellbeing.md)). All of its logic lives in `apps/api/src/modules/pet/` as small pure functions around one repository.

```
pet/
  bond.ts        BOND_RULES: what earns Bond, and daily caps
  growth.ts      nextStage(), eligibleMilestones()
  mood.ts        derivePetMood()
  wellbeing.ts   deriveWellbeing()
  pet.view.ts    row → Pet (applies the three above)
  pet.repo.ts    pets, pet_interactions, pet_milestones
  pet.service.ts growPet, hatchPet, care, naming, timeline, announcePet
```

## Life cycle

| Stage | Reached when |
|---|---|
| **egg** | The space is created (one Member) |
| **baby** | **Hatching**: the second Member joins (`hatchPet`, milestone `hatched`) |
| **young** | ≥ 14 days since hatching **and** Bond ≥ 150 |
| **grown** | ≥ 60 days **and** Bond ≥ 600 |

Stages only move forward. Both conditions are required, so you can't rush the Pet by grinding alone, and you can't just wait it out.

## Bond

Bond is a never-decreasing count of shared care, never shown as a number. Other modules call `growPet(tx, scope, source, subjectId)` inside their own transaction. It records an `activity_events` row, adds the Bond, checks for a new Stage, and records any Milestones. Each source has a **per-member cap per rolling 24 hours**:

| Source | Bond | Cap / 24h |
|---|---|---|
| Care (`pet.feed`, `pet.pet`, `pet.play`) | +1 each | 3 each |
| A Note | +3 | 3 |
| A journal Block | +3 | 3 |
| A photo | +1 | 5 |
| Sharing a Vibe | +2 | 1 |
| A quiz Revealed (both finished) | +8 | — |
| Daily question answered by both | +3 | — |
| A Future item stamped done | +10 | — |

(`space.both_active` is defined in `BOND_RULES` but nothing emits it yet.)

## Mood: derived, never stored

`derivePetMood` looks at four timestamps (`last_fed_at`, `last_played_at`, `last_petted_at`, `last_shared_activity_at`) and the viewer's local hour:

- Shared activity in the last 2 hours → **excited**
- 11pm–6am, or no care for 48 hours → **sleepy** (the worst it gets)
- Not fed for 20 hours → **peckish**
- Any care in the last 12 hours → **happy**
- Otherwise → **content**

No cron decays anything, so a Pet left alone for a month comes back sleepy, not sick.

## Well-being

Three soft states, each a value between `WELLBEING_FLOOR` (0.35, "calm") and 1, with a word:

| State | Filled by | Settles over | Words (high → calm) |
|---|---|---|---|
| Fullness | feeding | 20 h | full · content · peckish |
| Energy | playing | 24 h | bouncy · playful · cozy |
| Love | petting or any shared activity | 36 h | adored · loved · calm |

Care sets a state to 1, and it settles linearly back to the floor, **never below**. The Pet room shows the words first; the bars are only a gentle hint.

`lastCare` lists the latest care of each kind (`{ kind, byUserId, at }`). It's sent as data, not sentences, because the same `Pet` object is broadcast to both Members in `pet.updated`. Each app phrases it for its own viewer: "You fed Mochi · just now" on one phone, "Ananya fed Mochi · just now" on the other.

## Milestones

A Milestone is good news, recorded once. The primary key `(pet_id, kind)` makes recording idempotent. `eligibleMilestones()` returns everything the Pet currently qualifies for, and the repo keeps only the new ones.

- **Firsts:** first Note, first journal page, first photo, first shared Vibe, first Reveal, first Future item done.
- **Bond:** 50 · 150 · 400.
- **Together:** 30 days · 100 days.
- **Stage:** young · grown.
- **Life:** hatched · named.

Titles and lines are in contracts (`MILESTONE_COPY`) and use `{pet}` for the Pet's name.

## Announcing (after commit)

`growPet`, `hatchPet`, `care` and naming return a `PetOutcome { pet, name, milestones, pushAllowed, interaction? }`. After the transaction commits, `announcePet(scope, outcome)`:

1. publishes `pet.updated` (with the Pet and, for care, who did what, which drives the partner's live reaction animation);
2. sends the **latest** new Milestone to both Members as a `pet.milestone` Notice. It's pushed only if they opted into Pet updates and no Pet push went out in the last 20 hours (`pets.last_update_push_at`). Otherwise it's in-app only. See [Notifications](05-notifications.md).

When one request grows the Pet several times (a Block with three photos), `mergePetOutcomes` folds the results into a single announcement.

## Pet timeline

`GET /spaces/:sid/pet/timeline` returns every Milestone plus the 40 most recent care moments, newest first (up to 50 items). The Pet room shows it as a rail: Milestones as orange stickers with their line, care as small dots. The app groups back-to-back repeats ("You played with Mochi · twice").

## Naming

Either Member proposes a name, and the *other* accepts it (`POST /pet/name`, propose or accept). Accepting records the `named` Milestone. Until then the Pet is called by its species' default name (Mochi).

## Changing the art

Features only use the `<Pet stage mood size />` component from the design system. The current placeholder is code-drawn SVG (DESIGN §9). Swapping in illustrated or Rive art means changing that one component.
