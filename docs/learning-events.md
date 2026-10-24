# Core learning events, version 1

The core owns this contract. Agent 2 can consume it from the Gamification/Simplicity branch without changing evaluation, learner storage, XP rules, or progression. No event dispatcher or reward system is installed by this module. The active UI is deliberately untouched while another agent edits its shared files.

## Entry points

`lib/learning-events.ts` exports:

- `deriveLearningEvents(before, after, context): LearningEvent[]`
- `learningProgress(state, now?): LearningProgress`
- `LearningEvent`, `LearningEventContext`, `LearningProgress`, `CompetencyStatus`, and `EvidenceScope` types.

`nextNode(state, now?)` also accepts an optional clock, matching `nodeState`. Existing callers keep their current behavior. All statuses in a derived transition use the accepted attempt's timestamp, so replaying a transition across the seven-day revision boundary produces the same event content and IDs.

```ts
import { adaptAfterAttempt, totalXP } from '@/lib/learning';
import { deriveLearningEvents } from '@/lib/learning-events';

// attempt was produced by the existing mission evaluator or simulation flow.
const next = adaptAfterAttempt(previous, attempt);
const events = deriveLearningEvents(previous, next, {
  origin: 'interaction',
  learnerScope: opaqueAccountOrDeviceScope,
  attemptId: attempt.id,
});
// Commit `next` through the existing controller and persistence path.
// Deliver `events` after the state commit, outside React state updater functions.
// The existing XP display remains totalXP(next); do not increment a second balance.
```

The wrapper is read-only. Keep the controller's existing activity, project-feature, draft, authentication, optimistic-revision, and cloud-merge handling. Do not replace the whole `record` handler with this example. The main UI needs a deliberate integration change by its owner; importing the module alone does not wire notifications.

## Event meanings

| Type | Meaning | Consumer behavior |
| --- | --- | --- |
| `attempt.recorded` | A newly appended, known attempt agrees with the existing evaluator. Includes failures and unreviewed submissions. | Show practice history; never treat recording alone as success. |
| `task.checks.passed` | All checks for the stated task scope passed. The submission is replayed through the existing evaluator/model. | A possible input to scoped bonus policy; inspect `scope`, `evidenceType`, and `assisted`. |
| `competency.changed` | A roadmap node's authoritative `nodeState` changed. Includes unlocks, failures after passes, revision and recovery nodes. | Update milestone presentation from `current`, including downward changes. This is not whole-skill certification. |
| `progress.changed` | The projection of core counts and `nextNode` changed. | Update visible progress and next action; `recoveryForNodeId` identifies the detour's original node. |

Every event has `version: 1`, a deterministic `eventId`, an opaque `learnerScope`, `attemptId`, and `occurredAt`. Assessment events include `missionId`, `evidenceType`, `scope`, `assisted`, `checksPassed`, and `checksTotal`. Events omit submitted code, artifacts, explanations, AI prompts/replies, feedback text, goals, names, emails and credentials.

Evidence scopes are deliberately different:

- `task-tests`: bounded JavaScript runner cases, SQL subset, Git simulation, or experiment checks. Source-bound runner evidence is replayed through `evaluateMission`; learner code is never executed by this adapter.
- `bounded-knowledge-check`: the existing scenario or written-submission checkpoint. A written artifact remains unreviewed even when its separate question passes.
- `simulation-predictions`: the known model recomputes both the original outcome and its chosen changed-parameter transfer, matching both predictions and stored results.
- `unreviewed-submission`: work was received without a passed correctness assessment. This scope never emits `task.checks.passed`.

Assisted and assessed passes can earn XP under the existing `totalXP` policy. They do not become unassisted `verified` competency. Bonus policy must preserve that distinction. A blanket unassisted-only reward rule would be a new product decision, not the current core rule.

## Replay, restoration, and validation

Call the adapter for a single accepted interactive append. Earlier attempt history must be preserved. `origin: 'restore'`, duplicate IDs, existing attempts, unknown tasks, invalid timestamps, inconsistent outcomes, changed code with stale test results, malformed simulation evidence, history rewrites and bulk additions emit no events. Importing, signing in, merging account/device snapshots or reloading cloud state must use restoration, with no fresh rewards.

A repeated *same transition* returns the same event IDs. This is a pure projection, not an exactly-once transport. Consumers must durably deduplicate event IDs in the learner/account scope. Distinct successful attempts at the same task get distinct events, so one-time task bonuses also need learner + canonical mission ID deduplication. Do not award XP again on persistence retry, cloud merge, rerender, reload or event replay. `totalXP(state)` remains the canonical, task-deduplicated XP selector.

The checks confirm consistency with current bounded client evidence. They do not prove that a prediction really preceded a run, establish authorship/identity, provide anti-cheating protection, or attest results on the server. A source fingerprint is not a signature. The stored learner state and events are not a security boundary; the adapter is not an event ingestion endpoint. Progress projections assume the rest of the state already came from the existing core workflow.

Keep event delivery outside React state updater callbacks: React may replay them. A failing bonus consumer must not prevent saving an attempt or displaying core feedback. For snapshot restoration, initialize the consumer's baseline without firing historical success notifications. Version or explicitly migrate consumers if event meanings change.

## Ownership and integration

Core branch: `codex/core-learning-events`, based on the verified `codex/pathforge-core` history. This change does not edit `app/page.tsx`, `app/globals.css`, `app/layout.tsx`, `Roadmap.tsx`, `MissionWorkspace.tsx`, `SimulationLab.tsx`, or Agent 2's bonus modules. It does not push to or merge `codex/bonus-gamification-simplicity`.

Agent 2/controlling session should review this API and its own PR before changing shared controller integration. Agree who changes `record`, capture before/after accepted state, and deliver committed events to the bonus layer with durable deduplication. Keep the goal → roadmap → guided mission → checks → visible progress flow intact. See [the existing integration audit](core-learning-integration.md) for the current UI/controller surfaces.

## Validation

```sh
node --experimental-strip-types --test lib/learning.test.ts lib/learning-events.test.ts lib/missions.test.ts lib/server.test.ts lib/simulations.test.ts
node node_modules/typescript/bin/tsc --noEmit
node node_modules/eslint/bin/eslint.js lib/learning.ts lib/learning-events.ts lib/learning-events.test.ts
npm run build
```

The event suite exercises real runner output, stale code, failure/submission/assessment/assistance scopes, deterministic replay, import/merge suppression, all 47 simulation models, recovery and return to the original mission, and time-dependent revision behavior. Unit test predictions use known model answers as fixtures; the application never substitutes these fixtures for learner interaction.

Current validation (24 October 2026): all 71 tests passed with no failures or skips; TypeScript, changed-file ESLint, and the Worker build passed. Playwright exercised the existing real goal → curated roadmap → browser-runner pass → persisted reload → two failed attempts → recovery flow, at 1440px desktop and 375px mobile, with no page errors or horizontal overflow at 375px. The browser harness's initial exact-name navigation locator failed because the accessible name includes a roadmap count; correcting that test locator allowed the full journey to pass. Application code was not changed for that harness failure.

Repository-wide lint retains its baseline 9 errors and 5 warnings in existing shared UI/client files. Live AI roadmap generation was not run because this instance has no configured provider key. The adapter's event behavior is covered by its tests; automatic UI event delivery/bonus notifications remain a deliberate integration task for the shared-file owner. No visual redesign is included in this core branch.
