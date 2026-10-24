import assert from 'node:assert/strict';
import { test } from 'node:test';
// @ts-expect-error Native Node TypeScript tests require explicit .ts imports.
import { initialLearner, pathways, curatedRoadmap, nodeState, nextNode, totalXP, getRevision, selectSessionMission, adaptAfterAttempt, type Learner, type Attempt, type SkillNode } from './learning.ts';
// @ts-expect-error Native Node TypeScript tests require explicit .ts imports.
import { missions } from './missions.ts';

const now = Date.now(), day = 86400000;
let attemptNumber = 0;
function attempt(missionId: string, passed = true, offset = 0, extra: Partial<Attempt> = {}): Attempt {
  return { id: `test-${attemptNumber++}`, missionId, skill: missions.find(m => m.id === missionId)?.skill ?? 'Simulation', passed, evidenceType: 'tested', assisted: false, feedback: 'Test feedback', checks: [{ name: 'Test check', passed }], submission: {}, createdAt: new Date(now + offset).toISOString(), minutes: 5, ...extra };
}
function learner(goal = 'Learn JavaScript', attempts: Attempt[] = []): Learner { return { ...structuredClone(initialLearner), goal, roadmap: curatedRoadmap(goal, 'beginner'), attempts }; }
function node(state: Learner, missionId: string): SkillNode { const found = state.roadmap?.nodes.find(n => n.missionId === missionId); assert.ok(found, `Missing node ${missionId}`); return found; }

test('all curated routes use accurate catalogue titles, unique missions, and real upstream prerequisites', () => {
  for (const goal of [...pathways.map(path => path.goal), 'Learn Python', 'Learn photography', 'Understand machine learning', 'Understand operating systems']) {
    const roadmap = curatedRoadmap(goal, 'beginner');
    assert.equal(roadmap.source, 'curated');
    assert.match(roadmap.description, /not AI generated/);
    assert.equal(new Set(roadmap.nodes.map(n => n.id)).size, roadmap.nodes.length);
    assert.equal(new Set(roadmap.nodes.map(n => n.missionId)).size, roadmap.nodes.length);
    for (const [index, item] of roadmap.nodes.entries()) {
      const mission = missions.find(m => m.id === item.missionId)!;
      assert.ok(mission, goal);
      assert.equal(item.title, mission.title, goal);
      assert.equal(item.titleHi, mission.titleHi, goal);
      for (const prerequisite of mission.prerequisites) {
        const requiredIndex = roadmap.nodes.findIndex(n => n.missionId === prerequisite);
        assert.ok(requiredIndex >= 0 && requiredIndex < index, `${goal}: ${prerequisite} must be upstream of ${mission.id}`);
        assert.ok(item.prerequisites.includes(roadmap.nodes[requiredIndex].id));
      }
      for (const requiredId of item.prerequisites) assert.ok(roadmap.nodes.some(n => n.id === requiredId));
    }
  }
  const python = curatedRoadmap('Learn Python', 'beginner');
  assert.equal(python.title, 'JavaScript foundations');
  assert.match(python.description, /not a complete React course or a Python runtime/);
  assert.match(curatedRoadmap('Learn SQL', 'beginner').description, /does not support joins/);
});

test('a prior failed attempt does not bypass missing prerequisites or produce a blocked next node', () => {
  const state = learner();
  const locked = node(state, 'fix-cart');
  state.roadmap!.nodes = [locked];
  state.attempts = [attempt('fix-cart', false), attempt('fix-cart', false, 1)];
  assert.equal(nodeState(locked, state), 'blocked');
  assert.equal(nextNode(state), undefined);
});

test('a current pass, assistance, and the latest successful revision determine the node state', () => {
  const old = attempt('first-function', true, -20 * day);
  const fresh = attempt('first-function', true, -day);
  const state = learner('Learn JavaScript', [fresh, old]);
  assert.equal(nodeState(node(state, 'first-function'), state, now), 'verified');
  assert.deepEqual(getRevision(state, now), []);
  state.attempts = [old];
  assert.equal(nodeState(node(state, 'first-function'), state, now), 'revision');
  assert.equal(getRevision(state, now)[0].id, old.id);
  state.attempts.push(fresh);
  assert.equal(nodeState(node(state, 'first-function'), state, now), 'verified');
  state.attempts = [{ ...fresh, assisted: true }];
  assert.equal(nodeState(node(state, 'first-function'), state, now), 'completed');
});

test('revision reminders resolve old failures after a new pass and ignore unreviewed submissions', () => {
  const failure = attempt('first-function', false, -3 * day), success = attempt('first-function', true, -day);
  const state = learner('Learn JavaScript', [failure, success]);
  assert.deepEqual(getRevision(state, now), []);
  const newFailure = attempt('first-function', false, -1000);
  state.attempts.push(newFailure);
  assert.equal(getRevision(state, now)[0].id, newFailure.id);
  assert.equal(nodeState(node(state, 'first-function'), state, now), 'attempted');
  state.attempts.push(attempt('teach-closure', false, 0, { evidenceType: 'submitted' }));
  assert.equal(getRevision(state, now).length, 1);
});

test('only matching binary-search simulation evidence satisfies the search checkpoint', () => {
  const state = learner('Practice algorithms');
  const search = node(state, 'state-search');
  state.attempts = [attempt('simulation:sorting')];
  assert.equal(nodeState(search, state, now), 'available');
  state.attempts.push(attempt('simulation:binary-search'));
  assert.equal(nodeState(search, state, now), 'available', 'an arbitrary passed flag alone is not matching model evidence');
  state.attempts.push(attempt('simulation:binary-search', true, 1, { submission: { method: 'deterministic-state-model', predictionMadeBeforeRun: true } }));
  assert.equal(nodeState(search, state, now), 'verified');
});

test('XP awards each known mission or simulation once and never awards unknown or merely submitted work', () => {
  const state = learner('Learn JavaScript', [attempt('first-function'), attempt('first-function'), attempt('first-function', false), attempt('simulation:sorting'), attempt('simulation:sorting'), attempt('unknown-id'), attempt('teach-closure', true, 0, { evidenceType: 'submitted' })]);
  assert.equal(totalXP(state), missions.find(m => m.id === 'first-function')!.xp + 25);
});

test('session choice prioritizes fitting roadmap work and returns a transparent null when no exercise fits', () => {
  const state = learner('Practice SQL');
  state.minutes = 10;
  assert.equal(selectSessionMission(state)?.id, 'query-learners');
  state.minutes = 2;
  assert.equal(selectSessionMission(state), null, 'new learners must not be given a blocked recall question');
  state.attempts.push(attempt('first-function'));
  const short = selectSessionMission(state);
  assert.equal(short?.id, 'revision-scope');
  assert.ok(short!.minutes <= 2);
  state.minutes = Number.NaN;
  assert.equal(selectSessionMission(state), null);
});

test('two JavaScript failures add one actionable detour, require fresh evidence, and return to the original mission', () => {
  const foundation = attempt('first-function', true, -10 * day), oldRecall = attempt('revision-scope', true, -9000, { evidenceType: 'assessed' });
  let state = learner('Learn JavaScript', [foundation, oldRecall]);
  const originalId = node(state, 'fix-cart').id;
  const failOne = attempt('fix-cart', false, -8000), failTwo = attempt('fix-cart', false, -7000);
  state = adaptAfterAttempt(state, failOne);
  assert.equal(state.roadmap!.nodes.some(n => n.recovery), false);
  state = adaptAfterAttempt(state, failTwo);
  const detour = state.roadmap!.nodes.find(n => n.recovery)!;
  assert.ok(detour);
  assert.equal(detour.missionId, 'revision-scope');
  assert.match(detour.description, /not a diagnosis/);
  assert.equal(node(state, 'fix-cart').id, originalId);
  assert.ok(node(state, 'fix-cart').prerequisites.includes(detour.id));
  assert.equal(nodeState(node(state, 'fix-cart'), state, now), 'blocked');
  assert.equal(nodeState(detour, state, now), 'available', 'the old recall pass must not satisfy a new detour');
  assert.equal(nextNode(state)?.id, detour.id);
  assert.equal(selectSessionMission({ ...state, minutes: 2 })?.id, 'revision-scope');
  const sameEvent = adaptAfterAttempt(state, failTwo);
  assert.equal(sameEvent.attempts.length, state.attempts.length);
  assert.equal(sameEvent.roadmap!.nodes.length, state.roadmap!.nodes.length);
  state = adaptAfterAttempt(state, attempt('revision-scope', true, -6000, { evidenceType: 'assessed' }));
  assert.equal(nodeState(node(state, 'fix-cart'), state, now), 'needs-practice');
  assert.equal(nextNode(state)?.id, originalId, 'return to the original task before an unrelated overdue review');
  state = adaptAfterAttempt(state, attempt('fix-cart', true, -5000));
  assert.equal(nodeState(node(state, 'fix-cart'), state, now), 'verified');
  assert.equal(new Set(state.roadmap!.nodes.map(n => n.missionId)).size, state.roadmap!.nodes.length);
});

test('subsequent recovery reuses its checkpoint without relocking the previous completed mission', () => {
  let state = learner('Learn JavaScript', [attempt('first-function', true, -20000)]);
  state = adaptAfterAttempt(state, attempt('fix-cart', false, -19000));
  state = adaptAfterAttempt(state, attempt('fix-cart', false, -18000));
  state = adaptAfterAttempt(state, attempt('revision-scope', true, -17000, { evidenceType: 'assessed' }));
  state = adaptAfterAttempt(state, attempt('fix-cart', true, -16000));
  state = adaptAfterAttempt(state, attempt('build-focus', false, -15000));
  state = adaptAfterAttempt(state, attempt('build-focus', false, -14000));
  assert.equal(state.roadmap!.nodes.filter(n => n.missionId === 'revision-scope').length, 1);
  assert.equal(nodeState(node(state, 'fix-cart'), state, now), 'verified');
  assert.equal(nodeState(node(state, 'build-focus'), state, now), 'blocked');
  assert.equal(nodeState(node(state, 'revision-scope'), state, now), 'available');
});

test('recovery preserves an existing node whose identifier happens to match the detour name', () => {
  let state = learner('Learn JavaScript', [attempt('first-function', true, -4000)]);
  const original = node(state, 'fix-cart'), review = node(state, 'review-boundary');
  review.id = `detour-${original.id}`;
  state = adaptAfterAttempt(state, attempt('fix-cart', false, -3000));
  state = adaptAfterAttempt(state, attempt('fix-cart', false, -2000));
  assert.equal(node(state, 'review-boundary').id, review.id);
  assert.notEqual(node(state, 'revision-scope').id, review.id);
  assert.equal(new Set(state.roadmap!.nodes.map(n => n.id)).size, state.roadmap!.nodes.length);
});

test('no speculative JavaScript diagnosis is added for SQL, submitted work, or unavailable foundations', () => {
  let sql = learner('Learn SQL');
  sql = adaptAfterAttempt(sql, attempt('query-learners', false));
  sql = adaptAfterAttempt(sql, attempt('query-learners', false, 1));
  assert.equal(sql.roadmap!.nodes.some(n => n.recovery), false);
  let state = learner('Learn JavaScript');
  state = adaptAfterAttempt(state, attempt('first-function', false));
  state = adaptAfterAttempt(state, attempt('first-function', false, 1));
  assert.equal(state.roadmap!.nodes.some(n => n.recovery), false, 'do not introduce a prerequisite cycle');
  state = adaptAfterAttempt(state, attempt('teach-closure', false, 2, { evidenceType: 'submitted' }));
  state = adaptAfterAttempt(state, attempt('teach-closure', false, 3, { evidenceType: 'submitted' }));
  assert.equal(state.roadmap!.nodes.some(n => n.recovery), false);
});
