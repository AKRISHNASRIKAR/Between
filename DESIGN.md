# Love Notes: Design System

> **This file is the single source of truth for how Love Notes looks and moves.**
> Screens never invent their own colors, type, spacing, radii, shadows, or motion. If something is missing, add it here first, then to `apps/mobile/src/design-system/tokens.ts`, and only then use it.
>
> Status: **v1.0 draft (2026-09-28).** This version is derived from the written brief. When the visual references arrive, I'll refine the values; the token *names* stay stable.

---

## 1. Principles

| Principle | What it means in practice |
|---|---|
| **Editorial** | Big serif headlines, confident hierarchy, lots of air. A screen reads like a magazine spread, not a form. |
| **Tactile** | Content is made of *objects*: paper notes, tickets, photos with tape, mood creatures. Objects have weight, press down, flip, and unfold. |
| **Personal** | Handwriting appears only where a *person* speaks. The software itself never uses handwriting. |
| **Warm** | A cream foundation and warm near-black. Never pure white `#FFF` or pure black `#000`. |
| **Restrained** | One primary action per screen. At most **two accent families visible at once**, not counting mood and illustration content. |
| **Slightly weird** | Tiny rotations, one asymmetric element per screen, and *riso misregistration* on illustrations (§8). Weirdness is placed deliberately and never random. |

**The heart test:** remove every heart glyph from a screen. If it no longer looks like Love Notes, the design is leaning on clichés. Hearts are allowed only as a reaction glyph.

**Don'ts:** Material look-alikes, gradients (except the illustration grain in §8), neon, glassmorphism, Valentine red/pink everywhere, uniform rounded cards everywhere, heavy drop shadows, and anything that looks like a kids' game.

---

## 2. Color

All colors live in `tokens.ts` and are exposed to NativeWind as semantic classes. **Hex values never appear in components.** Contrast ratios were verified against WCAG 2.1 (AA: 4.5:1 for text, 3:1 for large text and UI).

### 2.1 Foundation

| Token | Hex | Use | Contrast |
|---|---|---|---|
| `canvas` | `#FAF6EE` | App background (warm cream) | — |
| `paper` | `#FFFDF8` | Raised objects: note paper, sheets, inputs | — |
| `sunken` | `#F2EBDF` | Wells, inactive chips, skeletons, tab bar | — |
| `paper-kraft` | `#E9D8BC` | Kraft note stock only | ink 12:1 |
| `line` | `#E5DCCC` | Hairlines and dividers | — |
| `line-strong` | `#CBBFAA` | Input borders, dashed placeholders | — |
| `ink` | `#1D1A17` | Primary text, primary button fill, illustration outlines | 17:1 on paper |
| `ink-secondary` | `#4D463F` | Body copy that should recede, secondary labels | 8.6:1 on canvas |
| `ink-tertiary` | `#6F665D` | Metadata, timestamps, placeholders | 5.2:1 canvas / 4.75:1 sunken |
| `ink-disabled` | `#A89E92` | Disabled text only (exempt from contrast rules) | 2.4:1 |
| `on-ink` | `#FAF6EE` | Text and icons on `ink` fills | 17:1 |
| `scrim` | `#1D1A17` @ 40% | Behind modals and sheets | — |

### 2.2 Accents

Each accent has three steps:
- **`base`** for fills (card backgrounds, illustrations).
- **`soft`** for tinted backgrounds, selected states and chips.
- **`deep`** for text or icons drawn on canvas or on its own `soft` step.

| Family | base | soft | deep | ink on base | deep on canvas / soft |
|---|---|---|---|---|---|
| `sky` | `#9CCBF2` | `#E3F0FB` | `#1D5A8C` | 10.1 | 6.7 / 6.3 |
| `butter` | `#F7D774` | `#FBF0C8` | `#735400` | 12.3 | 6.5 / 6.1 |
| `coral` | `#F4876E` | `#FCE2DA` | `#A3371F` | 7.0 | 6.2 / 5.5 |
| `pink` | `#F2A7C3` | `#FBE3EC` | `#9B2F5C` | 9.2 | 6.6 / 5.9 |
| `purple` | `#B9A2EC` | `#ECE4FB` | `#5B3FA3` | 7.8 | 7.3 / 6.4 |
| `orange` | `#F7A149` | `#FDE6CC` | `#8A4700` | 8.4 | 6.5 / 5.8 |
| `green` | `#86C9A0` | `#DDF1E4` | `#1F653D` | 9.0 | 6.5 / 6.0 |
| `cobalt` | `#2F4FE0` | `#DFE4FC` | `#2A45C4` | ✗ 2.7, use `on-ink` (6.2) | 7.1 / 6.1 |

Rule: text on any `base` fill uses `ink`, **except cobalt, which uses `on-ink`**.

### 2.3 Semantic meaning (UI chrome)

| Meaning | Family | Where |
|---|---|---|
| Calm / *you* | `sky` | The Today (Feel) pillar, your own state |
| Joy / energy | `butter` | Celebrations, the Remember pillar |
| Affection | `pink` | Notes pillar, reactions |
| Reflection | `purple` | Know pillar (quizzes) |
| Playful | `orange` | The pet, play interactions, Chaos quizzes |
| Completed / positive | `green` | Future completion stamps, success toasts, "shared" confirmations |
| Focus / selection | `cobalt` | Focus rings, selected radio/option outlines, links |
| Attention / error | `coral` | Error text (`coral-deep`), destructive actions, "new" dots |

**Pillar mapping** (used for tab indicators, section eyebrows and empty-state illustrations):

| Pillar | Tab | Family |
|---|---|---|
| Feel | Today | `sky` |
| Know | Know | `purple` |
| Leave | Notes | `pink` |
| Remember | Remember | `butter` |
| Build | Future | `green` |
| Pet | (Today, Pet room) | `orange` |

**Identity markers** mark who wrote something: `you` uses `cobalt`, and `partner` uses `coral`. They appear only as a small dot or underline next to authorship, never as large fills. They are never gendered.

### 2.4 Mood palette

Moods are expressive content, so they may use any family. Each mood is defined in `packages/contracts/src/moods.ts` (id, label, family, tone, shape) and drawn by `<MoodCreature>`.

| Mood | Family / tone | Shape (§8) |
|---|---|---|
| Joyful | butter / base | Sun circle with short rays |
| Excited | orange / base | Eight-point starburst |
| Grateful | pink / base | Half-circle bowl, eyes closed with a smile |
| Connected | coral / base | Two overlapping circles |
| Calm | sky / base | Wide pebble, eyes closed |
| Tired | sunken + line-strong | Melting semicircle, droopy eyes |
| Sensitive | purple / base | Four-petal blob |
| Confused | purple / soft | Squiggle-edged circle with one raised brow |
| Stressed | cobalt / base (`on-ink` face) | Jagged square |
| Insecure | sky / soft | Small shape half-hidden behind a line |
| Hurt | pink / soft | Blob with a small plaster |
| Angry | coral / base | Triangle with furrowed brows |

### 2.5 Dark mode
The MVP ships **light only** (`userInterfaceStyle: "light"`). The cream foundation *is* the identity. Tokens are theme-ready: a "candlelit" dark theme (warm brown-black `#1A1613` canvas) is planned for V1, and it only changes token values.

---

## 3. Typography

Three families, all free on Google Fonts and loaded with `@expo-google-fonts/*`.

| Role | Family | Why |
|---|---|---|
| **Display** | **Fraunces** (600, 500, 400 italic) | Soft, slightly wonky editorial serif. It's warm and a bit weird, never corporate. |
| **UI** | **DM Sans** (400, 500, 600, 700) | A clean, modern, friendly grotesk with good small-size legibility. |
| **Hand** | **Caveat** (500, 600) | Handwriting for *people's words only*: notes, quotes, annotations and captions. |

### 3.1 Scale

Line heights are absolute px. Letter spacing is in px (React Native units).

| Token | Family / weight | Size | Line height | Tracking | Max font scale | Use |
|---|---|---|---|---|---|---|
| `display-xl` | Fraunces 600 | 48 | 50 | -1.2 | 1.2 | Screen hero ("Tuesday"), reveal results ("SAME BRAIN") |
| `display-l` | Fraunces 600 | 36 | 40 | -0.8 | 1.25 | Screen titles ("Our future") |
| `display-m` | Fraunces 500 | 28 | 32 | -0.4 | 1.3 | Card headlines, quiz questions |
| `heading` | DM Sans 700 | 18 | 24 | -0.2 | 1.4 | Section headings, list item titles |
| `body` | DM Sans 400 | 16 | 24 | 0 | 1.6 | Default text |
| `body-sm` | DM Sans 400 | 14 | 20 | 0 | 1.6 | Secondary text |
| `caption` | DM Sans 500 | 12 | 16 | 0.2 | 1.6 | Metadata, timestamps |
| `button` | DM Sans 600 | 16 | 20 | 0.1 | 1.4 | Buttons |
| `label` | DM Sans 700, UPPERCASE | 12 | 16 | 1.2 | 1.4 | Eyebrows ("TODAY'S VIBE"), chips |
| `label-sm` | DM Sans 700, UPPERCASE | 10 | 12 | 0.8 | 1.3 | Tab bar labels only |
| `hand-l` | Caveat 600 | 28 | 32 | 0 | 1.4 | Note body, reveal answers |
| `hand-m` | Caveat 500 | 22 | 26 | 0 | 1.5 | Captions, annotations, journal pull quotes |
| `numeral` | Fraunces 600, tabular | 56 | 56 | -1.5 | 1.1 | Scores ("8/10"), counters ("43 days") |

Rules:
- Use `<Text variant="…">` only. Never set `fontFamily`, `fontSize` or `fontWeight` directly.
- Use a maximum of three type sizes per card.
- Display type is **never** used for UI controls. Hand type is **never** used for UI copy or buttons.
- Journal body text is `body` for readability. `hand-m` is reserved for pull quotes and captions.
- Truncate or wrap, never shrink. Only `display-xl` may use `adjustsFontSizeToFit` (min scale 0.7), for one-word heroes.

---

## 4. Spacing & layout

**Spacing scale** (`space-*`): `0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80`
Tailwind classes map one-to-one (`p-4` = 16). Any other value needs a comment explaining why it's deliberate.

| Layout token | Value |
|---|---|
| Screen gutter | 20 |
| Section gap (between blocks on a screen) | 32 |
| Card inner padding | 20 (compact variant: 16) |
| Stack gap inside a card | 12 |
| Grid gap (mood grid, photo grid) | 12 (photo grid: 4) |
| Max content width | 560 (centered on tablets and large phones in landscape) |
| Minimum touch target | 44 × 44 (use `hitSlop` when the visual is smaller) |
| Tab bar | 64 + bottom safe-area inset |

Every screen uses `<Screen>`, which applies safe areas, the gutter, max width and keyboard avoidance. No screen hand-rolls its insets.

---

## 5. Radius

| Token | Value | Used by |
|---|---|---|
| `r-paper` | 3 | Notes, journal pages, photos, tickets (paper isn't a rounded rectangle) |
| `r-sm` | 10 | Chips, small buttons, inputs, thumbnails |
| `r-md` | 16 | Standard buttons, quiz options, toasts |
| `r-lg` | 24 | Cards (vibe, quiz, pet), bottom-sheet top corners |
| `r-xl` | 32 | Hero cards (Today's hero, reveal card) |
| `r-pill` | 999 | Pills, avatars, tab indicator |

The same component type always uses the same radius. Card *personalities* (§7.3) come from shape, material and details, not from random radii.

---

## 6. Elevation

Shadows are rare and warm (tinted with `ink`, never grey-blue). There are only three levels.

| Token | iOS shadow | Android | Use |
|---|---|---|---|
| `lift-0` | none | none | Most things. Separate with color and space instead. |
| `lift-1` | `ink` @ 8%, y 2, blur 8 | elevation 2 | Paper objects resting on the canvas (notes, photos, tickets) |
| `lift-2` | `ink` @ 12%, y 8, blur 24 | elevation 6 | Things being held or dragged, sheets, modals |

**Pressed objects drop from `lift-1` to `lift-0`** as they scale down, so they feel like you're pressing paper into the table. There is also one "stroke" treatment instead of a shadow: `1.5px ink` outlines on illustrations, stickers and the secondary button.

---

## 7. Components

Every component lives in `src/design-system/`. Feature code composes these and never restyles them. Each component documents its states. **Every interactive component must implement every applicable state.**

### 7.1 Global interaction states

| State | Treatment |
|---|---|
| **Default** | As specced |
| **Pressed** | Scale `0.97` (spring `snappy`), shadow steps down one level, `selection` haptic for selectable items only |
| **Selected** | `cobalt` 2px outline (inset 0) + `soft` tint of the component's family + a check glyph where meaning isn't otherwise clear. Selection is **never communicated by color alone.** |
| **Focused** (keyboard, a11y) | 2px `cobalt` ring offset by 2px |
| **Disabled** | Opacity `0.4`, no press feedback, `accessibilityState.disabled` |
| **Loading** | Content replaced by `<Dots>` (three ink dots bouncing in sequence). Width is locked to prevent layout shift, and the component isn't pressable. |
| **Error** | `coral-deep` text below the element, `coral-base` 1.5px border on inputs, `warning` haptic once. The message says **what happened + what to do**. |
| **Success** | A transient green check morph (400ms), then back to default or navigate away |

### 7.2 Primitives

**Button**

| Variant | Fill | Text | Border | Height | Radius |
|---|---|---|---|---|---|
| `primary` | `ink` | `on-ink` | — | 56 (lg) / 48 (md) | `r-md` |
| `secondary` | `paper` | `ink` | 1.5 `ink` | 56 / 48 | `r-md` |
| `quiet` | transparent | `ink` + underline on press | — | 44 | — |
| `accent` | family `base` | `ink` (cobalt: `on-ink`) | — | 48 | `r-pill` (used only for delight moments such as "Reveal ✦") |
| `icon` | `sunken` | `ink` icon 22 | — | 44 × 44 | `r-pill` |
| `destructive` | `paper` | `coral-deep` | 1.5 `coral-deep` | 48 | `r-md` |

Only one `primary` per screen. Buttons are full width in forms and sheets, and hug their content elsewhere.

**Input** (`TextField`, `CodeField`, `TextArea`)
- Fill `paper`, 1.5px border `line-strong`, `r-sm`, height 52, horizontal padding 16. Text is `body` and the placeholder is `ink-tertiary`.
- The label sits above in `label` style, and help or error text sits below in `caption`.
- States: focused gives a `cobalt` border. Error gives a `coral-base` border and `coral-deep` message. Disabled gives a `sunken` fill.
- `CodeField` (invite code): 8 boxes with a dash after the 4th. Uses `display-m` numerals. Pasting auto-splits the code. On error, the boxes shake (x ±6, 3 cycles, 300ms).

**Chip**: height 36, `r-pill`, `label` text, default `sunken`. When selected: family `soft` + a 1.5px outline in the family `deep` color + a check glyph.

**Tabs (bottom bar)**
- `sunken` background with a top hairline in `line`. Five items: icon (24) + `label`.
- The active item uses an `ink` icon (filled weight) and label, with a 6px dot in its pillar color under the label. The dot slides between tabs (spring `gentle`). Inactive items use `ink-tertiary`.
- No floating action button. Each screen has its own single primary action.

**Segmented control** (e.g. Remember: Pages | Photos): `sunken` track with an `r-pill` `paper` thumb (`lift-1`). The thumb slides using `gentle`.

**Navigation header**
- No platform nav bar chrome. Large-title screens use a `label` eyebrow over a `display-l` title, left aligned.
- Pushed screens show a back `icon` button top-left and an optional action top-right.
- On scroll, the title collapses to a centered `heading`, with a `canvas` background and hairline.

**Modal**: a centered `paper` card with `r-xl` and `lift-2` over the `scrim`. Enters with `scale 0.94→1` + `opacity`, using `gentle`. Used only for confirmations.

**Bottom sheet**: `paper`, `r-lg` top corners, a grabber (36×4, `line-strong`), `lift-2`. Snap points come from content height (max 90%). Drag to dismiss. Enters from the bottom using `gentle`. It's keyboard-aware and grows above the keyboard. Used for check-ins, compose shortcuts and pickers.

**Toast**: at the top, below the safe area. `ink` fill, `on-ink` text, `r-md`, auto-dismisses after 3s, and can be swiped up. Success variant: green check icon. Error variant: coral icon with a "Retry" quiet button.

**Avatar**: `r-pill`. Sizes 28, 40, 64. There's a 2px identity ring (`cobalt` for you, `coral` for your partner). A presence dot (green, 10px, with a `paper` 2px ring) shows when the person is online.

**Skeleton**: `sunken` blocks with the target shape's radius, and a shimmer sweep (a `paper` @ 60% band, 1200ms loop). Reduce Motion replaces the shimmer with a static fill. Skeletons **match the final layout**.

**EmptyState**: an illustration (160px, pillar family) + `display-m` title + `body` line + an optional single `secondary` button. The copy is warm and specific ("No memories yet. Start saving little moments together."). Never "No data".

**ErrorState**: the pet illustration looking puzzled + `heading` saying what happened + `body-sm` saying what to do + a `secondary` "Try again" button. Uses `coral` only in the icon accent.

### 7.3 Content objects (each has its own personality)

| Object | Material and shape | Details |
|---|---|---|
| **VibeCard** | Tinted fill that contrasts with its creature: the family `soft` behind a `base`-tone creature, the family `base` behind a `soft`-tone creature, or `sunken` for neutral moods. `r-lg`, roughly square (1:1.1) | A large `<MoodCreature>` (88px), with the mood name in `display-m` (shrinks to fit on one line) and the owner in `label` below. States: *empty-you* is a dashed `line-strong` outline on `canvas` with the prompt "How are you?". *Private* shows your mood with a lock chip ("only you"). *Hidden-partner* is `sunken` with a sleeping creature and "Not shared yet". *Shared* is full color. The two cards sit side by side with a **±2° opposite tilt**, which is the home screen's signature asymmetry. |
| **NoteCard / Envelope** | `paper-*` stock with `r-paper`, a subtle paper grain texture (4% noise PNG) and a piece of tape at the top | Body in `hand-l`. Rotation is seeded by the note id (±1.5°). Paper stocks: `cream` (`paper`), `blush` (`pink-soft`), `kraft` (`paper-kraft`), `sky` (`sky-soft`). A sealed note is an envelope (a triangular flap in the stock color with a wax dot in the pillar `pink-base`). |
| **QuizCard** | A category-family `base` fill, `r-xl`, tall (3:4) | Category eyebrow in `label`, question in `display-m` (ink), options as `paper` rows (`r-md`, 56 high) with an illustrated or emoji leading glyph. For the reveal, the card has a back face (`ink` fill, `on-ink` text) that flips around the Y axis. |
| **MemoryCard** | A photo with a 6px `paper` border and `r-paper`, `lift-1`, with two tape corners | Caption in `hand-m` below the frame. In the grid, photos are borderless squares, 4px apart. In detail, the frame border returns. |
| **PetCard** | **Not a rectangle.** The pet stands on an `orange-soft` ellipse "rug", with no card container | A speech bubble (`paper`, `r-md`, 1.5 `ink` stroke, tail) holds the pet's line in `body`, never hand. Action buttons are three `icon` buttons with orange glyphs. |
| **FutureTicket** | Looks like a ticket: `paper`, `r-paper`, with notched half-circle cut-outs on both sides at 70% width and a dashed perforation line | Title in `heading`, optional emoji "stub" on the right. When completed, a rotated (-8°) `green-deep` stamp reads "DONE · 27 SEP" with a rough-edged circular border, and the ticket shifts to `green-soft`. |
| **JournalPage** | `paper`, `r-paper`, full width, with a faint `line` ruling every 28px behind text blocks | Date in `display-m` and title in `heading`. Each block has an identity-colored author marker (4px left rule + name in `caption`). |
| **QuestionOfTheDay** | A `purple-soft` card, `r-lg`, with a purple "?" creature peeking over the top edge (clipped) | States: *your turn*, *waiting* (partner avatar with animated dots), and *reveal ready* (`accent` button "Reveal ✦"). |
| **WellbeingCard** | `paper`, `r-lg`, in the Pet room below the pet | Three rows (Fullness / orange, Energy / sky, Love / pink): a bold glyph, the label in `body-sm`, a soft bar (family `soft` track, `base` fill, springs to its value) and the word in `hand-m`, family `deep`, right-aligned with 4px right padding so the script face isn't clipped. Bars **never empty**: calm is about a third full. Below, up to three `caption` lines in `ink-tertiary` saying who cared ("You fed Mochi · 2h ago"). Never red, never a warning. |
| **PetTimeline** ("Mochi's story") | No container: a 2px `line` rail with entries hanging off it | Milestones are a 24px `orange-base` disc with a filled sparkle, the title in `heading` and the line in `body`. Care is an 8px `line-strong` dot with `body-sm` `ink-secondary` text, and back-to-back repeats collapse ("· twice"). Times in `caption`. |

### 7.4 Notices (in-app notifications)

A Notice is news delivered by the pet. In the app it appears as a **NoticeCard**, and when the app is closed the same words arrive as a push with the Love Notes chime.

| Part | Spec |
|---|---|
| Surface | `paper`, `r-md`, 1px border in the pillar family `soft`, `lift-2`, full width minus the gutter (max content width), 8px below the safe area |
| Pillar tape | A 4px band in the family `base` across the top edge (notes pink, today sky, know purple, remember butter, future green, pet orange) |
| Messenger | A 48px `r-pill` badge in the family `soft`, with the pet (current stage and mood, 52px so it peeks out of the circle) |
| Text | Pillar label in `label-sm` family `deep`; title in `heading` (up to 2 lines); body in `body-sm` `ink-secondary` (up to 2 lines) |
| Motion | Slides in from the top (`spring.gentle`), follows the finger when dragged up, dismisses past 24px; fades out in `dur.fast`. Auto-dismisses after 5 seconds, one at a time, queue of up to 3 |
| Feedback | `haptics.tick` on arrival, `haptics.tap` when opened |
| Behaviour | Tap opens the Notice's link. It's skipped if you're already on that screen. In the foreground, pushes also show as a NoticeCard, never as the system banner |
| Accessibility | `alert` role, polite live region, label = title + body, actions "Open" and "Dismiss" |
| Sound (push only) | `chime.wav`: two soft bell tones, E6 → B6, ~0.9s. Warm, never an alarm |

Copy lives in `noticeCopy()` (contracts), written in the pet's voice where it fits ("Mochi is holding something for you"). Pet updates are good news only and opt-in (at most one push a day).

---

## 8. Illustration language

**Style formula:** geometric primitives + an expressive face + one riso offset.
1. **Shapes:** circles, half-circles, pebbles, triangles, rounded squares, starbursts and petals. No realistic anatomy.
2. **Faces:** dot eyes (4px), single-stroke mouths, and occasionally brows. The face carries all of the emotion.
3. **Line:** a 2px `ink` outline with round caps and joins.
4. **Fill:** flat accent `base` color, **offset 3px down and right from the outline** (riso misregistration). This is the signature "slightly weird" detail.
5. **Imperfection:** outlines are drawn slightly wobbly (hand-authored SVG paths, never perfect primitives).
6. **Color:** at most two accent families per illustration, plus ink.

Implemented as `react-native-svg` components in `design-system/illustrations/`, with animatable parts (eyes, mouth, limbs) exposed as Reanimated props. Uses:
- Mood creatures
- Quiz category creatures (About Me = sky mirror-blob, Favorites = butter star, Personality = purple cloud, Relationship = pink two-circles, Chaos = orange scribble-burst)
- Empty states (the pet plus an object)
- Error states (the pet looking puzzled)
- Loading (the pet's tail wag)
- Celebrations (confetti made of small geometric shapes in 3 families)

**Emoji** are allowed only in *user content* (dream stubs, option glyphs in quiz packs, reactions). They're never used for UI chrome, navigation or states.

**Icons:** use **Phosphor** (`phosphor-react-native`) as the only icon set. Use the *Bold* weight for inactive and *Fill* for active states, at 22–24px, colored `ink` or `ink-tertiary`. Never mix icon sets.

---

## 9. The pet (placeholder art, code-drawn)

Name: **Mochi** (the default; renameable). Species: `dog`. Built from the illustration formula so it fits in until an illustrator replaces it behind the same `<Pet>` interface.

- **Body:** a squishy mochi-shaped rounded rectangle (wider than tall, 5:4) in `butter-base`, with riso offset.
- **Ears:** two floppy rounded triangles in `orange-base`, which rotate independently.
- **Face:** dot eyes that blink, a tiny `ink` nose triangle, and a mouth line that changes per mood.
- **Tail:** a short curl that wags (rotation).
- **Egg:** an off-white `paper` egg with an `ink` outline and three speckles (sky, pink and butter). It wobbles every 4–7s, randomly.
- **Stages:** `egg`, then `baby` (head 70% of body, big eyes). In V1, `young` and `grown` come from proportion changes only.
- **Moods to animation:**
  - *sleepy*: eyes become closed arcs, slow breathing (scaleY 1→1.02, 3s), and a "z" glyph drifting up.
  - *content*: idle breathing (2.4s) with a blink every 3–6s.
  - *happy*: plus an ear bounce every few seconds.
  - *excited*: little hops (translateY −8 using `bouncy`) and a fast tail.
  - *peckish*: looks toward the bowl icon and licks its lips.
- **Reactions:**
  - *Pet* (stroke gesture): eyes squint into happy arcs, ears flatten, and a `light` haptic ticks every 120ms.
  - *Feed*: the bowl slides in, the pet does three chomps (scale pulses), then a `success` haptic.
  - *Play*: a ball arcs across, and the pet hops and follows it.
  - *Deliver note*: an envelope appears in the pet's mouth, and it trots in from the edge.
  - *Hatch*: a crack path draws across the egg, the egg shakes three times, the halves split, and the baby pops up with `bouncy` plus confetti and `success`.

---

## 10. Motion

### 10.1 Tokens

| Token | Value | Use |
|---|---|---|
| `dur-instant` | 100ms | Press feedback, color changes |
| `dur-fast` | 180ms | Small UI changes (chip select, toggle) |
| `dur-base` | 260ms | Most transitions (tab content fade, toast) |
| `dur-slow` | 420ms | Object transitions (envelope open, sheet) |
| `dur-reveal` | 700ms | Card flips and stamps, the "big moments" |
| `ease-out` | `bezier(0.2, 0.8, 0.2, 1)` | Enter |
| `ease-in` | `bezier(0.4, 0, 1, 1)` | Exit |
| `spring-snappy` | damping 20, stiffness 300, mass 1 | Press, toggle |
| `spring-gentle` | damping 18, stiffness 180 | Sheets, tab dot, layout |
| `spring-bouncy` | damping 11, stiffness 200 | Delight: pet hops, stamps, hatching |
| `scale-press` | 0.97 | All pressables |
| `scale-select` | 1.04 | Selected mood or option |
| `opacity-disabled` | 0.4 | — |
| `stagger` | 40ms | List and grid entrance (first 8 items only) |

### 10.2 Principles
1. **Physical:** use springs for anything a finger touches, and timing curves only for fades.
2. **Purposeful:** motion explains cause and effect (a note *flies to* the pet, a dream *gets stamped*).
3. **Fast feedback, soft settle:** a response within 100ms, settling in 300–700ms.
4. **Interruptible:** everything runs on the UI thread (Reanimated worklets). Gestures can grab animations mid-flight.
5. **Reduce Motion:** when on, springs become 180ms cross-fades, flips become fades, and confetti, shimmer and idle pet hops are turned off. Blinking and breathing stay (they're subtle).
6. **Budget:** 60fps on a Pixel 6a-class device. Animate only `transform` and `opacity`. No layout-driven animations in lists. No animated blur.

### 10.3 Signature moments

| Moment | Choreography |
|---|---|
| **Mood select** | The tapped creature scales to `1.04` using `bouncy`, its face animates (smile or frown), and others dim to 60%. Continuing morphs the card into the VibeCard's position (shared layout), then the privacy choice slides up. |
| **Share mood** | The card lifts (`lift-2`), slides toward the partner slot with a ghost trail, the partner card flips if they've shared, then `success`. |
| **Send note** | The paper folds in half (scaleY 1→0 at the fold line, 260ms), becomes an envelope, and flies in an arc to the pet's position (`gentle`, 520ms). The pet catches it and trots off. `medium` haptic. |
| **Open note** | The envelope sits center screen. Swiping up on the flap rotates it open (rotateX, gesture-driven), the paper slides up out of the envelope, and unfolds (`slow`). `light` then `success`. |
| **Quiz answer** | The option presses in, a `cobalt` ring draws around it (stroke-dashoffset, 180ms), then the card slides left while the next slides in from the right (`gentle`). |
| **Reveal** | 1. The cards arrive face down, stacked. 2. After a 600ms "breath", your card flips (`dur-reveal`) with a `light` haptic. 3. 400ms later their card flips, with `medium` for a mismatch or `success` + confetti for a match. 4. The result headline types in, word by word. |
| **Complete dream** | Checkbox tap: the stamp drops from scale 1.6 to 1 with rotation −8° (`bouncy`), ink splat particles appear, a `heavy` haptic plays, and the ticket tint crossfades to `green-soft`. |
| **Memory open** | The grid photo expands into the detail frame (measured origin rect to final, `gentle`), the border and tape fade in, and the caption rises in. |
| **Tab switch** | Outgoing content fades out (120ms), incoming fades and rises 8px (`dur-base`). The dot slides. No horizontal slides between tabs. |

### 10.4 Haptics map (`lib/haptics.ts`, used only through these names)

| Name | Expo call | When |
|---|---|---|
| `tick` | selection | Chip, option or mood select, and pet stroke ticks |
| `tap` | impact Light | Opening objects, first reveal flip |
| `thud` | impact Medium | Sending a note, a mismatch reveal |
| `stamp` | impact Heavy | Completing a dream |
| `yay` | notification Success | Match reveal, hatch, feed complete, save success |
| `oops` | notification Warning | Validation error |

No haptics on navigation, scrolling or passive realtime updates.

---

## 11. Voice & copy

- Use lowercase-friendly, warm, brief copy, like a thoughtful friend would write. Sentence case in UI. `label` eyebrows are uppercase.
- Use the partner's **name**, never "your partner", once a name is known.
- Errors say what happened and what to do: "Couldn't send your note. It's saved and will go once you're back online."
- No guilt, no pressure, no streak language, and no clinical or psychological claims ("A quiet day for both of you", not "Your moods indicate low connection").
- Push notification bodies never contain private content (notes, answers or moods). For example: "Mochi has something for you."

---

## 12. Accessibility

- Every pressable has an `accessibilityLabel`, and a role and state where relevant. Mood creatures announce their mood name.
- Dynamic Type is supported up to each style's max scale (§3.1). Layouts must survive the largest size without clipping, so wrap text and let cards grow.
- Minimum contrast is per §2. Never use color alone to show state.
- Touch targets are at least 44pt.
- Respect Reduce Motion (§10.2). Respect Bold Text (DM Sans 700 → 700; body 400 → 600).

---

## 13. Implementation contract

```
apps/mobile/src/design-system/
  tokens.ts          ← the ONLY place values live (mirrors this file)
  tailwind preset    ← generated from tokens.ts (NativeWind theme)
  motion.ts          ← durations, easings, springs
  haptics.ts
  Text.tsx  Button.tsx  TextField.tsx  CodeField.tsx  Chip.tsx  Avatar.tsx
  Screen.tsx  Sheet.tsx  Modal.tsx  Toast.tsx  Skeleton.tsx  EmptyState.tsx  ErrorState.tsx
  objects/  VibeCard  NoteCard  Envelope  QuizCard  MemoryCard  FutureTicket  JournalPage
  illustrations/  MoodCreature  CategoryCreature  Pet/  Confetti  Stamp
```

- A lint rule forbids hex literals, `fontSize:` and `fontFamily:` outside `design-system/`.
- Changes to this file and to `tokens.ts` land in the **same commit**.
