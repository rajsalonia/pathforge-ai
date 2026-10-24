"use client";

import { useState, type ReactNode } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Clock3,
  Code2,
  Lightbulb,
  Play,
  RotateCcw,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { codeChallenges, type Evaluation, type Mission } from "@/lib/missions";
import { Badge, Button, Feedback, PageHeading } from "./primitives";

export type RunnerCaseView = {
  name?: string;
  passed: boolean;
  detail?: string;
  expected?: unknown;
  actual?: unknown;
  error?: string;
};
export type RunnerOutputView = {
  passed?: boolean;
  error?: string;
  cases?: RunnerCaseView[];
};
export type MissionWorkspaceViewProps = {
  mission: Mission;
  language: string;
  text: string;
  choice?: string;
  onText: (text: string) => void;
  onChoice?: (choice: string) => void;
  onBack: () => void;
  onRun: () => void;
  onCheck: () => void;
  onHint: () => void;
  onReset: () => void;
  onContinue: () => void;
  running: boolean;
  evaluation: Evaluation | null;
  runnerOutput: RunnerOutputView | null;
  assisted: boolean;
  hintsUsed: number;
  hint?: string;
  previousFails: number;
  tutor: ReactNode;
  attachments?: ReactNode;
  knowledgeCheck?: ReactNode;
  aiActions?: ReactNode;
  readAloud?: ReactNode;
};

/** Presentation only. The owner keeps source-bound runner evidence and evaluation callbacks. */
export function MissionWorkspaceView({
  mission,
  language,
  text,
  choice,
  onText,
  onChoice,
  onBack,
  onRun,
  onCheck,
  onHint,
  onReset,
  onContinue,
  running,
  evaluation,
  runnerOutput,
  assisted,
  hintsUsed,
  hint,
  previousFails,
  tutor,
  attachments,
  knowledgeCheck,
  aiActions,
  readAloud,
}: MissionWorkspaceViewProps) {
  const [mobilePanel, setMobilePanel] = useState<"workspace" | "support">(
    "workspace",
  );
  const [showBrief, setShowBrief] = useState(false);
  const hi = language === "hi",
    isCode = Boolean(codeChallenges[mission.id]);
  const codeEditor = isCode || ["git", "sql"].includes(mission.type);
  const cases: RunnerCaseView[] =
    evaluation?.checks ?? runnerOutput?.cases ?? [];
  const passed = cases.filter((result) => result.passed).length;
  const success = evaluation?.passed === true;
  const resultTitle = evaluation
    ? evaluation.evidenceType === "submitted"
      ? "Evidence received · review pending"
      : success
        ? evaluation.evidenceType === "assessed"
          ? "Knowledge check passed"
          : assisted
            ? "Task checks passed with assistance"
            : "Task checks verified"
        : "Your next try starts here"
    : runnerOutput?.passed
      ? "Tests passed · ready to record"
      : "Test output";
  return (
    <>
      <Button variant="quiet" className="pf-mission-back" onClick={onBack}>
        <ArrowLeft size={16} />
        Back to My Learning
      </Button>
      <PageHeading
        label={`${mission.skill} · ${mission.type}`}
        title={hi ? mission.titleHi : mission.title}
        description={hi ? mission.objectiveHi : mission.objective}
        action={
          <Badge>
            <Clock3 size={14} />
            {mission.minutes} min
          </Badge>
        }
      />
      <div
        className="pf-mobile-mission-switch"
        role="group"
        aria-label="Mission sections"
      >
        <Button
          aria-pressed={mobilePanel === "workspace"}
          onClick={() => setMobilePanel("workspace")}
        >
          <Code2 size={17} />
          Workspace
        </Button>
        <Button
          aria-pressed={mobilePanel === "support"}
          onClick={() => setMobilePanel("support")}
        >
          <Lightbulb size={17} />
          Help & evidence
        </Button>
      </div>
      <div className={`pf-mission-layout pf-mission-layout--${mobilePanel}`}>
        <div className="pf-mission-primary">
          <section className="pf-panel pf-mission-main">
            <div className="pf-row">
              <h2>{hi ? "आपका मिशन" : "Your mission"}</h2>
              <div className="pf-row">
                {readAloud}
                <Badge>{mission.difficulty}</Badge>
              </div>
            </div>
            <p className="pf-mission-instructions">
              {hi ? mission.instructionsHi : mission.instructions}
            </p>
            <button
              type="button"
              className="pf-brief-toggle"
              aria-expanded={showBrief}
              onClick={() => setShowBrief((value) => !value)}
            >
              <BookOpen size={16} />
              How this is checked{showBrief ? " −" : " +"}
            </button>
            {showBrief && (
              <Feedback title="Evidence has a defined scope">
                {isCode
                  ? "Your current function runs against the fixed exercise cases in an isolated browser worker. Record the result after running; editing the source requires fresh tests."
                  : "This task uses its existing deterministic checks or a bounded scenario assessment. Written work can remain submitted for review without verification."}
              </Feedback>
            )}
            {previousFails >= 2 && (
              <Feedback tone="warning" title="Try one smaller example">
                Trace the simplest input and compare its output with the
                expected result. Your roadmap can offer a short recovery
                checkpoint and a way back.
              </Feedback>
            )}
            {mission.options?.length ? (
              <fieldset className="pf-mission-choices">
                <legend>Choose the response that fits the evidence</legend>
                {mission.options.map((option, index) => (
                  <label key={option}>
                    <input
                      type="radio"
                      name={`pf-mission-choice-${mission.id}`}
                      checked={choice === option}
                      onChange={() => onChoice?.(option)}
                    />
                    <span>{String.fromCharCode(65 + index)}</span>
                    <strong>{option}</strong>
                  </label>
                ))}
              </fieldset>
            ) : null}
            <div className={`pf-editor ${codeEditor ? "pf-editor--code" : ""}`}>
              <div className="pf-editor-header">
                <span>
                  <Code2 size={16} />
                  {isCode
                    ? "solution.js"
                    : mission.type === "sql"
                      ? "query.sql"
                      : mission.type === "git"
                        ? "Git state simulator"
                        : "Your response"}
                </span>
                <Button
                  variant="quiet"
                  aria-label="Reset mission editor"
                  onClick={onReset}
                >
                  <RotateCcw size={16} />
                </Button>
              </div>
              <textarea
                aria-label="Mission answer"
                spellCheck={!codeEditor}
                value={text}
                onChange={(event) => onText(event.target.value)}
                rows={isCode ? 13 : 8}
                placeholder={
                  codeEditor
                    ? "Write your solution…"
                    : "Add your work, reasoning, or observations…"
                }
              />
              <div className="pf-editor-footer">
                <span>
                  {isCode
                    ? "JavaScript · isolated worker · 2 second limit"
                    : mission.type === "sql"
                      ? "Practice SELECT subset · fixed dataset"
                      : "Your work is saved by the existing workspace controller."}
                </span>
              </div>
            </div>
            {attachments}
            {knowledgeCheck}
            <div className="pf-mission-actions">
              <Button
                variant="quiet"
                disabled={hintsUsed >= mission.hints.length}
                onClick={onHint}
              >
                <Lightbulb size={16} />
                Get a hint
                {hintsUsed ? ` (${hintsUsed}/${mission.hints.length})` : ""}
              </Button>
              <div>
                {isCode && (
                  <Button
                    onClick={onRun}
                    disabled={!text.trim()}
                    busy={running}
                  >
                    <Play size={16} />
                    {running ? "Running tests…" : "Run tests"}
                  </Button>
                )}
                <Button
                  variant="primary"
                  disabled={running || success || (!text.trim() && !choice)}
                  onClick={onCheck}
                >
                  {mission.id &&
                  [
                    "teach-back",
                    "story",
                    "roleplay",
                    "real-world",
                    "documentation",
                    "collaborative",
                  ].includes(mission.type)
                    ? "Save written evidence"
                    : hi
                      ? "मेरा काम जाँचें"
                      : "Check my work"}
                  <ArrowRight size={16} />
                </Button>
              </div>
            </div>
            {hint && (
              <Feedback title={`Hint ${hintsUsed}`}>
                <p>{hint}</p>
                <small>Assistance stays attached to your attempt.</small>
              </Feedback>
            )}
            {aiActions}
          </section>
          {(runnerOutput || evaluation) && (
            <section
              className="pf-panel pf-mission-results"
              aria-live="polite"
              aria-atomic="false"
            >
              <div className="pf-row">
                <h2>
                  <Terminal size={19} />
                  {resultTitle}
                </h2>
                <Badge
                  tone={success || runnerOutput?.passed ? "success" : "warning"}
                >
                  {passed} of {cases.length} checks
                </Badge>
              </div>
              {evaluation && (
                <p>
                  {hi
                    ? (evaluation.feedbackHi ?? evaluation.feedback)
                    : evaluation.feedback}
                </p>
              )}
              {runnerOutput?.error && (
                <Feedback tone="danger" title="The runner stopped">
                  {runnerOutput.error}
                </Feedback>
              )}
              <ul>
                {cases.map((result, index) => (
                  <li key={index}>
                    <span
                      className={
                        result.passed ? "pf-check-pass" : "pf-check-fail"
                      }
                    >
                      {result.passed ? (
                        <Check size={18} />
                      ) : (
                        <AlertCircle size={18} />
                      )}
                    </span>
                    <div>
                      <strong>{result.name ?? `Case ${index + 1}`}</strong>
                      {result.detail && <p>{result.detail}</p>}
                      {result.expected !== undefined && (
                        <code>
                          Expected {JSON.stringify(result.expected)} · Received{" "}
                          {JSON.stringify(result.actual)}
                        </code>
                      )}
                      {result.error && <p>{result.error}</p>}
                    </div>
                  </li>
                ))}
              </ul>
              {success && (
                <Button variant="primary" onClick={onContinue}>
                  Return to my path
                  <ArrowRight size={16} />
                </Button>
              )}
            </section>
          )}
        </div>
        <aside
          className="pf-mission-support"
          aria-label="Mission help and evidence"
        >
          {tutor}
          <section className="pf-panel pf-evidence-explanation">
            <ShieldCheck size={22} />
            <h3>Keep the conditions with the result.</h3>
            <p>
              Actual checks, source, and assistance belong in your record. AI
              feedback is advice; it does not replace verification.
            </p>
            <p>
              Browser practice is task-scoped evidence, not identity,
              authorship, or professional certification.
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}
