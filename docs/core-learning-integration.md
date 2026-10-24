# PathForge core integration handoff

Inspected checkout: `rajsalonia/pathforge-ai`, HEAD `ce0082463fd08515f0978734435c366102ad8d8d` (`codex/pathforge-core` remote tip). This document records the baseline UI/controller audit. The additive event API is documented separately in [Learning events v1](learning-events.md).

## Ownership and integration sequence

Core owns AI roadmaps, mission evaluation, skill verification, backend architecture and shared application files. Agent 2 owns its Gamification and Simplicity modules on `codex/bonus-gamification-simplicity`. Keep its branch and modules intact. Review its PR explicitly, agree changes to shared files, run the relevant checks, then integrate deliberately. Do not merge automatically or create a second XP, achievement or streak system in core.

Preserve the main flow: goal → validated AI/curated roadmap → guided mission → actual bounded checks → visible progress → optional rewards.

## Existing integration points

| Surface | Current contract and role |
| --- | --- |
| `lib/missions.ts`: `Mission`, `Evaluation`, `evaluateMission(missionId, submission)` | `Evaluation` contains `passed`, `feedback`, `checks: { name, passed, detail? }[]`, `evidenceType: 'tested' \| 'assessed' \| 'submitted'`, optional `requiresAI`. A successful result is scoped to its actual checks. |
| `lib/missions.ts`: `codeChallenges`, `codeFingerprint(source)` | Coding results must match the submitted source fingerprint, all fixed cases and their expected values; changed source invalidates prior results. Learner code runs in the browser Worker, not on the backend. |
| `lib/missions.ts`: `confirmSubmissionCheck(missionId, submission, choice)` | Assesses one bounded question after substantive written evidence is submitted. `assessed` success does **not** verify the written artifact; `artifactReview` stays pending. |
| `app/components/MissionWorkspace.tsx`: `onAttempt(a: Attempt)` | Receives each evaluated attempt from `submit` or `assessSubmission`, including failures. AI advisory replies alone do not call this callback or confer competency. |
| `app/components/SimulationLab.tsx`: `onEvidence(id, result)` | Called only when the prediction made before running and the changed-parameter transfer prediction both match computed answers. IDs use `simulation:<topic-id>`. Explanation text is retained but explicitly ungraded. |
| `app/page.tsx`: local `record(a)` | Shared ingestion point for mission and simulation attempts. Deduplicates `Attempt.id`, updates activity/project state, and calls `adaptAfterAttempt`. It is not an exported event bus. |
| `lib/learning.ts`: `adaptAfterAttempt(state, attempt)` | Idempotent by `Attempt.id`; stores attempts and may insert a bounded recovery checkpoint after repeated graded JavaScript failures. Use this reducer rather than recreating progression rules. |
| `lib/learning.ts`: `nodeState`, `nextNode`, `selectSessionMission`, `getRevision` | Existing roadmap availability, progression, next-action and revision selectors. Reuse them to keep the simplified interface aligned with core behavior. |
| `lib/learning.ts`: `totalXP(state)` | Existing canonical XP selector: awards each known successful tested/assessed mission once by mission ID; recognized simulations award 25 once. Repeated attempts, unknown IDs and submitted-only evidence add no XP. This already includes assisted and assessed passes. |
| `/api/learn`: GET/POST | Persists the learner snapshot per signed-in user. POST uses `{ state, revision }`; optimistic-revision conflicts return 409. Storage is not independent server assessment. |

`Attempt` in `lib/learning.ts` is the existing durable evidence record:

```ts
type Attempt = {
  id: string; missionId: string; skill: string;
  passed: boolean; evidenceType: string; assisted: boolean;
  feedback: string; checks: unknown[]; submission: unknown;
  createdAt: string; minutes: number;
};
```

`Learner` is version 1 and includes `roadmap`, `attempts`, drafts, project artifacts, preferences, claimed skills and activity. Preserve unknown/other state during bonus updates. `claimedSkills`, AI conversation and activity labels are not verification evidence.

## Existing competency semantics

- `nodeState` distinguishes `blocked`, `available`, `attempted`, `needs-practice`, `revision`, `completed` and `verified`. A current successful `tested` attempt without recorded assistance yields `verified`; an assessed or assisted success yields `completed`. A later graded failure or stale evidence can change the displayed status.
- Successful assessments are legitimate evidence only for their bounded question. A submitted explanation, uploaded image, AI feedback, plan creation or time spent alone does not establish a passed task or general mastery.
- The `state-search` roadmap checkpoint accepts binary-search simulation evidence only when its submission also identifies `method: 'deterministic-state-model'` and `predictionMadeBeforeRun: true`; arbitrary simulation passes do not unlock it.
- Evidence is self-directed browser practice. Exported records explicitly disclaim proctoring, identity/authorship attestation and professional mastery. The backend stores client evidence; do not present storage success as a new verification.

## Implemented versioned adapter

The current additive core API is documented in [Learning events v1](learning-events.md) and implemented in `lib/learning-events.ts`. Its real payload types supersede the initial adapter proposal from this audit. The main UI/controller remains an integration point for its owner; the module does not install a dispatcher, reward ledger or automatic UI notifications.

## Shared points requiring review

The existing XP selector accepts tested **or assessed** passes, including assisted ones; current competency verification is narrower. Keep these meanings explicit during PR review. `app/page.tsx` also derives activity dates from all activity, including path creation, so those dates are not an authoritative verified-learning streak feed. No exported event bus or persistent reward-receipt ledger exists yet. Any adapter/ledger or XP-policy change is a separate deliberate coding change with deduplication and replay tests.

Relevant existing validation:

```sh
cd /workspace/pathforge-ai
node --experimental-strip-types --test lib/learning.test.ts lib/missions.test.ts lib/server.test.ts lib/simulations.test.ts
node node_modules/typescript/bin/tsc --noEmit
npm run build
```

Integration tests should cover failed/submitted attempts, source changes after tests, assistance labels, bounded written checks, simulation transfer checks, unknown task IDs, duplicate attempt IDs and replay after account/device merge. Reward UI must remain downstream of the successful checked-learning flow.
