# Quiz UI revamp

Completed source pass: 1 November 2026. Existing backend scoring, participant locking and answer secrecy are preserved. This pass changes the mobile quiz experience and Git/documentation hygiene, not the previously proposed retention features or backend reliability work.

## What changed

- `app/(tabs)/know.tsx` is a thin API/navigation container. `features/quizzes/QuizLibrary.tsx` renders a virtualized library with conversations in progress, topics to explore and completed discoveries. Daily uses the same paper/action palette and a single tappable surface instead of a nested button in a saturated card.
- `QuizPlay.tsx` separates real API mutations (`QuizPlay`) from the UI (`QuizPlayContent`). One question stays visible while the user chooses their own answer and their prediction through two editable summaries. Options use full-width rows; selection is shown with a radio/check and theme-colored fill/border. “Save & next question” acknowledges persistence; review remains editable until Send.
- `ChoiceGrid.tsx` now presents the two summaries and one full-width option list, rather than a small two-column selection matrix. `OptionRow.tsx` exposes checked/disabled state. Who/open questions use the same heading/spacing/action language.
- Failed save/complete requests show inline feedback and retain local picks. A ref prevents duplicate in-flight submissions. The route scrolls to the top when question/review or play/wait/report phase changes, instead of leaving a new state at the old review scroll position.
- `QuizWaiting.tsx` confirms saved answers and explains the reveal boundary without a progress meter for the partner.
- `QuizReveal.tsx` separates server side effects from `QuizReport`. The report shows shared agreement, personal prediction accuracy and actual answers as separate sections; All/Alike/Different filters and per-question prediction disclosure keep their meanings distinct. Open answers remain unscored. Stable person IDs are used even when both people share the same name.
- `app/dev/quizzes.tsx` and `quiz-fixtures.ts` provide synthetic local UI scenarios. They do not seed the real QueryClient, register a fake account or mutate an API. The route redirects in release builds and is linked only from development Settings. Controls are intentionally labeled development-only.

Useful development links: `lovenotes://dev/quizzes` and `?scene=play|guess|who|open|review|waiting|report|library`. `mode=light|dark` is for personal-theme rendering checks; omit it to keep the current mode. Gallery `mode=system` restores system appearance.

## References used

These iOS references informed structure, not Between's palette, artwork or copy:

- [Quizlet answer selection](https://mobbin.com/screens/ca1cedf4-4f66-40e1-8762-29c0844de25b): full-width answer rows with an explicit selected state. This is an educational-app example, not evidence about couples' behavior.
- [Noom question](https://mobbin.com/screens/1e72c86b-e88f-4407-8fd5-f60146d6cf6a): a question and full-width options above a deliberate next action; structure only.
- [Quizlet results](https://mobbin.com/screens/ed1ddb57-4ef7-47a5-a9f5-60aafbbf2014): summary followed by answer detail and a clear next action; structure only. Between does not grade the relationship or add a compatibility percentage.

The two editable answer/prediction summaries and calm waiting presentation are project-specific design decisions. No retention or conversion improvement is claimed from screenshots.

## Verification

- `bun run lint`: passes, including 494 configured contrast pairs across eight themes and architecture/token rules.
- `bun run typecheck`: all three workspaces pass.
- `bun test apps/mobile/src packages/contracts/src`: 58 pass, 0 fail, 263 assertions. Includes symmetric shared scoring, secrecy-related presentation logic and answer completion tests; these are not native interaction tests.
- `DATABASE_URL=postgres://localhost:5432/between_quiz_20261101 NODE_ENV=test bun --cwd apps/api test test/quizzes.test.ts`: 7 pass, 0 fail, 47 assertions against a fresh migrated disposable database. That database was removed afterward. The full API suite was not rerun; the earlier pet pause/resume failure remains outside this change.
- Production iOS bundle export passes. No new dependencies/native module changes.
- Real native captures in ignored `.ui-review/2026-10-31-quizzes/`: library light, answer light, review dark, waiting light, report light and prediction dark with extra-extra-extra-large system text. Captures use synthetic data and actual production UI components. Text reflows in the inspected large-text selection capture; bottom content still requires scrolling.

The simulator runtime updated during verification and interrupted intermediate captures; bundling splash/current transient captures are not layout evidence. Main final captures were opened and inspected. Native UI control through the available computer-use bridge was unavailable. Therefore tapping/scrolling through the full authenticated flow, keyboard/back/swipe behavior, report filter/disclosure interactions, actual two-device UI and release frame timing remain manual verification items. API tests are not a substitute for those. No 60fps claim is made.

## Git and learning handoff

See [Git hygiene](GIT-HYGIENE.md) for source versus local-output rules and the large preexisting working tree. Nothing was staged, committed or pushed. Include new imported source, migrations and lockfile changes from earlier work when forming coherent commits; do not push only tracked screen modifications.

The [interactive Expo field guide](expo-architecture.html) traces actual note, quiz and photo actions, route guards, data ownership and native build boundaries. The companion [architecture guide](expo-architecture-guide.md) contains deeper explanations. Its flow controls were exercised in the browser; it makes no app/network writes.

Hands-on exercise: change one synthetic option label to a long phrase, open the development quiz playground in both modes, and explain why that cannot change a real quiz catalog or send an answer. Follow `quizFixture → QuizPlayContent → local onSave`; compare the real wrapper's `useAnswer.mutateAsync`.
