// @ts-expect-error Native Node TypeScript tests require explicit .ts imports.
import { nextNode, nodeState, type Attempt, type Learner } from './learning.ts';
// @ts-expect-error Native Node TypeScript tests require explicit .ts imports.
import { confirmSubmissionCheck, evaluateMission, missions, type Evaluation } from './missions.ts';
// @ts-expect-error Native Node TypeScript tests require explicit .ts imports.
import { answersMatch, runSimulation, simulationTopics } from './simulations.ts';

export type EvidenceScope = 'task-tests' | 'bounded-knowledge-check' | 'simulation-predictions' | 'unreviewed-submission';
export type CompetencyStatus = 'blocked' | 'available' | 'attempted' | 'needs-practice' | 'revision' | 'completed' | 'verified';
export type LearningProgress = {
  totalMilestones: number;
  completedMilestones: number;
  verifiedMilestones: number;
  revisionMilestones: number;
  nextNodeId: string | null;
  nextMissionId: string | null;
  recoveryForNodeId: string | null;
};
type EventBase = {
  version: 1;
  eventId: string;
  /** Opaque account/device namespace. Never use an email, name, or provider key. */
  learnerScope: string;
  attemptId: string;
  occurredAt: string;
};
type AssessmentSummary = {
  missionId: string;
  evidenceType: Evaluation['evidenceType'];
  scope: EvidenceScope;
  assisted: boolean;
  checksPassed: number;
  checksTotal: number;
};
export type LearningEvent =
  | EventBase & AssessmentSummary & { type: 'attempt.recorded'; passed: boolean }
  | EventBase & AssessmentSummary & { type: 'task.checks.passed' }
  | EventBase & { type: 'competency.changed'; nodeId: string; missionId: string; previous: CompetencyStatus | null; current: CompetencyStatus | null }
  | EventBase & { type: 'progress.changed'; previous: LearningProgress; current: LearningProgress };

export type LearningEventContext = {
  learnerScope: string;
  attemptId: string;
  /** Restoring, importing, or merging snapshots must never trigger new rewards. */
  origin: 'interaction' | 'restore';
};

type Assessment = { passed: boolean; evidenceType: Evaluation['evidenceType']; scope: EvidenceScope; checks: { passed: boolean }[] };
const record = (value: unknown): Record<string, unknown> | null => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
const statuses = new Set<CompetencyStatus>(['blocked', 'available', 'attempted', 'needs-practice', 'revision', 'completed', 'verified']);
function competencyStatuses(state: Learner, now: number): Map<string, CompetencyStatus> {
  return new Map((state.roadmap?.nodes ?? []).flatMap(node => {
    const status = nodeState(node, state, now) as CompetencyStatus;
    return statuses.has(status) ? [[node.id, status] as const] : [];
  }));
}

/** Read-only presentation projection of the existing core selectors, with no reward policy. */
export function learningProgress(state: Learner, now = Date.now()): LearningProgress {
  const values = [...competencyStatuses(state, now).values()];
  const next = nextNode(state, now);
  return {
    totalMilestones: state.roadmap?.nodes.length ?? 0,
    completedMilestones: values.filter(status => ['completed', 'verified', 'revision'].includes(status)).length,
    verifiedMilestones: values.filter(status => status === 'verified').length,
    revisionMilestones: values.filter(status => status === 'revision').length,
    nextNodeId: next?.id ?? null,
    nextMissionId: next?.missionId ?? null,
    recoveryForNodeId: next?.recovery?.forNodeId ?? null,
  };
}

function assessSimulation(attempt: Attempt): Assessment | null {
  const id = attempt.missionId.slice('simulation:'.length);
  if (!simulationTopics.some(topic => topic.id === id)) return null;
  const data = record(attempt.submission), transfer = record(data?.transfer);
  if (!data || !transfer || data.method !== 'deterministic-state-model' || data.predictionMadeBeforeRun !== true
    || !Array.isArray(data.input) || data.input.length > 12 || !data.input.every(value => typeof value === 'number' && Number.isFinite(value))
    || typeof data.parameter !== 'number' || typeof data.prediction !== 'string' || typeof transfer.prediction !== 'string') return null;
  const computed = runSimulation(id, data.input.join(', '), data.parameter);
  // Replay the existing deterministic model, including its chosen changed-parameter
  // transfer. No source, learner explanation, URL, or shell command is executed.
  if (transfer.input !== computed.check.input || transfer.parameter !== computed.check.parameter
    || data.actual !== computed.answer || transfer.actual !== computed.check.expected) return null;
  return {
    passed: answersMatch(data.prediction, computed.answer) && answersMatch(transfer.prediction, computed.check.expected),
    evidenceType: 'tested', scope: 'simulation-predictions',
    checks: [{ passed: answersMatch(data.prediction, computed.answer) }, { passed: answersMatch(transfer.prediction, computed.check.expected) }],
  };
}

function assess(attempt: Attempt): Assessment | null {
  try {
    if (attempt.missionId.startsWith('simulation:')) return assessSimulation(attempt);
    if (!missions.some(mission => mission.id === attempt.missionId)) return null;
    const submission = record(attempt.submission);
    const evaluated = typeof submission?.checkChoice === 'string'
      ? confirmSubmissionCheck(attempt.missionId, attempt.submission, submission.checkChoice)
      : evaluateMission(attempt.missionId, attempt.submission);
    return { ...evaluated, scope: evaluated.evidenceType === 'tested' ? 'task-tests' : evaluated.evidenceType === 'assessed' ? 'bounded-knowledge-check' : 'unreviewed-submission' };
  } catch {
    // A malformed imported record cannot become a positive learning event.
    return null;
  }
}

function sameProgress(a: LearningProgress, b: LearningProgress): boolean {
  return (Object.keys(a) as (keyof LearningProgress)[]).every(key => a[key] === b[key]);
}

/**
 * Derive versioned events after one core-evaluated attempt is accepted into state.
 * Pure: no mutation, persistence, subscriptions, XP, achievements or streak updates.
 * A repeated transition produces stable IDs; consumers still need durable deduplication.
 * This is self-directed task evidence, not server/identity/authorship attestation.
 */
export function deriveLearningEvents(before: Learner, after: Learner, context: LearningEventContext): LearningEvent[] {
  if (context.origin !== 'interaction' || !context.learnerScope.trim() || context.learnerScope.length > 256
    || !context.attemptId || before.attempts.some(attempt => attempt.id === context.attemptId)) return [];
  // Only a single append is an interactive assessment transition. Bulk imports,
  // history replacements, and merges belong to restoration even if mislabeled.
  if (after.attempts.length !== before.attempts.length + 1
    || before.attempts.some((attempt, index) => {
      const retained = after.attempts[index];
      return attempt !== retained && JSON.stringify(attempt) !== JSON.stringify(retained);
    })) return [];
  const matching = after.attempts.filter(attempt => attempt.id === context.attemptId);
  if (matching.length !== 1 || after.attempts[after.attempts.length - 1].id !== context.attemptId) return [];
  const attempt = matching[0], now = Date.parse(attempt.createdAt);
  if (!Number.isFinite(now) || typeof attempt.assisted !== 'boolean') return [];
  const assessment = assess(attempt);
  // A stored passed flag (or arbitrary client checks) is never sufficient.
  if (!assessment || assessment.passed !== attempt.passed || assessment.evidenceType !== attempt.evidenceType) return [];
  const base: Omit<EventBase, 'eventId'> = { version: 1, learnerScope: context.learnerScope, attemptId: attempt.id, occurredAt: attempt.createdAt };
  const eventId = (type: LearningEvent['type'], target = attempt.missionId) => JSON.stringify([1, context.learnerScope, attempt.id, type, target]);
  const summary: AssessmentSummary = {
    missionId: attempt.missionId, evidenceType: assessment.evidenceType, scope: assessment.scope,
    assisted: attempt.assisted, checksTotal: assessment.checks.length,
    checksPassed: assessment.checks.filter(check => check.passed).length,
  };
  const events: LearningEvent[] = [{ ...base, ...summary, eventId: eventId('attempt.recorded'), type: 'attempt.recorded', passed: assessment.passed }];
  if (assessment.passed && assessment.evidenceType !== 'submitted' && summary.checksTotal > 0 && summary.checksPassed === summary.checksTotal) {
    events.push({ ...base, ...summary, eventId: eventId('task.checks.passed'), type: 'task.checks.passed' });
  }
  const previous = competencyStatuses(before, now), current = competencyStatuses(after, now);
  for (const id of new Set([...previous.keys(), ...current.keys()])) {
    const oldStatus = previous.get(id) ?? null, newStatus = current.get(id) ?? null;
    if (oldStatus === newStatus) continue;
    const node = after.roadmap?.nodes.find(candidate => candidate.id === id) ?? before.roadmap?.nodes.find(candidate => candidate.id === id);
    if (node) events.push({ ...base, eventId: eventId('competency.changed', id), type: 'competency.changed', nodeId: id, missionId: node.missionId, previous: oldStatus, current: newStatus });
  }
  const oldProgress = learningProgress(before, now), newProgress = learningProgress(after, now);
  if (!sameProgress(oldProgress, newProgress)) events.push({ ...base, eventId: eventId('progress.changed', 'roadmap'), type: 'progress.changed', previous: oldProgress, current: newProgress });
  return events;
}
