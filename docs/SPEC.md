# Love Notes: Product & Technical Specification

> **Status:** v0.2, for approval. **Date:** 2026-09-28
> **Companion:** [`/DESIGN.md`](../DESIGN.md) is the single source of truth for visual language.
> **Rule:** major implementation starts only after this plan is approved (§17).

---

## 0. Decision log

| # | Decision | Status |
|---|---|---|
| D1 | API framework: **Hono** (TypeScript), not NestJS | ✅ Agreed |
| D2 | Auth: **Better Auth**. Email OTP + Google + Sign in with Apple. No passwords. | ✅ (from v0.1) |
| D3 | Journal and Memories share **one data model**. Memories is the photo-first view of it, with its own "add memory" entry point. | ✅ (from v0.1) |
| D4 | Pet uses **derived moods, not draining meters**. Bond only increases. The pet never dies. | ✅ |
| D5 | Egg → Baby hatching happens when the partner joins, as part of the MVP | ✅ |
| D6 | Leaving a space **closes it for both**, with 30 days of read-only access and export, then a hard delete | ✅ Agreed |
| D7 | `expo-secure-store` (session) + `expo-sqlite` (`kv-store` persisted cache) | ✅ Agreed |
| D8 | Pet art: **code-drawn placeholder** (react-native-svg + Reanimated) behind a swappable `<Pet>` interface. Rive or an illustrator can come later. | ✅ Agreed |
| **D9** | **Free hosting: Cloudflare Workers (Hono) + Durable Objects (realtime) + R2 (media) + Neon Postgres via Hyperdrive.** Bun remains the package manager, script runner and test runner. | ⏸ **Deferred** (2026-09-28). The API runs on Bun locally. Realtime (`realtime/hub.ts`), the runtime entry point (`index.ts`) and storage are behind small adapters, so this stays open (§6.2) |
| **D10** | Quizzes and the daily question are **data-driven content packs** (JSON in the repo → synced to the DB), so new packs don't need an app release | 🆕 |
| **D11** | Moods are **private by default**. Nothing derived (pet mood, push, observations, the home screen) may leak a private mood. | 🆕 |
| **D12** | Navigation: **5 tabs**, which are Today · Know · Notes · Remember · Future. The pet lives on Today. | 🆕 |
| **D13** | **Light theme only** for launch. Tokens are dark-ready for V1. | 🆕 |

**Brief v2 vs this spec:** the new brief still lists NestJS. The spec follows your chat decision to use Hono. React Hook Form, Zustand and Expo Camera are evaluated in §7.1. The design references mentioned in the brief haven't been shared yet, so `DESIGN.md` v1 is derived from the written principles.

---

## 1. Challenging the concept (v2 additions)

### 1.1 What's compelling about the new pillars
- **Today's Vibe with privacy** is the right shape. Check-ins usually fail because they feel like surveillance. Making private the default and sharing a *gift* turns it into an act of trust.
- **Prediction quizzes** ("what would *they* choose?") are the strongest idea in v2. The fun comes from being surprised by the person you think you know. It creates conversation *outside* the app, which is exactly right for a non-chat product.
- **FEEL / KNOW / REMEMBER / BUILD** gives the app a spine. Every feature answers one question, and anything that doesn't fit shouldn't be built.

### 1.2 New risks
| Risk | Mitigation |
|---|---|
| **Mood data used as surveillance or pressure** ("you didn't share today?") | Private by default. No "partner hasn't checked in" nudges. No counters of how often someone shares. Unsharing is allowed. |
| **Mood leakage through side channels.** For example, the pet looking sad because of a private "Hurt". | D11: private moods are invisible to every system except the owner's own view. The pet never reflects moods at all, only shared *activity*. |
| **Negative shared moods treated flippantly** ("Angry + Hurt → 'Chaos day! 😂'") | Observations exist only for curated pairs. Any negative mood gets gentle, neutral copy or no observation. There are no clinical claims, and it isn't positioned as mental health. |
| **Quiz scores feeling like a compatibility test** | The metric is only answer agreement, labelled playfully (§4.3). There's no aggregate "compatibility %" or history of scores over time. |
| **Quiz content quality *is* the feature** | Launch needs about 200 genuinely good questions (§4.5). Treat it as content work with its own milestone. |
| **Home turns into a checklist** | A server-ranked list of **at most 3 "moments"** (§5.3). Anything done disappears, and nothing is shown as "incomplete". |
| **Scope creep: 7 features for a public launch** | Internal milestones, each shippable to testers, with an explicit cut line (§3.3). |
| **Long-distance couples in different timezones** | Moods use *each person's* local date. Daily questions use the space's timezone (settable). |
| **Free-tier limits at launch** | Chosen so the upgrade is config and ~$5/mo, not a rewrite (§6.2). |

### 1.3 What still stays out
Chat, groups, public or social surfaces, streaks, relationship scores, compatibility percentages, pet death, AI (before V2), E2EE (see §10.5), CRDT sync, GraphQL, Redis, microservices, a room editor, and multiple species at launch.

---

## 2. Product definition

**Love Notes** is a private little world for two people. You check in on how you feel, find out how well you know each other, leave things for each other, keep what happened, plan what's next, and look after a small creature together.

**Who it's for:** couples (especially long-distance couples or those on different schedules) who want something more intentional and more *playful* than chat. Close pairs like best friends or siblings are supported but not marketed to.

**The problem it solves:** meaningful moments get buried in chat, camera rolls and nowhere at all. There's no space that belongs to *both* of you, and no light, fun way to keep learning about each other.

**Why use it instead of the alternatives:**
- **WhatsApp:** everything drowns there.
- **Instagram:** it's performative.
- **Notion / Keep:** they're cold.
- **Paired / Agapé:** they're question apps with no shared world, no living presence, and no archive.

Love Notes combines all four pillars, and the pet ties them together.

**Pillars and the questions they answer:**
| Pillar | Feature | Question |
|---|---|---|
| FEEL | Today's Vibe | How are we today? |
| KNOW | Quizzes, daily question | How well do we know each other? |
| LEAVE | Love Notes | What do I want to leave for you? |
| REMEMBER | Journal + Memories | What happened to us / what do we keep? |
| BUILD | Our Future + Pet | What are we looking forward to / growing together? |

**Core loop:** open the app, then:
1. See today (your vibe, and theirs if shared).
2. See one or two things happening (a note is waiting, a reveal is ready, the pet has something).
3. Act on one of them.
4. Leave something back.
5. Close the app. A push notification brings you back when there's something for you.

It must never feel like a checklist. The home screen shows *moments*, never *tasks*.

**Why people stay for years:** the archive (journal, photos and completed dreams) and resurfacing ("on this day", V1), plus the slowly growing pet that carries your history.

---

## 3. Product architecture

### 3.1 Feature dependencies
```
Auth → Space + Pairing → Pet (hatch) → Today (home)
                 │
                 ├─ Vibe (moods) ───────────┐
                 ├─ Quizzes + Daily Q ◄─ Content packs
                 ├─ Notes                   ├─► ActivityService ─► pet bond
                 ├─ Journal ◄─ Media        │                   ─► realtime (SpaceRoom DO)
                 │    └─ Memories (view)    │                   ─► push
                 └─ Future ─────────────────┘                   ─► Today "moments"
```

### 3.2 Scope

**MVP = public launch (v1.0)**
- Auth (email OTP, Google, Apple) and profile
- Space creation, invite (code, link or QR), accept, **hatching ceremony**, naming the pet together
- **Today:** vibe cards, the pet, and up to 3 moments
- **Today's Vibe:** 12 moods, an optional short note, keep private or share, change during the day, unshare, and the **"Our vibes" monthly history**, plus gentle observations for shared pairs
- **Quizzes:** 5 categories and about 12 packs (each 8 questions). Question kinds are `choice` + prediction, `who`, and `open`. Includes waiting state, reveal choreography and playful results.
- **Daily question:** one per day per space. Both answer, then it's revealed.
- **Notes:** write, choose paper, delivered by the pet, envelope open, ♥
- **Remember:** journal pages with each partner's blocks and photos, plus a Photos grid and memory detail
- **Future:** tickets, add, reorder, complete with a stamp, and "add a memory of this"
- **Pet:** one species, Egg → Baby, feed, pet and play, derived moods, bond
- Push notifications (configurable, quiet hours), realtime, and presence
- Settings: profile, space, notifications, export, leave space, delete account

**V1.1+ (after launch, in impact order)**
1. "On this day" resurfacing
2. "Open When…" notes
3. Pet growth to Young and Grown, plus milestone keepsakes
4. App lock (Face ID)
5. Candlelit dark theme
6. More quiz packs (ongoing, no release needed)
7. Minimal pet room (wallpaper and one decoration)

**V2:** more species, room customization, yearly Memory Book (AI, opt-in), voice notes, places and map, widgets, localization.

### 3.3 Milestones and cut line
| Milestone | Contents | Testable alone? |
|---|---|---|
| M1 **Together** | Auth, pairing, hatch, Today shell, pet basics | Yes, two phones pair and a pet appears |
| M2 **Feel** | Vibe, privacy, history | Yes |
| M3 **Leave** | Notes | Yes |
| M4 **Know** | Quizzes, daily question, content packs | Yes |
| M5 **Remember** | Journal, media, photos | Yes |
| M6 **Build** | Future | Yes |
| M7 **Trust** | Notification prefs, export, leave, delete, lifecycle | — |
| M8 **Quality** | Polish, 5 audits (§15.4), beta, launch | — |

**Cut line if we're late** (these move to 1.1, in this order): mood observations, then the `open` quiz kind, then pet *play*, then memory detail animations. **Never cut:** privacy lifecycle, error and empty states, or authorization tests.

---

## 4. Feature design

### 4.1 Today's Vibe
- **12 moods:** Joyful, Excited, Grateful, Connected, Calm, Tired, Sensitive, Confused, Stressed, Insecure, Hurt, Angry. They're defined in the `contracts/moods.ts` registry, so adding one is data plus an illustration.
- **Check-in flow:**
  1. Tap *your* vibe card.
  2. A bottom sheet opens with a 3×4 grid of mood creatures.
  3. Selecting one plays the select animation. You can add an optional 140-character note.
  4. Choose **[Keep private]** or **[Share with Samantha]**. The share button is secondary and has equal weight, so there's no dark pattern.
- **One check-in per person per local day.** It can be changed or unshared that day. Yesterday's check-in is locked.
- **Partner card states:** not checked in or private (these look the same, so a private mood is **indistinguishable from none**; see D11), or shared.
- **Observations:** a curated table maps `(moodA, moodB)` pairs to phrases, with a lookup that ignores order. Examples:
  - Tired + Tired → "A quiet day for both of you."
  - Joyful + Excited → "Good energy in here today."
  - Any Hurt or Angry → no observation, or "Go gently today."

  Phrases live in `contracts/observations.ts`. They're never generated and never clinical.
- **Our vibes (history):** a month calendar. Each day shows two tiny creature dots (yours and theirs if shared). Tapping a day shows that day's cards. It's a visual memory, with no charts and no statistics.

### 4.2 Quizzes
**Question kinds**
| Kind | You answer | Reveal | Scoring |
|---|---|---|---|
| `choice` | Your own pick **and** your guess of theirs (two steps: "What would *you* choose?" then "What would *Samantha* choose?") | Your answer, your guess, their answer. The same for them. | +1 for each correct guess; also "matched" if you both picked the same |
| `who` ("Who gets lost first?") | Me or them | Side by side | Agreement |
| `open` ("First impression of me?") | Free text, max 280 characters | Side by side in `hand-l` | Not scored |

**Pack structure:** 8 questions (a mix of kinds), with a category and a creature illustration. Categories: About Me (sky), Favorites (butter), Personality (purple), Relationship (pink) and Chaos (orange).

**Flow:** Know tab → packs grid → pack intro → 8 question cards → "Done! Waiting for Samantha 👀" (partner progress shows as "5/8") → push "Samantha finished — ready to reveal?" → reveal sequence card by card (the choreography in DESIGN §10.3) → result card.

**Rules**
- Answers are **hidden from the partner until both have completed the whole quiz.** This is enforced server-side, and the API never returns partner answers before then.
- Answers are **immutable once the quiz is submitted** (you can change them freely until then, and they're stored locally).
- Each person can start any pack. The partner gets "Krishna started *Chaos Couple*". Only one active instance per pack per space is allowed, and completed packs can be replayed later.

**Results** (derived by a pure function, never stored as a "score of the relationship"):
| Agreement / correct guesses | Label |
|---|---|
| ≥ 85% | 🧠 Same Brain |
| 65–84% | You Know Them Well |
| 45–64% | Surprisingly Similar |
| 25–44% | Still Learning Each Other |
| < 25% | Opposites, Apparently |
| Chaos pack, any | Chaos Couple (with the numbers) |

The exact tiers and copy live in `contracts/quizResults.ts`.

**Daily question:** a single question drawn from the `daily` pool. It's the same for both people in the space's local day, and selection avoids repeats for that space. It's the same mechanic as packs (1 question), with a reveal when both have answered. Unanswered questions quietly expire and move into "past questions", where they can still be answered.

### 4.3 Love Notes
Unchanged from v0.1:
- Compose on paper (500 characters) in `hand-l`, with 4 stocks. Send folds the note and flies it to the pet.
- The recipient sees an envelope, the pet delivers it, and swiping opens it with an unfold.
- ♥ reaction. "Save to journal" pins the note to that day's page.
- The author can edit a note until it's opened and delete it at any time. The Notes tab is a wall of notes, with filters "For me" and "From me".

### 4.4 Remember (Journal + Memories)
- **Pages** are dated (multiple per date allowed) with an optional title. Each partner adds their own **blocks** (text and/or photos). Blocks are edited only by their author. ♥ on pages. Text supports bold and italic only.
- **Photos** (the Memories segment) is a month-grouped grid of every photo. Memory detail shows the framed photo, caption, date, and a link to its page.
- **"Add memory"** is a fast path: pick photos, add a caption, pick a date. It creates a page with one photo block.
- There's a Timeline view (pages) and a Grid view (photos). "On this day" comes in 1.1.

### 4.5 Our Future
Tickets with title, optional emoji and optional note. Features:
- Categories: dream, place, watch, try, goal (a chip filter)
- Add, reorder, and complete with a stamp and celebration, then "Add a memory of this?"
- A "Done" section

### 4.6 Pet
- **State:** `bond` (only goes up and is never shown as a number) and `mood`, which is **derived** at read time from `last_*_at` fields plus server time:
  - `sleepy`: 48h with no shared activity, or local night
  - `peckish`: not fed in 20h. It's cosmetic only.
  - `excited`: shared activity in the last 2h
  - `happy` / `content`: otherwise
- **Never influenced by moods** (D11).
- **Bond sources (with daily caps):**

  | Source | Bond | Daily cap |
  |---|---|---|
  | Note | +3 | 3 |
  | Journal block | +3 | 3 |
  | Photos | +1 each | 5 |
  | Shared mood | +2 | 1 |
  | Quiz completed by both | +8 | — |
  | Daily question both answered | +3 | — |
  | Dream done | +10 | — |
  | Feed, pet, play | +1 each | 3 each |
  | Both active same day | +5 | — |

- **Hatches** when the second member joins. Growth to later stages comes in 1.1.
- **Pet lines** (the speech bubble) come from a data registry keyed by context. Examples:
  - "Good morning ☀"
  - "Ananya left you something"
  - "You're both here!"
  - "Guess what… a reveal is ready"
- **Species registry:** `{id, stages, renderer, accessorySlots}`. The MVP renderer is the SVG Mochi, and it can be replaced later without touching features.

---

## 5. UX architecture

### 5.1 Navigation model (D12)
```
Root Stack
├── (auth)        welcome → sign-in → otp → your-name
├── (onboarding)  start-or-join → create-space → invite → waiting | join/[code] → confirm → hatch → name-pet
└── (app)
    ├── (tabs)
    │   ├── today      Today: header(date, avatar→settings) · vibe cards · pet · ≤3 moments
    │   ├── know       daily question card · packs by category · past quizzes
    │   ├── notes      wall (for me / from me) · [Leave a note]
    │   ├── remember   segmented: Pages | Photos · [Add]
    │   └── future     tickets (open) · Done section · [Add]
    ├── vibe/checkin (sheet) · vibe/history
    ├── pet            full-screen pet room (feed · pet · play · rename)
    ├── quiz/[packId]/intro · quiz/[instanceId]/play · quiz/[instanceId]/waiting · quiz/[instanceId]/reveal
    ├── daily/[id]     answer / reveal
    ├── notes/new · notes/[id] (open/read)
    ├── journal/new · journal/[pageId] · memory/[mediaId]
    ├── future/[id]
    └── settings/…     profile · space · notifications · privacy (export, leave, delete) · about
Deep links: lovenotes://invite/{code} · /notes/{id} · /quiz/{id} · /daily/{id} · /journal/{id}
```
Why 5 tabs: they map one-to-one to FEEL, KNOW, LEAVE, REMEMBER and BUILD. The pet is a *presence* on Today rather than a destination. Settings sits behind your avatar.

### 5.2 Onboarding and pairing
1. **Welcome:** an egg in a nest. "A little corner of the internet that's just yours."
2. **Sign in:** Apple, Google or email (6-digit code).
3. **Your name** and an optional avatar.
4. **Start or join.**

**Start path (A):**
1. Name the space (optional) and your "together since" date (optional).
2. The egg appears: "It hatches when you're both here."
3. Invite screen: an 8-character code (`MOCH-7K2P`), Share link, and a QR code.
4. Waiting room: the egg wobbles. A can leave a first note, which will be waiting for B.

**Join path (B):**
1. Enter the code or open the link.
2. Confirm: "Join Krishna's space?"
3. **Hatch ceremony,** live on both phones.
4. **Name the pet together:** one proposes a name, the other taps ♥ to agree.
5. If A left a note, it's delivered right away.

### 5.3 Today: "What's happening between us today?"
```
TUESDAY                                   (avatar)
Sep 29

TODAY'S VIBE
 ┌─────────┐ ┌─────────┐       ← tilted ±2°, the signature asymmetry
 │  (you)  │ │(partner)│
 └─────────┘ └─────────┘
 "A quiet day for both of you."           (only if both shared + curated)

      (Mochi on rug)  ─ "Ananya left you something"
      [feed] [pet] [play]

 ── up to 3 moments ──
 💌 A note is waiting            → opens envelope
 🧠 Reveal ready: Chaos Couple   → reveal
 ? Today's question              → answer
```
**Moment ranking** (server, pure function `rankMoments`, unit-tested):
1. Hatch or naming pending
2. Unopened notes
3. A reveal ready and unseen (quiz or daily)
4. Daily question: your turn
5. Partner is waiting on you in a pack
6. Partner added photos or a page since your last visit
7. A dream completed by your partner since your last visit
8. (1.1) On this day

Only the top 3 are shown. Items vanish once acted on. **Nothing ever says "you haven't…"**

### 5.4 Key screen states (Definition of Done, §15.3)
Every screen specifies: loading (a layout-matched skeleton), empty (illustration + warm copy + one action), error (what happened, what to do, retry), offline (cached content + a small "offline" pill), and success.

Quiz states specifically: question → answer selected → submitting → waiting (partner progress) → both done → reveal → result.

Pet states: idle → interaction → reaction → updated.

### 5.5 Settings and lifecycle
- **Notifications:** per-category toggles (notes, vibes shared, quizzes, journal/photos, future, pet greeting), plus quiet hours.
- **Privacy:** export (a zip link emailed and shown in the app), leave space (D6), delete account.

---

## 6. System architecture

### 6.1 Overview
```
Expo app ──HTTPS──► Cloudflare Worker (Hono API) ──Hyperdrive──► Neon Postgres
   │   ◄──WebSocket──┐        │  └─ env.SPACE_ROOM (Durable Object, 1 per space)
   │                 └────────┘      • WS fan-out + presence (hibernation API)
   │                                 • push debounce & quiet-hours queue (alarms)
   ├──presigned PUT/GET──► R2 (media)
   └──◄── Expo Push (APNs/FCM) ◄── Worker (ctx.waitUntil)
Cron Triggers: media cleanup · push receipts · purge closed spaces
```

### 6.2 Why this hosting (D9: needs approval)
You asked for free hosting. Free, always-on hosting with WebSockets is rare:

| Option | Cost | Always-on WS | Scale for a public launch | Ops |
|---|---|---|---|---|
| **Cloudflare Workers + DO + R2 + Neon** | **$0** to start, then ~$5/mo Workers Paid | ✅ (DO hibernation) | ✅ Excellent | Minimal |
| Render / Koyeb free (Bun server) | $0 | ❌ sleeps after idle and kills sockets | ❌ | Low |
| Oracle Cloud Always-Free VM (Bun server) | $0 | ✅ | ⚠️ Single VM | High (TLS, updates, backups, flaky signup) |
| Fly.io / Railway | Paid (no real free tier now) | ✅ | ✅ | Low |

**Recommendation: Cloudflare.**
- **Hono is Cloudflare-native.** Code written for Hono runs almost unchanged on Bun.
- **Durable Objects give one "room" per couple.** That's exactly our realtime model: presence, fan-out and per-space alarms, with no Redis or job queue.
- **R2 has zero egress fees** (10 GB free).
- **Neon free** gives 0.5 GB of Postgres, which is plenty for text and metadata since media lives in R2.

What changes compared with v0.1:
- The API *runtime* is `workerd`, not Bun. Bun remains the package manager, test runner and script runner.
- `pg-boss` is replaced by DO alarms plus Cron Triggers.

**Free-tier limits to watch** (verify at setup, because they change):
- Workers: 100k requests/day and **10ms CPU per request**. DB wait time doesn't count toward CPU.
- Neon: 0.5 GB, and compute auto-suspends, causing a cold start of ~0.3–1s after idle.
- Resend: 100 emails/day for OTP.

The upgrade path is config plus about $5–25/mo, not a rewrite.

**Portability:** services are runtime-agnostic (they take `db` and `deps`). Only `worker.ts`, the DO class and the storage adapter are Cloudflare-specific. Moving to a Bun server later means writing one new entry file and a WebSocket hub.

**Unavoidable costs that aren't hosting:** the Apple Developer Program ($99/yr, needed for iOS distribution and Sign in with Apple) and Google Play ($25 once). EAS's free tier covers development builds and updates. Local builds are free.

---

## 7. Technical architecture

### 7.1 Dependency decisions
| Library | Decision | Reason |
|---|---|---|
| Expo (latest stable SDK), TypeScript, Expo Router | ✅ | Base. **Development builds**, not Expo Go. |
| NativeWind (latest stable major at scaffold time) | ✅ | Theme is generated from `design-system/tokens.ts`. |
| Reanimated + Gesture Handler | ✅ | All motion and gestures. |
| react-native-svg | ✅ | Illustrations and the pet (D8). |
| expo-haptics | ✅ | Through the semantic map in DESIGN §10.4 only. |
| expo-notifications | ✅ | Push. |
| expo-secure-store | ✅ | Session token. |
| expo-sqlite (`kv-store`) | ✅ | TanStack Query persister and outbox. |
| expo-image | ✅ | With `cacheKey = media.id` (signed URLs rotate). |
| expo-image-picker | ✅ | Gallery and camera capture. |
| expo-image-manipulator | ✅ | Resize and compress before upload. |
| expo-camera | ❌ | The image picker covers capture. Would only be needed for QR *scanning*, and we'll use the code or link instead. Revisit only if QR scanning proves necessary. |
| TanStack Query | ✅ | Server state, cache and offline mutations. |
| Zustand | ❌ for now | No global client state exists that Query, the URL or local state can't hold. Quiz drafts go in local state persisted to kv-store. Add Zustand only when a real cross-screen need appears. |
| React Hook Form | ❌ | Our forms have 1–3 fields. Controlled inputs plus Zod `safeParse` inline is enough. |
| Zod | ✅ | Shared schemas in `packages/contracts`. |
| phosphor-react-native | ✅ | The single icon set. |
| @expo-google-fonts (Fraunces, DM Sans, Caveat) | ✅ | Typography. |
| @shopify/flash-list | Maybe | Only if the photo grid or note wall shows jank in profiling. |
| **API:** hono, @hono/zod-validator, drizzle-orm + drizzle-kit, postgres (driver), better-auth, aws4fetch (R2 presign) | ✅ | Minimal and edge-compatible. |
| Redis, pg-boss, Nest, GraphQL, Rive (for now) | ❌ | See §1.3 and D8/D9. |

### 7.2 Mobile
- **Structure:** feature folders (§13). Route files are thin.
- **Data:** a typed Hono RPC client (`hc<AppType>`), with feature hooks wrapping TanStack Query. Query keys are `['space', spaceId, feature, …]`.
- **Realtime:** one WebSocket in the foreground. Events are routed to `setQueryData` or `invalidateQueries`.
- **Session:** the Better Auth Expo client plus SecureStore. Route groups have redirect guards.
- **Design system:** the only styling source. Lint forbids hex values and font properties outside it.

### 7.3 API (modular monolith on Workers)
Each module has `routes.ts` (thin) → `service.ts` (all rules, runtime-agnostic) → `repo.ts` (Drizzle, SpaceScope-required).

**Modules:** `auth`, `users`, `spaces`, `moods`, `quizzes` (+ `content` sync), `notes`, `journal`, `media`, `future`, `pet`, `activity`, `realtime` (DO client), `notifications`, `today`, `export`, `lifecycle`.

**Middleware:** request ID, logger (redacting), session, `requireSpaceMember`, rate limit (per-user counters in the space DO or the Workers Rate Limiting binding), and a central error handler.

### 7.4 Auth
- Better Auth (Drizzle adapter), with bearer sessions for mobile.
- Providers: email OTP (Resend), Google, and Apple (available once the Apple developer account exists; until then, email OTP is enough for development).
- Sessions last 60 days and slide.
- The WebSocket authenticates via its first message, never through the URL.

### 7.5 Media
The client resizes each photo to a 2048px main image and a 480px thumbnail (EXIF location stripped), then:
1. `POST /media/uploads` (validation + quota) returns presigned R2 PUT URLs.
2. The client PUTs the files directly to R2.
3. `POST /media/:id/complete` (the server HEADs the objects to verify).

For reading, responses carry presigned GET URLs valid for 1 hour. Photos never pass through the Worker, which keeps usage well within the free request limits.

Cleanup runs on a Cron Trigger. The quota is 5 GB per space.

### 7.6 Notifications
`ActivityService` sends to the SpaceRoom DO, which:
1. Checks the recipient's prefs and quiet hours (queued with an alarm until quiet hours end).
2. Debounces photo events for 2 minutes.
3. Sends through the Expo Push API.

A Cron Trigger checks receipts and prunes dead tokens. **Notification bodies never contain private content.**

### 7.7 Errors
- **Envelope:** `{error:{code,message}}` with codes from `contracts/errors.ts`.
- **Status codes:** cross-space and unknown resources return **404**. Version conflicts return 409, validation failures 422, rate limits 429.
- **Client:** each error code maps to warm copy (DESIGN §11). Screen-level ErrorState has a retry button. Form errors appear inline at the field.
- **Monitoring:** Sentry free tier on the app and Worker, with content never logged.

---

## 8. Database model (PostgreSQL)

**Conventions:**
- Primary keys are UUIDv7. For user-created rows, the ID is the **client-generated** UUID, so inserts are idempotent via `ON CONFLICT DO NOTHING`.
- Timestamps are `timestamptz`.
- Every content row has `space_id NOT NULL`.
- Child → parent references use **composite FKs `(parent_id, space_id)`**, so cross-space references are impossible at the DB level. Parents declare `UNIQUE (id, space_id)`.

### 8.1 Identity and spaces
```sql
users(id PK, email citext UNIQUE, email_verified bool, display_name text(1..40), avatar_key text?,
      timezone text DEFAULT 'UTC', created_at, deleted_at?)
-- Better Auth: session, account, verification (FK users.id, cascade)

spaces(id PK, name text DEFAULT 'our little corner', together_since date?, timezone text NOT NULL,
       status text CHECK IN ('active','closed') DEFAULT 'active', closed_at?, purge_after?,
       created_by FK users, created_at)

space_members(space_id FK spaces CASCADE, user_id FK users CASCADE, role CHECK IN ('owner','member'),
              joined_at, left_at?, PRIMARY KEY(space_id,user_id))
  UNIQUE INDEX one_active_space_per_user ON (user_id) WHERE left_at IS NULL
  -- ≤2 active members: service tx with SELECT … FOR UPDATE on spaces + BEFORE INSERT trigger backstop

space_invites(id PK, space_id FK CASCADE, code_hash bytea UNIQUE, created_by FK users,
              expires_at, accepted_by?, accepted_at?, revoked_at?, created_at)
  INDEX (space_id) WHERE accepted_at IS NULL AND revoked_at IS NULL
```

### 8.2 Moods
```sql
mood_checkins(
  id PK, space_id, user_id FK users, local_date date NOT NULL,
  mood text NOT NULL,                        -- registry id, validated in service
  note text? CHECK (length<=140),
  visibility text NOT NULL DEFAULT 'private' CHECK IN ('private','shared'),
  shared_at timestamptz?, created_at, updated_at, version int DEFAULT 0,
  UNIQUE (space_id, user_id, local_date),
  FOREIGN KEY (space_id) REFERENCES spaces ON DELETE CASCADE,
  CHECK ((visibility='shared') = (shared_at IS NOT NULL))
)
INDEX (space_id, local_date DESC)
-- Partner reads ALWAYS filter visibility='shared' in the repo; there is no repo method that returns a partner's private row.
```

### 8.3 Quizzes (data-driven)
```sql
-- Content (global, not space-scoped; synced from /content/quizzes/*.json)
quiz_packs(id PK, slug text UNIQUE, category text CHECK IN ('about_me','favorites','personality','relationship','chaos','daily'),
           title, subtitle, creature text, sort int, is_published bool, content_version int, updated_at)

quiz_questions(id PK, slug text UNIQUE, pack_id FK quiz_packs?, kind CHECK IN ('choice','who','open'),
               prompt_self text,             -- "What's your ideal weekend?"
               prompt_guess text?,           -- "What's {partner}'s ideal weekend?" (choice only)
               options jsonb?,               -- [{id:'home', label:'Staying home + movies', glyph:'🏠'}] (choice only)
               position int, is_daily bool DEFAULT false, is_published bool, retired_at?)
-- Published questions are immutable in meaning; edits = retire + new slug (so old answers stay coherent).

-- Per-space play
quiz_sessions(id PK, space_id FK CASCADE, pack_id FK quiz_packs?, kind CHECK IN ('pack','daily'),
              question_ids uuid[] NOT NULL,  -- snapshot at start
              daily_date date?,              -- kind='daily'
              started_by FK users, created_at, ready_at?,   -- ready_at = both completed (reveal unlocked)
              UNIQUE(id, space_id))
  UNIQUE INDEX one_daily_per_day ON quiz_sessions(space_id, daily_date) WHERE kind='daily'
  UNIQUE INDEX one_active_pack   ON quiz_sessions(space_id, pack_id) WHERE kind='pack' AND ready_at IS NULL

quiz_participants(session_id, space_id, user_id FK users, completed_at?, reveal_seen_at?,
                  PRIMARY KEY(session_id,user_id), FK (session_id,space_id) → quiz_sessions(id,space_id) CASCADE)

quiz_answers(session_id, space_id, question_id FK quiz_questions, user_id FK users,
             choice text?, guess text?,      -- choice: option ids; who: 'self'|'partner' normalized to user ids server-side
             who_user_id uuid?, text_answer text? CHECK(length<=280),
             answered_at, PRIMARY KEY(session_id, question_id, user_id),
             FK (session_id,space_id) → quiz_sessions(id,space_id) CASCADE)
```
**Secrecy rule (in `QuizService`, tested):**
- A partner's `quiz_answers` rows are returned **only if `quiz_sessions.ready_at IS NOT NULL`**.
- Before that, the API returns only the partner's progress count.
- `ready_at` is set in the same transaction as the second participant's `completed_at`.
- Answers can't be written after `completed_at`.

### 8.4 Notes, journal, media, future
```sql
notes(id PK, space_id FK CASCADE, author_id FK users, recipient_id FK users,
      body text(1..500), paper text CHECK IN ('cream','blush','kraft','sky'),
      unlock_at?, unlock_label?,                 -- 1.1 "Open When"
      opened_at?, reacted_at?, created_at, updated_at, deleted_at?, CHECK(author_id<>recipient_id))
  INDEX (space_id, created_at DESC) WHERE deleted_at IS NULL
  INDEX (space_id, recipient_id) WHERE opened_at IS NULL AND deleted_at IS NULL

journal_pages(id PK, space_id FK CASCADE, page_date date, title text(≤80)?, future_item_id?,
              created_by FK users, created_at, updated_at, version int, deleted_at?, UNIQUE(id,space_id))
  INDEX (space_id, page_date DESC, created_at DESC) WHERE deleted_at IS NULL

journal_blocks(id PK, space_id, page_id, author_id FK users, kind CHECK IN ('text','photos'),
               body text(≤5000)?, position text /*fractional index*/, created_at, updated_at, version int,
               FK (page_id,space_id) → journal_pages(id,space_id) CASCADE, UNIQUE(id,space_id))
  INDEX (page_id, position)

journal_reactions(page_id, space_id, user_id FK users, created_at, PRIMARY KEY(page_id,user_id),
                  FK (page_id,space_id) → journal_pages CASCADE)

media(id PK, space_id FK CASCADE, uploaded_by FK users, block_id?, position smallint,
      storage_key text, thumb_key text, mime, bytes int, width int, height int,
      caption text(≤280)?, taken_at?, status CHECK IN ('pending','ready'), created_at,
      FK (block_id,space_id) → journal_blocks(id,space_id) ON DELETE SET NULL)
  INDEX (space_id, coalesce(taken_at,created_at) DESC) WHERE status='ready'
  INDEX (block_id, position)
  INDEX (created_at) WHERE status='pending' OR block_id IS NULL      -- cleanup

future_items(id PK, space_id FK CASCADE, title text(1..120), emoji?, note text(≤500)?,
             category CHECK IN ('dream','place','watch','try','goal') DEFAULT 'dream',
             position text, created_by FK users, completed_at?, completed_by?,
             created_at, updated_at, version int, deleted_at?,
             CHECK ((completed_at IS NULL) = (completed_by IS NULL)))
  INDEX (space_id, completed_at NULLS FIRST, position) WHERE deleted_at IS NULL
```

### 8.5 Pet, activity, notifications
```sql
pets(id PK, space_id FK UNIQUE CASCADE, species text DEFAULT 'dog', name text(≤24)?,
     name_proposed text?, name_proposed_by?,            -- naming-together handshake
     stage text DEFAULT 'egg', bond int DEFAULT 0 CHECK(bond>=0), hatched_at?,
     last_fed_at?, last_played_at?, last_petted_at?, last_shared_activity_at?,
     appearance jsonb DEFAULT '{}', version int, created_at, UNIQUE(id,space_id))

pet_interactions(id PK, space_id, pet_id, user_id FK users, kind CHECK IN ('feed','pet','play'),
                 bond_delta smallint, created_at, FK (pet_id,space_id) → pets(id,space_id) CASCADE)
  INDEX (space_id, user_id, created_at DESC)

activity_events(id PK, space_id FK CASCADE, actor_id FK users, kind text, subject_id uuid?,
                bond_delta smallint DEFAULT 0, created_at)
  INDEX (space_id, created_at DESC)
  INDEX (space_id, actor_id, kind, created_at DESC)      -- daily caps
  -- private mood check-ins are NOT recorded here (D11)

user_visits(user_id, space_id, last_seen_at, PRIMARY KEY(user_id,space_id))   -- "since your last visit" moments

push_tokens(token PK, user_id FK CASCADE, platform CHECK IN ('ios','android'), created_at, last_seen_at)
notification_prefs(user_id PK FK CASCADE, notes, vibes, quizzes, journal, future, pet_greeting bool,
                   quiet_start time?, quiet_end time?)
```

### 8.6 Relationships (summary)
```
users ─< space_members >─ spaces ─┬─ 1 pets ─< pet_interactions
                                  ├─< space_invites
                                  ├─< mood_checkins
                                  ├─< quiz_sessions ─< quiz_participants
                                  │                 └─< quiz_answers >─ quiz_questions >─ quiz_packs
                                  ├─< notes
                                  ├─< journal_pages ─< journal_blocks ─< media
                                  │                 └─< journal_reactions
                                  ├─< future_items ─0..1→ journal_pages
                                  └─< activity_events
```

---

## 9. API design

REST + JSON under `/v1`, typed end to end (Hono RPC + shared Zod schemas). Every create takes a client `id`. Lists are cursor-paginated. Editable shared fields use `version` + `If-Match`, and a mismatch returns 409 with the current resource.

```text
# Auth & me
/v1/auth/*                                  (Better Auth)
GET    /v1/me                               bootstrap: profile, active space summary, partner, pet
PATCH  /v1/me · DELETE /v1/me
GET|PUT /v1/me/notification-prefs
PUT|DELETE /v1/me/push-tokens/:token

# Spaces & pairing
POST   /v1/spaces                           create (+ egg)
GET|PATCH /v1/spaces/:sid
POST   /v1/spaces/:sid/invites              → { code, url, expiresAt }
DELETE /v1/spaces/:sid/invites/current
GET    /v1/invites/:code                    preview (auth required, rate-limited)
POST   /v1/invites/:code/accept             join → hatch
POST   /v1/spaces/:sid/leave
POST   /v1/spaces/:sid/exports · GET /v1/spaces/:sid/exports/:id

# Today
GET    /v1/spaces/:sid/today                { date, vibe:{me, partner|null, observation?}, pet, moments[≤3] }
POST   /v1/spaces/:sid/visits               mark seen (for "since last visit")

# Vibe
PUT    /v1/spaces/:sid/moods/:localDate     { mood, note?, visibility }   (upsert own; today only)
POST   /v1/spaces/:sid/moods/:localDate/share · /unshare
GET    /v1/spaces/:sid/moods?month=2026-09  own (all) + partner (shared only)

# Quizzes
GET    /v1/quiz-packs                       published catalog (global, cacheable, ETag)
POST   /v1/spaces/:sid/quiz-sessions        { id, packId } → session + questions
GET    /v1/spaces/:sid/quiz-sessions?status=active|ready|done
GET    /v1/spaces/:sid/quiz-sessions/:qsid  my answers + partner progress (+ partner answers iff ready)
PUT    /v1/spaces/:sid/quiz-sessions/:qsid/answers/:questionId   { choice?, guess?, who?, text? } (until complete)
POST   /v1/spaces/:sid/quiz-sessions/:qsid/complete
POST   /v1/spaces/:sid/quiz-sessions/:qsid/reveal-seen
GET    /v1/spaces/:sid/daily                today's daily session (created lazily)

# Notes
GET    /v1/spaces/:sid/notes?box=inbox|sent&cursor
POST   /v1/spaces/:sid/notes · GET|PATCH|DELETE /v1/spaces/:sid/notes/:nid
POST   /v1/spaces/:sid/notes/:nid/open · PUT|DELETE /v1/spaces/:sid/notes/:nid/reaction

# Journal & memories
GET|POST /v1/spaces/:sid/journal/pages · GET|PATCH|DELETE …/pages/:pid
POST   …/pages/:pid/blocks · PATCH|DELETE /v1/spaces/:sid/journal/blocks/:bid
PUT|DELETE …/pages/:pid/reaction
POST   /v1/spaces/:sid/media/uploads · POST …/media/:mid/complete · PATCH|DELETE …/media/:mid
GET    /v1/spaces/:sid/memories?cursor

# Future
GET|POST /v1/spaces/:sid/future · PATCH|DELETE …/future/:fid
POST   …/future/:fid/complete · …/uncomplete

# Pet
GET|PATCH /v1/spaces/:sid/pet
POST   /v1/spaces/:sid/pet/interactions     { id, kind }
POST   /v1/spaces/:sid/pet/name             propose | accept

# Realtime
GET    /v1/realtime                         WebSocket upgrade → forwarded to the space's DO
```
The API never accepts a `userId` to act as, or act on, another user. The actor always comes from the session.

---

## 10. Security model

### 10.1 "User A tries to access Space B"
1. **Gate:** `requireSpaceMember` looks up `(spaceId, session.userId, left_at IS NULL)`. If there's no row, it returns **404** (so spaces can't be enumerated). Otherwise it creates a branded `SpaceScope`, which is read-only if the space is closed.
2. **Scoped repositories:** every repo function takes a `SpaceScope` (it can't accept a raw `spaceId`) and always adds `WHERE space_id = scope.spaceId`. A resource ID from another space simply isn't found. Routes can't import `db` (enforced by lint).
3. **Database:** composite FKs make cross-space references impossible. Unique constraints enforce one active space per user. Postgres RLS is optional and planned as hardening in 1.1.
4. **Realtime:** the Worker resolves the space from membership, then forwards to *that* space's DO. The client never names a room.
5. **Media:** a private bucket, unguessable keys (`spaces/{sid}/media/{uuidv7}/…`), and URLs signed only after the membership check, valid for 1 hour. PUT presigns are bound to key, type and length.
6. **Privacy-specific rules:** private moods and unrevealed quiz answers have **no read path** to the partner. They're tested explicitly.
7. **Invites:** about 40 bits of entropy, stored hashed, single-use, 7-day expiry, rate-limited, and rejected if the space is full or the user is already in a space.
8. **Authz test matrix:** generated from the route table. For every space-scoped route, user A using B's IDs gets 404. New routes are included automatically.

### 10.2 Data lifecycle
- **Leave or delete:** the space closes (read-only), the partner is told gently, and both can export for 30 days. Then a Cron Trigger purges the DB rows and the R2 prefix.
- **Account deletion:** personal data (sessions, tokens, profile) is removed immediately.
- **Backups:** Neon point-in-time restore with a short retention, documented in the privacy policy.

### 10.3 Transport, secrets and logging
- TLS everywhere.
- Secrets live in `wrangler secret` and CI secrets. `.env.example` has names only.
- Logs redact bodies, notes, answers, moods and tokens.

### 10.4 Client
- The token lives in SecureStore.
- No content goes into analytics or crash reports.
- App lock comes in 1.1.

### 10.5 Why not E2EE yet
Losing recovery (a new phone means losing memories) breaks the permanence promise. E2EE also blocks exports and future opt-in features. We'll say so honestly on the privacy page, and revisit it for opt-in "locked notes" in V2.

---

## 11. Realtime strategy

**WebSockets via a Durable Object per space** (the `SpaceRoom` DO).
- **SSE:** there's no native `EventSource` in React Native, and it's one-way. Presence needs client→server messages.
- **Polling:** wastes battery and has poor latency for presence.
- **DO hibernation:** keeps idle sockets nearly free.

| Event | Why realtime |
|---|---|
| `space.member_joined`, `pet.hatched`, `pet.named` | The hatching ceremony is live on both phones |
| `presence` | "Both here" moments, the partner avatar dot |
| `pet.updated` (+ interaction, `together`) | Co-presence with the pet |
| `mood.shared` / `mood.unshared` | The partner card flips live *(private check-ins emit nothing)* |
| `quiz.progress`, `quiz.ready` | "Samantha is answering 👀", then the reveal unlocks |
| `note.created`, `note.opened` | The envelope appears, and the sender sees "opened" |
| `journal.*`, `media.ready`, `future.*` | Keeps screens fresh (cache patches) |

**Flow:**
1. A service commits to Postgres.
2. `ActivityService.record` calls `SPACE_ROOM.get(sid).publish(event)` via `ctx.waitUntil`.
3. The DO broadcasts to connected sockets (except the actor's device) and queues push for recipients who are offline.

**Client:**
- Connect only while in the foreground.
- Backoff on reconnect: 1s, 2s, 4s, capped at 30s, with jitter.
- **On every reconnect, invalidate the visible queries.** There's no event replay, so refetching is simpler and correct.
- Events are deduplicated by `id` + `version`.

---

## 12. Offline strategy

The goal is "feels instant, tolerates bad networks". This isn't a sync engine.
- **Cache:** TanStack Query persisted to `expo-sqlite/kv-store`, so every screen renders from cache on a cold start.
- **Optimistic, with an outbox** (paused mutations persisted and resumed on reconnect), prioritized by benefit:
  - Mood check-in and share
  - Note send
  - Pet interactions
  - Quiz answers (answers save locally per question, and `complete` goes through the outbox)
  - Future add and complete
  - Reactions
  - Journal text blocks
- **Idempotency:** client UUIDs plus `ON CONFLICT DO NOTHING`, so retries never duplicate.
- **Conflicts:**
  - Most content is author-owned, so there's no conflict.
  - Shared fields (page title and date, future item title and position) use version + If-Match. On a 409, the server version wins and we show a gentle toast.
  - Pet interactions are commutative events.
  - Mood is per user per day, so it's single-writer.
- **Image upload queue:** a persisted state machine (`resized → presigned → uploaded → completed → attached`). Files stay in the document directory until confirmed, and uploads are retried on reconnect or foreground. Blocks show local URIs until then.
- **Reconnection order:** resume the outbox, then reconnect the WebSocket, then invalidate visible queries.
- **Not offline in the MVP:** starting a new quiz pack (it needs server question snapshots), invites, export and leave.

---

## 13. Repository structure

```
lovenotes/
├── package.json            # Bun workspaces: apps/*, packages/*
├── bunfig.toml             # [install] linker = "hoisted"  (Metro needs hoisted node_modules)
├── tsconfig.base.json      # strict, noUncheckedIndexedAccess
├── biome.json              # lint + format
├── DESIGN.md
├── docs/SPEC.md · docs/adr/
├── content/
│   └── quizzes/            # *.json packs + daily pool (validated by contracts schema, synced by script)
├── packages/
│   └── contracts/          # zod schemas, DTOs, error codes, realtime events, limits,
│                           # registries: moods, observations, species, pet lines, quiz result tiers
├── apps/
│   ├── api/
│   │   ├── wrangler.jsonc  # Worker, DO binding, R2, Hyperdrive, crons
│   │   ├── src/
│   │   │   ├── worker.ts          # fetch/scheduled entry → Hono app
│   │   │   ├── app.ts             # route composition, exports AppType
│   │   │   ├── env.ts             # zod-validated bindings
│   │   │   ├── db/ schema/*.ts client.ts scope.ts
│   │   │   ├── middleware/
│   │   │   ├── modules/<module>/ routes.ts service.ts repo.ts *.test.ts
│   │   │   ├── realtime/SpaceRoom.ts   # Durable Object
│   │   │   └── lib/ ids.ts errors.ts cursor.ts storage.ts push.ts
│   │   ├── drizzle/        # committed SQL migrations
│   │   ├── scripts/ content-sync.ts seed-dev.ts
│   │   └── test/           # integration (local Postgres), authz matrix
│   └── mobile/
│       ├── app.config.ts · eas.json · global.css · tailwind.config.ts (reads design-system/tokens.ts)
│       ├── assets/ fonts/ textures/
│       └── src/
│           ├── app/                 # Expo Router routes (thin), per §5.1
│           ├── features/
│           │   ├── auth/ space/ today/ mood/ pet/ notes/ quizzes/ journal/ memories/ future/ settings/
│           │   │   └── (each) components/ hooks/ api.ts keys.ts
│           ├── design-system/       # tokens, primitives, objects, illustrations (DESIGN §13)
│           ├── hooks/               # cross-feature hooks (useSpace, useNetwork, useReduceMotion)
│           └── lib/  api.ts auth.ts query.ts realtime.ts media-queue.ts push.ts haptics.ts
└── .github/workflows/ci.yml   # typecheck · lint · test · migration check · content validation
```
The brief's `services/`, `store/` and `types/` folders are intentionally absent. Services live inside features, there's no global store, and types come from `contracts`.

---

## 14. Implementation plan

Each step ends with the Definition of Done (§15.3) checked **in the iOS Simulator at two sizes (iPhone SE and a Pro Max-class phone)**, and on an Android emulator where available.

| Step | Work | Verify |
|---|---|---|
| **0. Scaffold** | Bun monorepo, contracts, Biome, strict TS, CI. Expo app (dev build) + NativeWind + fonts + tokens from DESIGN.md. Hono Worker + Drizzle + local Postgres (Docker) + `wrangler dev`. | Simulator shows a token-driven test screen, and the Worker health route responds |
| **1. Design-system core** | Text, Button, TextField, CodeField, Chip, Screen, Sheet, Modal, Toast, Skeleton, EmptyState, ErrorState, Avatar, tab bar, motion/haptics, and **MoodCreature + Pet (egg and baby)** illustrations | A design-system gallery screen (dev-only) showing every state, reviewed at both sizes |
| **2. M1 Together** | Auth (email OTP first, Google, Apple once the account exists), spaces, invites, deep link, the authz middleware + scoped repos + **authz matrix**, SpaceRoom DO, presence, hatch, pet naming, Today shell, pet interactions | Two simulators pair and hatch live. Cross-space tests pass. |
| **3. M2 Feel** | Mood check-in, privacy, share and unshare, partner card, observations, history | Private-mood leak tests. Every state visible. |
| **4. M3 Leave** | Notes + push pipeline (prefs, quiet hours, debounce) | Offline send, then reconnect delivers once |
| **5. M4 Know** | Content schema, sync script, **~200 written questions**, packs, sessions, secrecy, reveal choreography, daily question | Secrecy tests. The full quiz state flow on two devices. |
| **6. M5 Remember** | Media pipeline (R2 or local MinIO in dev), journal pages and blocks, Photos grid, memory detail | 20 photos on a throttled network with none lost |
| **7. M6 Build** | Future tickets, stamp, link to a memory | — |
| **8. M7 Trust** | Settings, export, leave, delete, purge cron | End-to-end lifecycle test |
| **9. M8 Quality** | 5 parallel audit subagents (§15.4), a consolidated fix pass, re-verify | All P0 and P1 fixed, with P2 and P3 fixed where practical |
| **10. Launch prep** | Cloudflare and Neon production setup, EAS builds, store assets, privacy policy, TestFlight beta | — |

**Things you'll need to provide along the way:**
- A Cloudflare account (and authorize the Cloudflare connector for deploys)
- A Neon account
- A Resend key
- An Apple Developer account (before Apple sign-in, push on iOS devices, and TestFlight)
- A Google Play console
- The design references, whenever you're ready

---

## 15. Engineering rules

### 15.1 Code
1. TypeScript strict + `noUncheckedIndexedAccess`. No `any`.
2. **All I/O shapes are defined once** as Zod schemas in `contracts`. Limits live in `contracts/limits.ts`.
3. API: routes → service → repo. Rules live only in services. SQL lives only in repos. Modules never import another module's repo.
4. **Every space-scoped repo takes a `SpaceScope`.** Routes never import `db`.
5. Side effects (bond, realtime, push) go only through `ActivityService.record`, after commit.
6. Pure domain logic (mood derivation, bond caps, rankMoments, quiz scoring and secrecy, observations, invite codes) lives in pure functions with unit tests.
7. Mobile: feature folders, thin routes, and no `fetch` in screens. Query keys come from `keys.ts`.
8. **Styling only through DESIGN.md tokens and design-system components.** Lint bans hex values, `fontSize` and `fontFamily` outside `design-system/`.
9. New dependencies need a one-line justification. No UI kits.
10. Migrations only through drizzle-kit, committed, and backward-compatible (expand, then contract).
11. Every create is idempotent (client UUID). Every list is paginated.
12. No secrets in the repo. The environment is Zod-validated at boot.
13. Never log content. Errors use contract codes, mapped to warm copy.
14. Accessibility labels on every pressable. Dynamic Type and Reduce Motion are respected.
15. Small commits with conventional messages. CI must be green.

### 15.2 Tests
- **Unit:** `bun test` on pure logic.
- **Integration:** `bun test` services against local Postgres.
- **Authz matrix** and **privacy tests:** private moods, unrevealed answers.
- **Content validation:** in CI.
- **Mobile flows:** Maestro E2E for pair, check-in, note and quiz before beta.

### 15.3 Definition of Done (per feature)
Code, then UI to DESIGN.md, then interactions and animations, then loading, then empty, then error (with retry), then success, then offline behavior, then realtime behavior, then small and large phones, then largest Dynamic Type, then VoiceOver labels, then tests, then a simulator verification with screenshots.

### 15.4 Pre-ship audits (M8)
Five parallel subagents:
1. Design consistency and readability
2. Mobile layout across sizes
3. Every state
4. Security and privacy (authz, leakage, logging)
5. Performance and realtime/offline reliability

Findings use the format: Location / Severity (P0–P3) / Problem / Expected / Recommended fix. Then: merge and deduplicate, fix P0 to P3, re-run, verify, and do a targeted re-audit.

---

## 16. Risks and removed complexity

**Top risks**
1. **Scope** (7 features at launch). Mitigated by milestones and the cut line (§3.3).
2. **Quiz content quality.** Mitigated by a dedicated content step and review.
3. **Code-drawn pet and illustration quality.** Mitigated by a strict style formula (DESIGN §8) and a swappable renderer.
4. **Free-tier limits** (Worker CPU, Neon cold starts, Resend 100/day). Mitigated by monitoring and a ~$5 upgrade path.
5. **Timezone edge cases for long-distance couples.** Mitigated by per-user local dates for moods, the space timezone for daily questions, and tests.
6. **App Store review** (account deletion in the app, Sign in with Apple, no health claims). Covered in the design.
7. **Cloudflare coupling.** Mitigated by runtime-agnostic services and an isolated adapter.

**Removed as unnecessary:** NestJS, Redis, pg-boss, Zustand, React Hook Form, expo-camera, Rive (for now), GraphQL, RLS (deferred), CRDT or sync engine, rich text editor, multiple species, room editor, per-question reveal, compatibility score, streaks, E2EE (for now), and dark mode (V1).

---

## 17. Approval checklist

- [ ] **D9:** Cloudflare Workers + DO + R2 + Neon for free hosting (API runtime = workerd; Bun for tooling)
- [ ] 5-tab navigation (D12) and the Today "moments" model
- [ ] MVP scope + cut line (§3.2–3.3)
- [ ] Quiz mechanics (choice + prediction, who, open; reveal after the whole quiz)
- [ ] Mood privacy rules (D11)
- [ ] DESIGN.md v1 (fonts: Fraunces / DM Sans / Caveat; palette; light only)
- [ ] Implementation plan (§14). I start at Step 0 on approval.
