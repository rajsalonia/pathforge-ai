import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
// @ts-expect-error Native Node TypeScript execution requires the .ts extension.
import { missions, codeChallenges, codeFingerprint, evaluateMission, runConstrainedSql, simulateGit, simulateLru, getMissionStatus, chooseNextMission, submissionChecks, confirmSubmissionCheck } from './missions.ts';

const workerSource = readFileSync(new URL('../public/code-worker.js', import.meta.url), 'utf8');
type WorkerOutput = { id: string; sourceHash: string; passed: boolean; cases: { actual?: unknown; passed: boolean; error?: string }[]; error?: string };
async function runWorker(code: string, functionName: string, cases: { args: unknown[]; expected: unknown }[]): Promise<WorkerOutput> {
  let output: WorkerOutput | undefined;
  const sandbox: Record<string, unknown> = { structuredClone, postMessage: (result: WorkerOutput) => { output = JSON.parse(JSON.stringify(result)); } };
  sandbox.self = sandbox;
  runInNewContext(workerSource, sandbox, { timeout: 1000 });
  const handler = sandbox.onmessage as (event: unknown) => Promise<void>;
  await handler({ data: { id: 'test-run', code, functionName, cases } });
  assert.ok(output, 'worker must return a result');
  return output;
}

test('catalogue covers all 17 mission mechanisms with valid acyclic prerequisites', () => {
  assert.equal(missions.length, 17);
  assert.equal(new Set(missions.map(m => m.id)).size, missions.length);
  assert.equal(new Set(missions.map(m => m.type)).size, 17);
  const visited = new Set<string>(), stack = new Set<string>();
  function visit(id: string) {
    assert.ok(!stack.has(id), `Cycle at ${id}`);
    if (visited.has(id)) return;
    const mission = missions.find(m => m.id === id);
    assert.ok(mission, `Missing prerequisite ${id}`);
    assert.ok(mission.titleHi && mission.instructionsHi && mission.objectiveHi);
    assert.ok(mission.minutes > 0 && mission.xp > 0 && mission.hints.length >= 2);
    stack.add(id); mission.prerequisites.forEach(visit); stack.delete(id); visited.add(id);
  }
  missions.forEach(m => visit(m.id));
});

test('practice SQL filters, sorts and projects data without executing code', () => {
  const result = runConstrainedSql('SELECT name, xp FROM learners WHERE xp >= 150 ORDER BY xp DESC;');
  assert.deepEqual(result.rows, [{ name: 'Meera', xp: 240 }, { name: 'Ishan', xp: 200 }, { name: 'Asha', xp: 160 }]);
  assert.equal(evaluateMission('query-learners', { query: 'select xp, name from learners where xp > 149 order by xp desc' }).passed, true);
  assert.equal(evaluateMission('query-learners', { query: 'SELECT * FROM learners WHERE xp >= 150 ORDER BY xp DESC' }).passed, false);
  assert.deepEqual(runConstrainedSql("SELECT name FROM learners WHERE skill = 'SQL' ORDER BY name ASC LIMIT 1").rows, [{ name: 'Ishan' }]);
  assert.deepEqual(runConstrainedSql('SELECT name FROM learners WHERE xp < 0').rows, []);
});

test('practice SQL rejects writes, multiple statements, coercions, and unsupported syntax', () => {
  for (const query of [
    'DELETE FROM learners', 'SELECT * FROM learners; DROP TABLE learners;',
    'SELECT password FROM learners', 'SELECT COUNT(*) FROM learners',
    'SELECT name FROM learners JOIN users ON id = id',
    "SELECT name FROM learners WHERE xp = '160'", 'SELECT name FROM learners LIMIT 0',
    'SELECT name FROM learners WHERE xp > 100 OR 1 = 1',
  ]) assert.throws(() => runConstrainedSql(query), query);
  assert.equal(evaluateMission('query-learners', { query: 'DROP TABLE learners' }).passed, false);
});

const gitSolution = 'git switch -c feature/learning-log\nedit README.md "PathForge learning log: first mission completed."\ngit add README.md\ngit commit -m "Add first learning log"';
test('Git creates a real snapshot on the feature branch and preserves main', () => {
  const state = simulateGit(gitSolution);
  assert.equal(state.branches.main, 'c0');
  assert.equal(state.branches['feature/learning-log'], 'c1');
  assert.equal(state.commits[1].parent, 'c0');
  assert.equal(state.commits[1].files['README.md'], 'PathForge learning log: first mission completed.');
  assert.deepEqual(state.errors, []);
  assert.equal(evaluateMission('ship-change', { commands: gitSolution }).passed, true);
  const switched = simulateGit(`${gitSolution}\ngit switch main`);
  assert.equal(switched.files['README.md'], '# PathForge\nLearn by doing.\n');
  assert.equal(switched.commits[1].files['README.md'], 'PathForge learning log: first mission completed.');
});

test('Git commits staged contents rather than a later working-tree edit', () => {
  const state = simulateGit('git switch -c feature/test\nedit README.md "staged version"\ngit add README.md\nedit README.md "later version"\ngit commit -m "Store staged version"');
  assert.equal(state.commits[1].files['README.md'], 'staged version');
  assert.equal(state.files['README.md'], 'later version');
  assert.deepEqual(state.modified, ['README.md']);
  assert.equal(evaluateMission('ship-change', { commands: gitSolution.replace('git add README.md\n', '') }).passed, false);
});

test('Git safe switching preserves edits when the target has identical tracked content', () => {
  const state = simulateGit('git switch -c feature/test\nedit README.md "pending"\ngit switch main');
  assert.equal(state.branch, 'main');
  assert.equal(state.files['README.md'], 'pending');
  assert.deepEqual(state.modified, ['README.md']);
  assert.deepEqual(state.errors, []);
});

test('Git switching refuses to overwrite dirty changes; unstaging preserves the file', () => {
  const state = simulateGit(`${gitSolution}\nedit README.md "uncommitted work"\ngit switch main`);
  assert.equal(state.branch, 'feature/learning-log');
  assert.equal(state.files['README.md'], 'uncommitted work');
  assert.match(state.errors[0], /overwrite changes/);
  const unstaged = simulateGit('edit notes.md "private notes"\ngit add notes.md\ngit restore --staged notes.md');
  assert.deepEqual(unstaged.staged, []);
  assert.deepEqual(unstaged.untracked, ['notes.md']);
  assert.equal(unstaged.files['notes.md'], 'private notes');
});

test('Git parser rejects shell commands and branch reuse rather than executing them', () => {
  const state = simulateGit('git switch -c main\nrm -rf /\ngit commit -m "nothing"');
  assert.equal(state.errors.length, 3);
  assert.equal(state.commits.length, 1);
  assert.equal(evaluateMission('ship-change', { commands: gitSolution.replace('feature/learning-log', 'main') }).passed, false);
});

test('LRU experiment computes recency on hits and returns an independent trace', () => {
  const result = simulateLru(['A', 'B', 'A', 'C', 'B'], 2);
  assert.equal(result.hits, 1);
  assert.equal(result.misses, 4);
  assert.deepEqual(result.cache, ['C', 'B']);
  assert.deepEqual(result.trace[2].cache, ['B', 'A']);
  assert.deepEqual(result.trace[3].cache, ['A', 'C']);
  assert.equal(evaluateMission('lab-cache', { text: '{"hits":1,"misses":4,"cache":["C","B"]}' }).passed, true);
  assert.equal(evaluateMission('lab-cache', { hits: 1, misses: 4, cache: ['B', 'C'] }).passed, false);
  assert.equal(evaluateMission('lab-cache', { text: 'not JSON' }).passed, false);
  assert.throws(() => simulateLru(['A'], 0));
});

test('browser worker tests the learner function and backend rechecks fixed actual values', async () => {
  const code = 'function formatMinutes(n) { return n + (n === 1 ? " minute" : " minutes"); }';
  const challenge = codeChallenges['first-function'];
  const testResults = await runWorker(code, challenge.functionName, challenge.cases);
  assert.equal(testResults.passed, true);
  assert.equal(testResults.sourceHash, codeFingerprint(code));
  const result = evaluateMission('first-function', { code, testResults });
  assert.equal(result.passed, true);
  assert.equal(result.evidenceType, 'tested');
  assert.ok(result.feedbackHi);
  testResults.cases[0].actual = 'forged wrong output';
  assert.equal(evaluateMission('first-function', { code, testResults }).passed, false);
});

test('worker reports broken code, exceptions, and mutated inputs as failed evidence', async () => {
  const challenge = codeChallenges['fix-cart'];
  const broken = await runWorker('function totalPrice(items) { return items.reduce((total,item) => item.price*item.quantity,0); }', challenge.functionName, challenge.cases);
  assert.equal(broken.passed, false);
  assert.equal(broken.cases[1].actual, 15);
  const throwing = await runWorker('function totalPrice() { throw new Error("cannot calculate"); }', challenge.functionName, challenge.cases);
  assert.equal(throwing.passed, false);
  assert.match(throwing.cases[0].error!, /cannot calculate/);
  const mutating = await runWorker('function totalPrice(items) { let sum=items.reduce((a,x)=>a+x.price*x.quantity,0); items.push({price:0,quantity:0}); return sum; }', challenge.functionName, challenge.cases);
  assert.equal(mutating.passed, false);
  assert.match(mutating.cases[0].error!, /changed its input/);
});

test('worker revokes networking, worker creation, and dynamic-code globals', async () => {
  const result = await runWorker('function noIO() { return [typeof fetch,typeof WebSocket,typeof importScripts,typeof Worker,typeof eval,typeof Function,typeof postMessage]; }', 'noIO', [{ args: [], expected: Array(7).fill('undefined') }]);
  assert.equal(result.passed, true);
  const imports = await runWorker('function sample() { return import("https://example.com/a.js"); }', 'sample', [{ args: [], expected: null }]);
  assert.match(imports.error!, /Imports are not supported/);
});

test('worker does not silently convert NaN to a valid expected null', async () => {
  const result = await runWorker('function sample() { return NaN; }', 'sample', [{ args: [], expected: null }]);
  assert.equal(result.passed, false);
  assert.match(result.cases[0].error!, /non-finite/);
});

test('stale, incomplete and absent worker evidence cannot complete a coding mission', async () => {
  const code = 'function formatMinutes(n) { return n + (n===1 ? " minute" : " minutes"); }';
  const testResults = await runWorker(code, 'formatMinutes', codeChallenges['first-function'].cases);
  assert.equal(evaluateMission('first-function', { code: `${code}\n// changed`, testResults }).passed, false);
  assert.equal(evaluateMission('first-function', { code }).passed, false);
  assert.equal(evaluateMission('first-function', { code, testResults: { ...testResults, cases: testResults.cases.slice(0, 1) } }).passed, false);
});

test('project timer state engine handles start, pause, reset, tick, zero, and unknown actions', async () => {
  const code = `function updateTimer(state, action) {
    if (action === 'start') return {...state, running:state.remaining > 0};
    if (action === 'pause') return {...state,running:false};
    if (action === 'reset') return {...state,remaining:state.total,running:false};
    if (action === 'tick' && state.running) { const remaining=Math.max(0,state.remaining-1); return {...state,remaining,running:remaining>0}; }
    return {...state};
  }`;
  const challenge = codeChallenges['build-focus'];
  const testResults = await runWorker(code, challenge.functionName, challenge.cases);
  assert.equal(evaluateMission('build-focus', { code, testResults }).passed, true);
});

test('selected scenario decisions are assessed and arbitrary keywords never verify open work', () => {
  const review = missions.find(m => m.id === 'review-boundary')!;
  assert.equal(evaluateMission(review.id, { choice: review.answer }).passed, true);
  assert.equal(evaluateMission(review.id, { choice: review.answer }).evidenceType, 'assessed');
  assert.equal(evaluateMission(review.id, { choice: review.options![0] }).passed, false);
  assert.equal(evaluateMission('state-search', { choice: '[0, 2]' }).passed, true);
  for (const id of ['docs-to-fetch', 'teach-closure', 'real-accessibility', 'relay-review', 'roleplay-standup']) {
    const result = evaluateMission(id, { text: 'lexical scope tests accessible feedback retry cancellation '.repeat(4) });
    assert.equal(result.passed, false, id);
    assert.equal(result.evidenceType, 'submitted', id);
    assert.equal(result.requiresAI, true, id);
  }
  assert.equal(evaluateMission('teach-closure', { text: 'closure' }).requiresAI, false);
  assert.equal(evaluateMission('unknown', 'anything').passed, false);
});

test('progression honors prerequisites, available time, skill preference, and in-progress work', () => {
  assert.equal(getMissionStatus('fix-cart', []), 'locked');
  assert.equal(getMissionStatus('fix-cart', ['first-function']), 'available');
  assert.equal(getMissionStatus('fix-cart', ['first-function'], ['fix-cart']), 'in-progress');
  assert.equal(getMissionStatus('fix-cart', ['first-function', 'fix-cart']), 'completed');
  assert.equal(getMissionStatus('unknown', []), 'locked');
  assert.equal(chooseNextMission([], 3), null);
  assert.equal(chooseNextMission([], 10, 'SQL')?.id, 'query-learners');
  assert.equal(chooseNextMission(['first-function'], 10, 'SQL', ['fix-cart'])?.id, 'fix-cart');
  const all = missions.map(m => m.id);
  assert.equal(chooseNextMission(all, 100), null);
});

test('written evidence and its bounded knowledge check remain distinct assessments', () => {
  for (const missionId of ['teach-closure', 'docs-to-fetch', 'real-accessibility', 'roleplay-standup']) {
    const check = submissionChecks[missionId], text = 'Actual written artifact with observations and reasoning. '.repeat(3);
    assert.equal(confirmSubmissionCheck(missionId, { text: 'too short' }, check.answer).passed, false);
    const pending = evaluateMission(missionId, { text });
    assert.equal(pending.passed, false);
    assert.equal(pending.requiresAI, true);
    const incorrect = confirmSubmissionCheck(missionId, { text }, 'not a provided answer');
    assert.equal(incorrect.passed, false);
    const assessed = confirmSubmissionCheck(missionId, { text }, check.answer);
    assert.equal(assessed.passed, true);
    assert.equal(assessed.evidenceType, 'assessed');
    assert.equal(assessed.requiresAI, true, 'artifact quality still requires review');
    assert.match(assessed.feedback, /artifact remains unreviewed/);
    assert.ok(assessed.checks.every(c => c.passed));
  }
});
