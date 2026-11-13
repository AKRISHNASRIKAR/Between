# Between optimization pass

## Initial audit

The existing architecture is an Expo SDK 57 app with Expo Router, NativeWind and Reanimated;
a Bun/Hono modular API with Postgres; and shared Zod contracts. TanStack Query owns server
state and persists successful queries through SQLite. Form drafts and animation state stay
local. A single foreground socket updates query caches. The home screen already shares
profile and inbox queries rather than fetching separately for every consumer.

| Area | Finding before this pass | Resolution |
| --- | --- | --- |
| Design system | Semantic palettes, typography, spacing, radius and motion already existed | Extended the existing system rather than replacing it |
| Theme | Appearance changes remounted navigation and discarded drafts | Subscribe rendering components to appearance changes; preserve navigation and state |
| Illustrations | Mood/quiz SVGs were reusable but replacement points and empty-state choices were scattered | Typed renderer registry; empty-state screens read registry entries |
| Startup/assets | Icon barrel and font package barrels pulled in unused icons and weights | Direct icon imports and a registry of the nine loaded font faces |
| Lists | Future rendered its entire collection; quiz history mounted every row | SectionList/FlatList with stable row components and keys |
| Journal | Both journal views fetched while only one was visible | Fetch the active view; memoize derived rows; use thumbnails and recycling keys |
| Uploads | Main and thumbnail files were read twice | Reuse the existing upload blobs |
| Optimistic state | Failed Future, mood, journal and quiz updates could remain in cache | Cancel conflicting queries; restore owned snapshots; reconcile after mutation settlement |
| Quiz | Answer saving advanced before success; result effects could repeat | Success-driven advancement, editable failed drafts, duplicate-event and effect guards |
| Pet | Retained screens/background sessions continued animating | Focus/foreground gating, timer and animation cleanup, reduced-motion behavior |
| Socket | Late authentication/close callbacks could affect a newer connection | Connection ownership checks; cancel background reconnects; scoped query invalidation |
| Mobile UX | Long button labels, narrow filters and large confirmation content could overflow | Wrapping labels/filters, flexible heights, safe-area bounded scrollable confirmations |
| Submission | Note sending could be repeated during the departure animation | Keep a synchronous guard through successful departure |
| Recovery | An uncached profile request failure could leave the splash indefinitely | Visible retry and sign-out recovery with loading/error feedback |
| Privacy | Pending push registration could race sign-out; restored cache had no account owner | Registration fencing and persisted token revocation; account-scoped cache buster |
| Closed spaces | Promised retained reading/export access had no navigation path | Discover authorized unexpired archives and provide a virtualized read-only reader |

The implementation order was state correctness, animation lifecycle, collections/network
work, shared illustration/theme configuration, layout recovery, and measured bundle reduction.
Focused reviews covered design system, animation, performance, mobile UX and product/QA.
Confirmed practical findings were fixed and regression-tested where executable without a device.

## Where to customize

| Change | Source |
| --- | --- |
| Canvas, surfaces, text, accents and paper colors | `apps/mobile/src/design-system/theme/themes.ts` |
| Mood-to-color roles and labels | `packages/contracts/src/moods.ts` |
| Spacing, type scale, radius, layout and elevation | `apps/mobile/src/design-system/tokens.ts` |
| Display/UI/handwriting font assets | `apps/mobile/src/design-system/font-assets.ts` |
| Press scale and spring response; entrance and reveal timings | `apps/mobile/src/design-system/motion.ts` |
| A mood/quiz renderer or an empty-state illustration | `apps/mobile/src/design-system/illustrations/registry.tsx` |
| Default mood and quiz SVG geometry | `MoodArtwork.tsx` and `CategoryArtwork.tsx` in the illustrations directory |
| Pet renderer and animation lifecycle | `apps/mobile/src/design-system/illustrations/pet/` |

Replacement renderers accept the existing typed props, so screens do not need new imports.
Mood SVGs also accept a controlled fill override. Pet rendering remains behind its existing
`Pet` component. Add `useThemeSubscription()` to a new component that reads active palette,
family, paper, elevation or recipe tokens; fixed artwork does not need it. Token and contrast
checks enforce the existing design constraints.

## Verification

- `bun run lint`: passes without warnings, including architecture and design-token checks.
- Theme contrast: 98 pairs across both themes pass the AA checks.
- `bun run typecheck`: all three workspaces pass.
- Full test suite against an isolated temporary Postgres database: 135 tests pass
  (13 contracts, 22 mobile, 100 API).
- New regression coverage includes optimistic rollback, late socket callbacks, background
  reconnect cancellation, push registration/sign-out races, account-owned cache hydration,
  archive persistence exclusion, retained membership, denied writes, privacy and expiry.
- A one-off React renderer integration check confirmed that manual and system appearance
  changes repaint a memoized consumer while retaining its draft and mounting it only once.
- Production Expo exports succeed for web, iOS and Android. These are bundle checks,
  not installed native build or device performance tests.

The first production web export in this pass was 9,208,086 JavaScript bytes (1,818,774 gzip).
The final export is 3,494,737 bytes (794,832 gzip): 62.0% less raw JavaScript and 56.3% less
gzip data. Font assets fell from 40 files / 3,517,152 bytes to 9 files / 972,344 bytes.
These are artifact measurements, not startup-time or frame-rate measurements.

## Verification limits

Browser access to the local preview was denied, so visual walkthroughs, viewport screenshots,
native keyboard behavior, accessibility font sizes and dropped-frame profiling are unverified.
They should be checked on physical iOS/Android devices before release.

Push revocation is best effort while offline; a failed removal retains the token for a later
retry. Infinite-query pages retain the existing 24-hour cache policy. Archive export still
materializes the existing full JSON document, while its screen virtualizes presentation and
does not persist archive contents or signed media URLs. Changing those retention/export
policies needs separate measurements rather than arbitrary page truncation.
