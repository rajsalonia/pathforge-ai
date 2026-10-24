// @ts-expect-error Native Node TypeScript tests require explicit .ts imports.
import { missions, type Mission } from './missions.ts';
// @ts-expect-error Native Node TypeScript tests require explicit .ts imports.
import { simulationTopics } from './simulations.ts';

export type SkillNode = { id: string; title: string; titleHi: string; description: string; prerequisites: string[]; missionId: string; x: number; y: number; recovery?: { forNodeId: string; triggerAttemptId: string; startedAt: string } };
export type Roadmap = { title: string; description: string; nodes: SkillNode[]; source?: 'curated' | 'ai' };
export type Attempt = { id: string; missionId: string; skill: string; passed: boolean; evidenceType: string; assisted: boolean; feedback: string; checks: unknown[]; submission: unknown; createdAt: string; minutes: number };
export type Learner = { version: 1; name: string; goal: string; roadmap: Roadmap | null; attempts: Attempt[]; minutes: number; language: string; level: string; claimedSkills: string[]; drafts: Record<string, string>; projects: { expenses: { id: string; label: string; amount: number }[]; features: string[] }; preferences: { largeText: boolean; reducedMotion: boolean }; activity: { date: string; label: string }[] };
export const initialLearner: Learner = { version: 1, name: 'Explorer', goal: '', roadmap: null, attempts: [], minutes: 20, language: 'en', level: 'beginner', claimedSkills: [], drafts: {}, projects: { expenses: [], features: [] }, preferences: { largeText: false, reducedMotion: false }, activity: [] };

// Card identifiers stay stable; visible copy describes the actual exercise catalogue.
export const pathways = [
  { id: 'react', name: 'JavaScript foundations', goal: 'Build JavaScript foundations for a focus timer', tag: 'BUILD SOMETHING', description: 'From your first function to a tested timer state engine.', color: 'purple', icon: 'react', topics: 'JavaScript · Debugging · Projects' },
  { id: 'python', name: 'Programming foundations', goal: 'Learn programming from zero with JavaScript', tag: 'START WITH THE BASICS', description: 'Make your first working program in the JavaScript runner.', color: 'mint', icon: 'code', topics: 'Logic · Functions · Debugging' },
  { id: 'sql', name: 'SQL query practice', goal: 'Practice SQL filtering and ordering', tag: 'MAKE DATA MAKE SENSE', description: 'Query a fixed table, then strengthen engineering habits.', color: 'blue', icon: 'database', topics: 'SELECT · Filtering · Ordering' },
  { id: 'dsa', name: 'Algorithm practice', goal: 'Practice algorithms and state transitions', tag: 'THINK LIKE AN ENGINEER', description: 'Work through window sums, search boundaries, and an LRU trace.', color: 'peach', icon: 'network', topics: 'Windows · Binary search · LRU' },
  { id: 'backend', name: 'Engineering workflows', goal: 'Practice Git, API reading and incident response', tag: 'BEHIND THE SCENES', description: 'Practice repository state and engineering decisions.', color: 'blue', icon: 'server', topics: 'Git simulator · API contracts · Incidents' },
  { id: 'ai', name: 'Experiments & evidence', goal: 'Practice experimental reasoning with a cache', tag: 'EXPLORE WHAT’S POSSIBLE', description: 'Predict a bounded experiment and check its actual trace.', color: 'purple', icon: 'sparkles', topics: 'LRU trace · Assumptions · Review' },
  { id: 'os', name: 'Systems reasoning', goal: 'Practice state reasoning and incident decisions', tag: 'UNDER THE HOOD', description: 'Reason from explicit states and an incident timeline.', color: 'mint', icon: 'cpu', topics: 'State transitions · Mitigation · Evidence' },
  { id: 'career', name: 'Confident communication', goal: 'Practice engineering communication', tag: 'FIND YOUR VOICE', description: 'Explain a blocker and incorporate concrete feedback.', color: 'peach', icon: 'message', topics: 'Roleplay · Review · Collaboration' },
  { id: 'creative', name: 'Accessibility fieldwork', goal: 'Run a keyboard accessibility audit', tag: 'OBSERVE SOMETHING REAL', description: 'Inspect an interface, record observations, and request review.', color: 'mint', icon: 'camera', topics: 'Keyboard checks · Observations · Feedback' },
];

export function curatedRoadmap(goal: string, level: string): Roadmap {
  const text = goal.toLowerCase();
  let title = 'JavaScript foundations', ids = ['first-function', 'fix-cart', 'review-boundary', 'sliding-window', 'build-focus', 'teach-closure'];
  let scope = 'JavaScript function tests, debugging, a timer state engine, and a closure explanation. This is not a complete React course or a Python runtime.';
  if (/sql|database|data base/.test(text)) {
    title = 'SQL practice & engineering habits'; ids = ['query-learners', 'review-boundary', 'docs-to-fetch', 'incident-spike'];
    scope = 'One constrained SELECT exercise plus named review, API-contract, and incident exercises. The SQL editor does not support joins, transactions, or arbitrary SQL.';
  } else if (/algorithm|\bdsa\b|dynamic|interview.*cod/.test(text)) {
    title = 'Algorithms & explicit state'; ids = ['state-search', 'first-function', 'sliding-window', 'lab-cache', 'review-boundary'];
    scope = 'Binary-search state, JavaScript window-sum tests, and a fixed LRU trace. These bounded exercises do not establish general algorithmic mastery.';
  } else if (/communication|presentation|negotiation|interview|standup/.test(text)) {
    title = 'Engineering communication'; ids = ['story-release', 'roleplay-standup', 'review-boundary', 'relay-review'];
    scope = 'Engineering scenarios and actual artifact review. Open-ended work is submitted for review; no human partner or verified communication skill is invented.';
  } else if (/accessibility|keyboard|\ba11y\b|audit/.test(text)) {
    title = 'Accessibility observation & feedback'; ids = ['real-accessibility', 'roleplay-standup', 'review-boundary', 'relay-review'];
    scope = 'A real keyboard audit report plus named communication and review exercises. Reports require review and do not certify accessibility compliance.';
  } else if (/backend|git|docker|cloud|\bapi\b|incident/.test(text)) {
    title = 'Practical engineering workflows'; ids = ['ship-change', 'review-boundary', 'incident-spike', 'docs-to-fetch', 'query-learners', 'roleplay-standup'];
    scope = 'An in-memory Git repository, incident decisions, API-contract reading, and a fixed SQL table. No real cloud deployment or backend runtime is implied.';
  } else if (/experiment|cache|evidence|machine|\bai\b|model/.test(text)) {
    title = 'Experimental reasoning practice'; ids = ['lab-cache', 'review-boundary', 'docs-to-fetch', 'story-release'];
    scope = 'A deterministic LRU experiment and engineering evidence exercises. These missions are not machine-learning training; the separate lab offers bounded model simulations.';
  } else if (/operating|network|computer science|memory|systems|state reasoning/.test(text)) {
    title = 'State & incident reasoning'; ids = ['state-search', 'lab-cache', 'review-boundary', 'incident-spike'];
    scope = 'A binary-search transition, an LRU trace, code review, and incident mitigation. This is not an operating-systems or networking course; those models are explored separately in the lab.';
  }
  const ordered: Mission[] = [], seen = new Set<string>();
  function include(id: string) {
    if (seen.has(id)) return;
    const mission = missions.find(m => m.id === id);
    if (!mission) return;
    seen.add(id); mission.prerequisites.forEach(include); ordered.push(mission);
  }
  ids.forEach(include);
  const byMission = new Map(ordered.map((mission, index) => [mission.id, `node-${index}`]));
  const nodes: SkillNode[] = ordered.map((mission, index) => ({
    id: byMission.get(mission.id)!, title: mission.title, titleHi: mission.titleHi, description: mission.objective,
    prerequisites: mission.prerequisites.map(id => byMission.get(id)!), missionId: mission.id,
    x: index % 3 === 0 ? 310 : index % 3 === 1 ? 130 : 490, y: index === 0 ? 55 : 230 + Math.floor((index - 1) / 2) * 175,
  }));
  return { title, description: `Curated ${level === 'beginner' ? 'introductory' : 'practice-led'} selection for “${goal.trim().slice(0, 100)}”. ${scope} Titles and prerequisites come from the exercise catalogue; this path was not AI generated.`, nodes, source: 'curated' };
}

const REVISION_AGE = 7 * 86400000;
const recognizedSimulations = new Set(simulationTopics.map(topic => `simulation:${topic.id}`));
const isGraded = (attempt: Attempt) => attempt.evidenceType === 'tested' || attempt.evidenceType === 'assessed';
const isPass = (attempt: Attempt) => attempt.passed === true && isGraded(attempt);
const timeOf = (attempt: Pick<Attempt, 'createdAt'>) => { const value = Date.parse(attempt.createdAt); return Number.isFinite(value) ? value : 0; };
function latest(attempts: Attempt[]): Attempt | undefined { return attempts.reduce<Attempt | undefined>((result, attempt) => !result || timeOf(attempt) >= timeOf(result) ? attempt : result, undefined); }
function matchesMission(attempt: Attempt, missionId: string): boolean {
  if (attempt.missionId === missionId) return true;
  const evidence = attempt.submission && typeof attempt.submission === 'object' ? attempt.submission as Record<string, unknown> : null;
  return missionId === 'state-search' && attempt.missionId === 'simulation:binary-search' && isPass(attempt)
    && evidence?.method === 'deterministic-state-model' && evidence?.predictionMadeBeforeRun === true;
}
function attemptsForNode(node: SkillNode, state: Learner): Attempt[] {
  return state.attempts.filter((attempt, index) => {
    if (!matchesMission(attempt, node.missionId)) return false;
    if (!node.recovery) return true;
    const triggerTime = Date.parse(node.recovery.startedAt), at = timeOf(attempt);
    return at > triggerTime || (at === triggerTime && index > state.attempts.findIndex(a => a.id === node.recovery!.triggerAttemptId));
  });
}
function nodeHasPass(node: SkillNode, state: Learner): boolean { return attemptsForNode(node, state).some(isPass); }
function missionHasPass(id: string, state: Learner): boolean { return state.attempts.some(a => matchesMission(a, id) && isPass(a)); }
function prerequisitesMet(node: SkillNode, state: Learner): boolean {
  const mission = missions.find(m => m.id === node.missionId);
  return !!mission && mission.prerequisites.every(id => missionHasPass(id, state)) && node.prerequisites.every(id => {
    const required = state.roadmap?.nodes.find(candidate => candidate.id === id);
    return !!required && nodeHasPass(required, state);
  });
}

export function nodeState(node: SkillNode, state: Learner, now = Date.now()): string {
  const pendingRecovery = node.prerequisites.some(id => { const dependency = state.roadmap?.nodes.find(n => n.id === id); return dependency?.recovery && !nodeHasPass(dependency, state); });
  if (pendingRecovery) return 'blocked';
  const own = attemptsForNode(node, state), passed = latest(own.filter(isPass));
  const lastGraded = latest(own.filter(isGraded));
  const failedSincePass = own.filter((a, index) => isGraded(a) && !a.passed && (!passed || timeOf(a) > timeOf(passed) || (timeOf(a) === timeOf(passed) && index > own.indexOf(passed)))).length;
  if (passed && (!lastGraded || lastGraded.passed)) {
    if (now - timeOf(passed) > REVISION_AGE) return 'revision';
    return passed.evidenceType === 'tested' && !passed.assisted ? 'verified' : 'completed';
  }
  if (!prerequisitesMet(node, state)) return 'blocked';
  if (failedSincePass >= 2) return 'needs-practice';
  return own.length ? 'attempted' : 'available';
}

const actionable = new Set(['available', 'attempted', 'needs-practice', 'revision']);
function returnFromRecovery(state: Learner, now = Date.now()): SkillNode | undefined {
  for (const recovery of state.roadmap?.nodes ?? []) {
    if (!recovery.recovery || !nodeHasPass(recovery, state)) continue;
    const original = state.roadmap?.nodes.find(node => node.id === recovery.recovery!.forNodeId);
    if (original && actionable.has(nodeState(original, state, now))) return original;
  }
}
export function nextNode(state: Learner, now = Date.now()): SkillNode | undefined {
  const nodes = state.roadmap?.nodes ?? [];
  return nodes.find(node => node.recovery && actionable.has(nodeState(node, state, now))) ?? returnFromRecovery(state, now) ?? nodes.find(node => actionable.has(nodeState(node, state, now)));
}

/** A full available exercise that fits. Null means only a clearly labelled prep action fits. */
export function selectSessionMission(state: Learner): Mission | null {
  const budget = Number.isFinite(state.minutes) ? Math.max(0, state.minutes) : 0;
  const nodes = [...(state.roadmap?.nodes ?? [])];
  const returnNode = returnFromRecovery(state);
  nodes.sort((a, b) => Number(Boolean(b.recovery)) - Number(Boolean(a.recovery)) || Number(b.id === returnNode?.id) - Number(a.id === returnNode?.id));
  for (const node of nodes) {
    if (!actionable.has(nodeState(node, state))) continue;
    const mission = missions.find(m => m.id === node.missionId);
    if (mission && mission.minutes <= budget) return mission;
  }
  return missions.find(mission => mission.minutes <= budget && !missionHasPass(mission.id, state) && mission.prerequisites.every(id => missionHasPass(id, state))) ?? null;
}

/** Idempotent attempt reducer; activity and project updates can remain with the caller. */
export function adaptAfterAttempt(state: Learner, attempt: Attempt): Learner {
  const attempts = state.attempts.some(item => item.id === attempt.id) ? state.attempts : [...state.attempts, attempt];
  const updated = attempts === state.attempts ? state : { ...state, attempts };
  const mission = missions.find(item => item.id === attempt.missionId);
  if (!updated.roadmap || !mission || attempt.passed || !isGraded(attempt) || mission.skill !== 'JavaScript' || ['first-function', 'revision-scope'].includes(mission.id)) return updated;
  const recent = attempts.filter(item => item.missionId === mission.id && isGraded(item)).sort((a, b) => timeOf(a) - timeOf(b)).slice(-2);
  if (recent.length < 2 || recent.some(item => item.passed) || recent[recent.length - 1].id !== attempt.id) return updated;
  const original = updated.roadmap.nodes.find(node => node.missionId === mission.id);
  const foundation = updated.roadmap.nodes.find(node => node.missionId === 'first-function');
  if (!original || !foundation || !nodeHasPass(foundation, updated)) return updated;
  const existing = updated.roadmap.nodes.find(node => node.missionId === 'revision-scope');
  if (existing?.recovery && !nodeHasPass(existing, updated)) return updated;
  let recoveryId = existing?.id ?? `detour-${original.id.slice(0, 65)}`;
  if (!existing) {
    const base = recoveryId; let suffix = 1;
    while (updated.roadmap.nodes.some(node => node.id === recoveryId)) recoveryId = `${base}-${suffix++}`;
  }
  if (existing?.recovery?.triggerAttemptId === attempt.id) return updated;
  const revision = missions.find(item => item.id === 'revision-scope')!;
  const recovery: SkillNode = {
    id: recoveryId, missionId: revision.id, title: 'A small JavaScript detour', titleHi: 'JavaScript का छोटा पुनराभ्यास',
    description: `Two unsuccessful checked attempts at “${mission.title}” triggered this short block-scope recall checkpoint. It is a practice reset, not a diagnosis of your mistake or proof of broader mastery. Complete a fresh check, then return to “${mission.title}”.`,
    prerequisites: [foundation.id], x: 730, y: original.y,
    recovery: { forNodeId: original.id, triggerAttemptId: attempt.id, startedAt: attempt.createdAt },
  };
  const nodes = updated.roadmap.nodes.map(node => node.id === recoveryId ? recovery
    : node.id === original.id ? { ...node, prerequisites: [...new Set([...node.prerequisites, recoveryId])] }
      : existing?.recovery?.forNodeId === node.id ? { ...node, prerequisites: node.prerequisites.filter(id => id !== recoveryId) } : node);
  if (!existing) nodes.splice(nodes.findIndex(node => node.id === original.id), 0, recovery);
  return { ...updated, roadmap: { ...updated.roadmap, nodes } };
}

export function totalXP(state: Learner): number {
  return [...new Set(state.attempts.filter(isPass).map(attempt => attempt.missionId))].reduce((total, id) => total + (missions.find(mission => mission.id === id)?.xp ?? (recognizedSimulations.has(id) ? 25 : 0)), 0);
}

export function getRevision(state: Learner, now = Date.now()): Attempt[] {
  const groups = new Map<string, Attempt[]>();
  for (const attempt of state.attempts) {
    if (!isGraded(attempt) || (!missions.some(m => m.id === attempt.missionId) && !recognizedSimulations.has(attempt.missionId))) continue;
    const key = matchesMission(attempt, 'state-search') ? 'state-search' : attempt.missionId;
    groups.set(key, [...(groups.get(key) ?? []), attempt]);
  }
  const due: Attempt[] = [];
  for (const [missionId, history] of groups) {
    const lastPass = latest(history.filter(isPass)), last = latest(history)!;
    if ((!last.passed && (!lastPass || timeOf(last) >= timeOf(lastPass))) || (lastPass && now - timeOf(lastPass) > REVISION_AGE)) due.push({ ...(lastPass && last.passed ? lastPass : last), missionId });
  }
  return due.sort((a, b) => timeOf(a) - timeOf(b));
}

export function exportFile(name: string, value: unknown) {
  const blob = new Blob([typeof value === 'string' ? value : JSON.stringify(value, null, 2)], { type: typeof value === 'string' ? 'text/plain' : 'application/json' });
  const url = URL.createObjectURL(blob), anchor = document.createElement('a');
  anchor.href = url; anchor.download = name; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

