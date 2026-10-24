# PathForge learning workspace: presentation package

This branch implements the requested neutral learning-workspace presentation as independent React components. The controlling user confirmed that another agent is actively editing the shared UI files, so this change follows the request's independent-component fallback. It does not replace the production root page, alter shared controllers, or publish to `codex/bonus-gamification-simplicity`. Integration into the active app remains with that file owner.

## Audit and design changes

The baseline stylesheet had 798 rules, 27 gradients, and declared font sizes from 4–11px. Eight primary destinations, ornamental category art, a decorative learning universe, and the same large home hero for returning learners competed with the next task.

The new package has scoped semantic tokens, a neutral canvas, restrained indigo actions, 12px minimum labels, 15px base text, readable code, clear focus outlines and 44px controls. Locally served Inter, JetBrains Mono and Noto Sans Devanagari have system fallbacks and bundled licenses; builds and browsers need no font CDN. Feature styles are separated rather than overriding the 52KB legacy stylesheet. No new application dependency or lockfile change is required.

Five primary destinations group the existing view IDs: Home; My Learning (`roadmap`); Practice (`missions`, `mission`, `lab`); Projects; Progress (`dna`, `portfolio`). Explore, collaboration and settings stay reachable in secondary navigation. Native modal navigation and goal dialogs include explicit focus wrapping, Escape handling and focus return. Mobile roadmap users get a real step-list alternative; the graph keeps prerequisite edges, pan, zoom, fit and selected-node details.

New learners get a goal input and honest catalogue suggestions. Returning learners get their actual current goal, checked progress, draft-aware resume and one primary next step. Catalogue limits are shown rather than relabeling JavaScript exercises as Python or promising full courses. Mission results distinguish runner output from a recorded assessment, preserve source-bound checks and assistance, and keep written artifacts pending review. Simulations display computed frames, signed bars, inspectable tables, prediction and changed-parameter transfer checks. Progress and evidence display existing selectors/records; this package introduces no XP, achievement or streak ledger.

## Component boundaries

All production additions are under `app/components/workspace-v2`, with static fonts under `public/fonts`.

| Component                                                | Connect to the existing controller                                                                                                                                                                                  |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `WorkspaceShell`                                         | Existing `view`, `navigate`, `openMission`, user/name, sync string, language and preference toggles. It imports scoped styles once.                                                                                 |
| `HomeScreen`                                             | Existing `Learner`, `beginGoal`, `openMission`, navigation, minutes update and notice setter. Uses `nextNode`, `nodeState`, `getRevision`, `selectSessionMission`, `totalXP`.                                       |
| `GoalDialog`                                             | Existing goal/start-level/session/language state and `generate(useAI)`. Pass actual provider availability; `unknown` allows the existing API error path. Curated coverage preview uses the existing core catalogue. |
| `RoadmapScreen`                                          | Drop-in presentation contract: `state`, `onMission`, `onGoal`. Graph positions are derived for display; stored nodes/dependencies are never changed.                                                                |
| `MissionWorkspaceView`                                   | Keep the current mission controller. Pass text, choice, runner output, Evaluation, hint/assistance state and existing run/check callbacks.                                                                          |
| `LearningCompanion`                                      | Existing question, messages, busy/error state and `chat` callback. Sending and consent remain with the controller.                                                                                                  |
| `SimulationWorkbench`                                    | Keep the existing simulation controller. Pass real `runSimulation` output, predictions, frame index, transfer state and `run`/`verify` callbacks.                                                                   |
| `PracticeCatalog`, `ExplorePaths`                        | Existing `openMission`, `beginGoal`, and navigation. Catalogue filtering is presentation only.                                                                                                                      |
| `ProgressScreen`, `EvidencePortfolio`, `SkillBridgeView` | Existing learner data and advisory AI bridge callback. No mastery derives from conversation. Invalid imported dates render a fallback.                                                                              |
| `ProjectsView`                                           | Existing checked feature flags, timer preview, download handler and expense updates. Keep the provided scaffold/contribution attribution.                                                                           |
| `CollaborationView`                                      | Existing signed-in state, room snapshots, contribution text and server-backed action/copy handlers. A completed artifact is a required render slot.                                                                 |
| `SettingsView`                                           | Existing update/import/export/backup/reload/delete callbacks. Keep original identity, account storage keys, sync epochs and conflict/deletion safeguards.                                                           |
| `MilestoneNotice`                                        | A committed `task.checks.passed` event from the core event adapter; no rewards are fabricated or incremented here.                                                                                                  |

Reusable primitives cover buttons (including native icon-label tooltips), fields via scoped input styles, panels, badges, progress, empty/error states, navigation tabs, dialogs and loading skeletons. `presentation.ts` handles dates only. `index.ts` exports the package.

## Required shared-file integration by its owner

1. Preserve the current controller and state schema. Replace chrome with `WorkspaceShell`, placing existing destinations inside its `children`. Gate account initialization with `Skeleton`; do not overwrite saved learner state during UI mount.
2. Replace the home JSX with `HomeScreen`, mapping the existing callbacks. Replace the onboarding JSX with `GoalDialog`; retain `generate(true/false)`, explicit provider consent and honest provider errors.
3. Map the roadmap view to `RoadmapScreen`. Keep `openMission`, core dependencies, recovery handling and original saved node IDs. Stored graph coordinates are not rewritten by the new display layout.
4. Extract the current mission controller's rendering into `MissionWorkspaceView`. Pass **all** existing optional surfaces: `readAloud`, artifact `attachments`, bounded `knowledgeCheck`, advisory `aiActions`, and the companion/speech controls. Keep worker cancellation, 2-second timeout, source fingerprint binding, draft updates, `confirmSubmissionCheck`, assistant labeling and `onAttempt` intact. Key the view by mission ID.
5. Keep the real simulation controller and evidence emission. Pass `result`, step, prediction, transfer and explanation state into `SimulationWorkbench`; changing inputs must call its existing reset logic. No view component calls `runSimulation`, awards success or posts learner code.
6. Map the secondary screens to their typed callbacks/slots. Keep the existing focus-timer functionality, working export, group APIs, private invitation handling and form validation. Do not copy the test harness's deliberately limited account/export placeholders into the application.
7. Deliver core events only **after** accepted state commits. Follow [learning-events.md](learning-events.md) for deduplication, restoration suppression, assessed/assisted scopes and existing canonical XP. Keep effects outside React state updater functions. Bonus failure must not block learning.
8. When no active view needs the legacy stylesheet, the shared-file owner can replace its imports with this package's tokens/styles. Do not combine this package with a full page of old decorative JSX and call that the final redesign. Scoped styles intentionally do not affect the active old app.

Do not apply a blind patch over another agent's active changes. Review both PRs and map these boundaries deliberately; no automatic merge is part of this branch.

## Browser tests, not a separate product demo

`tests/ui-workspace` is a clearly labeled component integration harness, outside `app/` routes. It starts from an empty learner and uses the actual core reducers/evaluators, the actual browser Worker source/CSP, and all real deterministic model functions. Its storage namespace is `pathforge-ui-component-test-v1`. It never writes account data or invents existing activity. Account authentication/sync, full project export/timer, live AI and two-person collaboration remain production-controller integration responsibilities.

The main browser journey uses real checks: choose goal → curated roadmap → run a correct function → record checks → inspect progress → reload → fail another task twice → see recovery → pass the bounded recovery checkpoint → return to the original task. It also runs both simulation predictions, checks mobile navigation, keyboard focus, English/Hindi, reduced motion, larger text, empty/loading/error states, malformed dates and long content.

The harness imports and compiles every added view, but it is not the published app. Screenshots from it are component browser evidence, not a claim of completed shared-file integration or an end-to-end AI-provider test.

## Running the checks

Use Node >=22.13, the existing locked install and the cloud image's Playwright/Chromium tooling. If using another machine, make `playwright` and `axe-core` available in its tooling environment; set `PATHFORGE_CHROMIUM_PATH` if Chromium is elsewhere. No application dependency changes are necessary.

```sh
# Terminal 1: actual app runner endpoint, with local runtime state.
npm run dev -- --hostname 127.0.0.1

# Terminal 2, from the repository root. The script starts/reuses only the test Vite server.
PATHFORGE_AXE_PATH=/path/to/axe-core/axe.min.js node --experimental-strip-types scripts/test-workspace-ui.mjs

node node_modules/typescript/bin/tsc --noEmit
node node_modules/eslint/bin/eslint.js app/components/workspace-v2 tests/ui-workspace scripts/test-workspace-ui.mjs
node --experimental-strip-types --test lib/learning.test.ts lib/learning-events.test.ts lib/missions.test.ts lib/server.test.ts lib/simulations.test.ts
npm run build
node node_modules/vite/bin/vite.js build --config tests/ui-workspace/vite.config.ts
```

The script validates the exact runner source/CSP before proceeding, uses fresh browser contexts at 375/768/1024/1440px, runs axe WCAG A/AA checks, and saves results/screenshots in ignored `outputs/ui-workspace-qa`. It fails on new browser errors, overflow or accessibility violations. Live AI is explicitly unrun when provider credentials are absent. No localhost preview link is needed.

## Executed validation and current limits

On 24 October 2026:

- **71 existing core/event/evaluation/server/model tests passed**, with no failures or skips.
- **TypeScript passed.** ESLint for the new components, test fixtures and browser runner passed with no findings.
- **Both builds passed:** the existing Vinext Worker build and the separate Vite build that imports every added component.
- **All four browser journeys passed** at 375, 768, 1024 and 1440px. Each audited 13 screens/states with axe-core 4.14.0 WCAG A/AA tags, with zero violations. Tests also checked no document overflow, 12px minimum visible home text, native dialog/drawer keyboard behavior, actual runner checks, evidence scope, reload persistence, adaptive recovery, actual simulation checks, local project-note edits, Hindi glyph loading, larger text, reduced motion, loading/error states, long content and malformed imported dates.
- **36 screenshots** and a machine-readable result file were generated under ignored `outputs/ui-workspace-qa`. Baseline screenshots are retained separately in `/workspace/.onboarding/ui-evidence`. These are local artifacts; they are not committed deployment output.
- **Repository-wide lint remains failed at its baseline:** 9 errors and 5 warnings in the existing shared mission, roadmap and client-AI files. None were added by this package.

The audit caught and corrected accessible-name mismatches and dialog keyboard focus behavior. A runner connection failure was traced to the source dev server not running; restarting it restored the real Worker path. No substitute passing runner or fake results were used. The browser test now checks the exact upstream runner source and CSP before proceeding.

The active root application is **not redesigned by this branch**, because the controlling user confirmed another agent is editing its shared UI. Live AI generation is unrun without a configured provider. Production authentication/cloud sync, actual project timer/export, two-person collaboration and bonus-ledger delivery must be verified again after the owner wires these views to the existing controllers. The test harness deliberately does not pretend to complete those account/provider-dependent integrations. The active application's source, backend, learner schema, assessment rules and dependency files are unchanged relative to the core event-contract base.
