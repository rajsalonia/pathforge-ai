import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
// @ts-expect-error Native Node TypeScript tests require explicit .ts imports.
import { initialLearner, curatedRoadmap, adaptAfterAttempt, nextNode, totalXP, type Attempt, type Learner } from './learning.ts';
// @ts-expect-error Native Node TypeScript tests require explicit .ts imports.
import { codeChallenges, evaluateMission, confirmSubmissionCheck, missions, submissionChecks } from './missions.ts';
// @ts-expect-error Native Node TypeScript tests require explicit .ts imports.
import { runSimulation, simulationTopics, type SimulationEvidence } from './simulations.ts';
// @ts-expect-error Native Node TypeScript tests require explicit .ts imports.
import { deriveLearningEvents, learningProgress } from './learning-events.ts';

const at = '2026-10-24T10:00:00.000Z';
const now = Date.parse(at);
const workerSource = readFileSync(new URL('../public/code-worker.js', import.meta.url), 'utf8');
let sequence = 0;
function learner(goal = 'Learn JavaScript'): Learner {
  return { ...structuredClone(initialLearner), goal, roadmap: curatedRoadmap(goal, 'beginner') };
}
function attempt(missionId: string, submission: unknown, extra: Partial<Attempt> = {}): Attempt {
  const data = submission as { checkChoice?: string };
  const evaluation = data?.checkChoice ? confirmSubmissionCheck(missionId, submission, data.checkChoice) : evaluateMission(missionId, submission);
  return { id: `attempt-${sequence++}`, missionId, submission, skill: missions.find(m => m.id === missionId)?.skill ?? 'Simulation',
    passed: evaluation.passed, evidenceType: evaluation.evidenceType, checks: evaluation.checks, feedback: evaluation.feedback,
    assisted: false, createdAt: at, minutes: 5, ...extra };
}
function events(before: Learner, entry: Attempt) {
  const after = adaptAfterAttempt(before, entry);
  return { after, events: deriveLearningEvents(before, after, { origin: 'interaction', learnerScope: 'test-device', attemptId: entry.id }) };
}
async function codeSubmission(missionId: string, code: string) {
  let testResults: unknown;
  const sandbox: Record<string, unknown> = { structuredClone, postMessage: (result: unknown) => { testResults = structuredClone(result); } };
  sandbox.self = sandbox;
  runInNewContext(workerSource, sandbox, { timeout: 1000 });
  await (sandbox.onmessage as (event: unknown) => Promise<void>)({ data: { id: 'fixture', code, ...codeChallenges[missionId] } });
  assert.ok(testResults);
  return { code, testResults };
}
const goodCode = 'function formatMinutes(n) { return n + (n === 1 ? " minute" : " minutes"); }';
function simulationAttempt(id: string): Attempt {
  const topic = simulationTopics.find(candidate => candidate.id === id)!;
  const result = runSimulation(id, topic.input, topic.parameter);
  const evidence: SimulationEvidence = {
    type: 'simulation', topic: topic.name, title: topic.name, category: topic.category, status: 'verified', passed: true,
    score: 2, total: 2, method: 'deterministic-state-model', scope: 'Two bounded predictions', model: topic.model,
    input: result.input, parameter: result.parameter, prediction: String(result.answer), actual: result.answer,
    predictionMadeBeforeRun: true, transfer: { ...result.check, prediction: String(result.check.expected), actual: result.check.expected },
    explanation: 'Private explanation text must never appear in events.', explanationGraded: false, transitions: result.frames.length,
    checks: [{ name: 'Prediction', passed: true, expected: result.answer, actual: String(result.answer) }, { name: 'Transfer', passed: true, expected: result.check.expected, actual: String(result.check.expected) }],
  };
  return attempt(`simulation:${id}`, evidence, { passed: true, evidenceType: 'tested', skill: topic.name, checks: evidence.checks });
}

test('real runner evidence produces scoped check, competency and progress events without mutating state', async () => {
  const before = learner();
  const entry = attempt('first-function', await codeSubmission('first-function', goodCode));
  const saved = structuredClone(before);
  const result = events(before, entry);
  assert.deepEqual(before, saved);
  const passed = result.events.find(event => event.type === 'task.checks.passed');
  assert.ok(passed && passed.type === 'task.checks.passed');
  assert.equal(passed.checksPassed, 4);
  assert.equal(passed.checksTotal, 4);
  assert.equal(passed.scope, 'task-tests');
  assert.equal(passed.assisted, false);
  assert.ok(result.events.some(event => event.type === 'competency.changed' && event.missionId === 'first-function' && event.current === 'verified'));
  const progress = result.events.find(event => event.type === 'progress.changed');
  assert.ok(progress && progress.type === 'progress.changed');
  assert.equal(progress.current.verifiedMilestones, 1);
  assert.equal(progress.current.nextMissionId, 'fix-cart');
  assert.equal(totalXP(result.after), missions.find(mission => mission.id === 'first-function')!.xp);
  assert.equal(JSON.stringify(result.events).includes(goodCode), false);
  assert.equal(JSON.stringify(result.events).includes('submission'), false);
});

test('changed source, fabricated pass flags and mismatched evidence type cannot emit positive events', async () => {
  const before = learner();
  const submission = await codeSubmission('first-function', goodCode);
  for (const entry of [
    attempt('first-function', { ...submission, code: goodCode + '\n// changed' }, { passed: true, evidenceType: 'tested' }),
    attempt('first-function', { code: goodCode }, { passed: true, evidenceType: 'tested' }),
    attempt('first-function', submission, { evidenceType: 'assessed' }),
  ]) assert.deepEqual(events(before, entry).events, []);
});

test('failed and unreviewed work records an attempt without a passed-check event', async () => {
  const before = learner();
  const failed = attempt('first-function', await codeSubmission('first-function', 'function formatMinutes() { return "wrong"; }'));
  assert.equal(failed.passed, false);
  const failureEvents = events(before, failed).events;
  assert.ok(failureEvents.some(event => event.type === 'attempt.recorded' && !event.passed));
  assert.equal(failureEvents.some(event => event.type === 'task.checks.passed'), false);
  const written = attempt('teach-closure', { text: 'Private unreviewed writing. '.repeat(6) });
  const writtenEvents = events(before, written).events;
  assert.ok(writtenEvents.some(event => event.type === 'attempt.recorded' && event.scope === 'unreviewed-submission'));
  assert.equal(writtenEvents.some(event => event.type === 'task.checks.passed'), false);
  assert.equal(JSON.stringify(writtenEvents).includes('Private unreviewed writing'), false);
});

test('bounded assessments and assisted tests retain their narrower completion semantics', async () => {
  const before = learner();
  const assessment = attempt('teach-closure', { text: 'A substantial authored explanation remains unreviewed. '.repeat(3), checkChoice: submissionChecks['teach-closure'].answer });
  const assessedEvents = events(before, assessment).events;
  assert.ok(assessedEvents.some(event => event.type === 'task.checks.passed' && event.scope === 'bounded-knowledge-check'));
  assert.equal(assessedEvents.some(event => event.type === 'competency.changed' && event.missionId === assessment.missionId && event.current === 'verified'), false);
  const assisted = attempt('first-function', await codeSubmission('first-function', goodCode), { assisted: true });
  const assistedEvents = events(before, assisted).events;
  assert.ok(assistedEvents.some(event => event.type === 'task.checks.passed' && event.assisted));
  assert.ok(assistedEvents.some(event => event.type === 'competency.changed' && event.missionId === assisted.missionId && event.current === 'completed'));
});

test('event IDs are stable and scoped; duplicates, restoration and unknown tasks emit nothing', () => {
  const before = learner('Learn SQL');
  const entry = attempt('query-learners', { query: 'SELECT name, xp FROM learners WHERE xp >= 150 ORDER BY xp DESC' });
  const { after, events: first } = events(before, entry);
  const context = { origin: 'interaction' as const, learnerScope: 'test-device', attemptId: entry.id };
  assert.deepEqual(deriveLearningEvents(before, structuredClone(after), context), first);
  assert.equal(new Set(first.map(event => event.eventId)).size, first.length);
  assert.notEqual(deriveLearningEvents(before, after, { ...context, learnerScope: 'other-device' })[0].eventId, first[0].eventId);
  assert.deepEqual(deriveLearningEvents(after, after, context), []);
  assert.deepEqual(deriveLearningEvents(before, after, { ...context, origin: 'restore' }), []);
  assert.deepEqual(deriveLearningEvents(before, { ...after, attempts: [entry, entry] }, context), []);
  assert.deepEqual(events(before, attempt('unknown', {}, { passed: true, evidenceType: 'tested' })).events, []);
  assert.deepEqual(deriveLearningEvents(before, after, { ...context, learnerScope: ' ' }), []);
});

test('bulk imports and rewritten history cannot masquerade as one interactive assessment', () => {
  const before = learner('Learn SQL');
  const entry = attempt('query-learners', { query: 'SELECT name, xp FROM learners WHERE xp >= 150 ORDER BY xp DESC' });
  const first = events(before, entry);
  const added = attempt('review-boundary', { choice: missions.find(mission => mission.id === 'review-boundary')!.answer });
  const context = { origin: 'interaction' as const, learnerScope: 'test-device', attemptId: added.id };
  const merged = { ...first.after, attempts: [entry, added] };
  assert.deepEqual(deriveLearningEvents(before, merged, context), []);
  const rewritten = { ...merged, attempts: [{ ...entry, assisted: true }, added] };
  assert.deepEqual(deriveLearningEvents(first.after, rewritten, context), []);
  assert.deepEqual(deriveLearningEvents(first.after, { ...merged, attempts: [added, entry] }, context), []);
});

test('another successful attempt does not duplicate or replace the canonical XP system', () => {
  const before = learner('Learn SQL');
  const first = events(before, attempt('query-learners', { query: 'SELECT name, xp FROM learners WHERE xp >= 150 ORDER BY xp DESC' }));
  const repeated = events(first.after, attempt('query-learners', { query: 'SELECT name, xp FROM learners WHERE xp >= 150 ORDER BY xp DESC' }));
  assert.ok(repeated.events.some(event => event.type === 'task.checks.passed'));
  assert.equal(totalXP(repeated.after), totalXP(first.after));
  assert.equal(repeated.events.some(event => 'xp' in event || 'achievement' in event || 'streak' in event), false);
});

test('all 47 simulation evidence paths replay both predictions and retain their evidence scope', () => {
  assert.equal(simulationTopics.length, 47);
  for (const topic of simulationTopics) {
    const entry = simulationAttempt(topic.id);
    const result = events(learner('Practice algorithms'), entry);
    assert.ok(result.events.some(event => event.type === 'task.checks.passed' && event.scope === 'simulation-predictions' && event.checksPassed === 2), topic.id);
    assert.equal(JSON.stringify(result.events).includes('Private explanation'), false);
  }
  const before = learner('Practice algorithms'), entry = simulationAttempt('binary-search');
  const valid = events(before, entry).events;
  assert.ok(valid.some(event => event.type === 'competency.changed' && event.missionId === 'state-search' && event.current === 'verified'));
  const evidence = entry.submission as SimulationEvidence;
  for (const invalid of [
    { ...evidence, prediction: 'incorrect' },
    { ...evidence, predictionMadeBeforeRun: false },
    { ...evidence, transfer: { ...evidence.transfer, prediction: 'incorrect' } },
    { ...evidence, transfer: { ...evidence.transfer, parameter: evidence.parameter } },
    { ...evidence, actual: 'fabricated result' },
    { ...evidence, input: [NaN] },
  ]) assert.deepEqual(events(before, { ...entry, submission: invalid }).events, []);
});

test('two real failures expose the core recovery detour and a fresh check returns to the original mission', async () => {
  let state = learner();
  state = events(state, attempt('first-function', await codeSubmission('first-function', goodCode))).after;
  const bad = await codeSubmission('fix-cart', 'function totalPrice() { return -1; }');
  state = events(state, attempt('fix-cart', bad, { createdAt: '2026-10-24T10:01:00Z' })).after;
  const detour = events(state, attempt('fix-cart', bad, { createdAt: '2026-10-24T10:02:00Z' }));
  const progress = detour.events.find(event => event.type === 'progress.changed');
  assert.ok(progress && progress.type === 'progress.changed');
  assert.equal(progress.current.nextMissionId, 'revision-scope');
  assert.equal(progress.current.recoveryForNodeId, state.roadmap!.nodes.find(node => node.missionId === 'fix-cart')!.id);
  const revision = missions.find(mission => mission.id === 'revision-scope')!;
  const recovered = events(detour.after, attempt(revision.id, { choice: revision.answer }, { createdAt: '2026-10-24T10:03:00Z' }));
  const returned = recovered.events.find(event => event.type === 'progress.changed');
  assert.ok(returned && returned.type === 'progress.changed');
  assert.equal(returned.current.nextMissionId, 'fix-cart');
  assert.equal(returned.current.recoveryForNodeId, null);
});

test('explicit selector time keeps historical transitions deterministic across the revision boundary', async () => {
  const before = learner();
  const entry = attempt('first-function', await codeSubmission('first-function', goodCode));
  const { after } = events(before, entry);
  assert.equal(learningProgress(after, now).nextMissionId, 'fix-cart');
  assert.equal(learningProgress(after, now + 8 * 86400000).nextMissionId, 'first-function');
  assert.equal(learningProgress(after, now + 8 * 86400000).revisionMilestones, 1);
  assert.equal(nextNode(after, now)?.missionId, 'fix-cart');
  assert.equal(nextNode(after, now + 8 * 86400000)?.missionId, 'first-function');
  assert.deepEqual(learningProgress(structuredClone(initialLearner), now), { totalMilestones: 0, completedMilestones: 0, verifiedMilestones: 0, revisionMilestones: 0, nextNodeId: null, nextMissionId: null, recoveryForNodeId: null });
});
