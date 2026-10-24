"use client";
import { useState, type ReactNode } from "react";
import { ArrowRight, Check, FileCheck2, ShieldCheck } from "lucide-react";
import {
  getRevision,
  nodeState,
  totalXP,
  type Attempt,
  type Learner,
} from "@/lib/learning";
import { missions } from "@/lib/missions";
import { learningDate } from "./presentation";
import { Badge, Button, EmptyState, PageHeading, Tabs } from "./primitives";

export function ProgressScreen({
  state,
  view = "dna",
  onView,
  onMission,
  achievements,
  bridge,
}: {
  state: Learner;
  view?: "dna" | "portfolio";
  onView: (value: "dna" | "portfolio") => void;
  onMission: (id: string) => void;
  achievements?: ReactNode;
  bridge?: ReactNode;
}) {
  const hi = state.language === "hi",
    revisions = getRevision(state);
  const nodes = state.roadmap?.nodes ?? [],
    verified = nodes.filter((node) => nodeState(node, state) === "verified");
  return (
    <>
      <PageHeading
        label="Progress"
        title={hi ? "आपकी प्रगति, प्रमाण के साथ।" : "Progress you can inspect."}
        description="A record of your actual attempts, checked tasks, and the conditions attached."
      />
      <Tabs
        label="Progress destinations"
        tabs={[
          { value: "dna", label: "Skills & milestones" },
          { value: "portfolio", label: "Evidence portfolio" },
        ]}
        value={view}
        onChange={(value) => onView(value as "dna" | "portfolio")}
      />
      {view === "dna" ? (
        <>
          <div className="pf-progress-summary">
            <div>
              <strong>{verified.length}</strong>
              <span>currently verified milestones</span>
            </div>
            <div>
              <strong>{state.attempts.length}</strong>
              <span>recorded attempts</span>
            </div>
            <div>
              <strong>{revisions.length}</strong>
              <span>checks to revisit</span>
            </div>
            <div>
              <strong>{totalXP(state)}</strong>
              <span>XP in your learning record</span>
            </div>
          </div>
          {nodes.length ? (
            <section
              className="pf-skill-list"
              aria-label="Current milestone competency"
            >
              {nodes.map((node) => {
                const status = nodeState(node, state);
                return (
                  <div key={node.id}>
                    <span className="pf-topic-icon">
                      <ShieldCheck size={20} />
                    </span>
                    <div>
                      <h2>{hi ? node.titleHi : node.title}</h2>
                      <p>
                        {status === "verified"
                          ? "Current task checks passed without recorded assistance."
                          : status === "completed"
                            ? "Scoped assessed or assisted check completed."
                            : status === "revision"
                              ? "Earlier evidence is due for a fresh check."
                              : status === "blocked"
                                ? "Earlier prerequisites remain visible on your roadmap."
                                : "Practice and record a check to see evidence here."}
                      </p>
                    </div>
                    <Badge
                      tone={
                        status === "verified" || status === "completed"
                          ? "success"
                          : ["revision", "needs-practice"].includes(status)
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {status === "verified"
                        ? "Verified"
                        : status === "completed"
                          ? "Completed"
                          : status === "revision"
                            ? "Revision needed"
                            : status === "blocked"
                              ? "Locked"
                              : "Practicing"}
                    </Badge>
                    <Button
                      variant="quiet"
                      onClick={() => onMission(node.missionId)}
                    >
                      View mission
                      <ArrowRight size={15} />
                    </Button>
                  </div>
                );
              })}
            </section>
          ) : (
            <EmptyState
              icon={<ShieldCheck size={34} />}
              title="Your evidence starts with a task."
              action={
                <Button
                  variant="primary"
                  onClick={() => onMission("first-function")}
                >
                  Try a first mission
                  <ArrowRight size={16} />
                </Button>
              }
            >
              Create a path or try an exercise. Saved results retain their scope
              and assistance labels.
            </EmptyState>
          )}
          {achievements}
          {bridge}
        </>
      ) : (
        <EvidencePortfolio
          attempts={state.attempts}
          language={state.language}
          onMission={onMission}
        />
      )}
      <p className="pf-evidence-limits">
        <ShieldCheck size={17} />
        Task evidence records self-directed browser practice. It does not
        establish identity, authorship, or professional mastery. AI opinions and
        self-reported skills do not verify competence.
      </p>
    </>
  );
}
export function EvidencePortfolio({
  attempts,
  language,
  onMission,
}: {
  attempts: Attempt[];
  language: string;
  onMission: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  if (!attempts.length)
    return (
      <EmptyState
        icon={<FileCheck2 size={36} />}
        title="Your first proof is waiting to happen."
        action={
          <Button variant="primary" onClick={() => onMission("first-function")}>
            Start a mission
            <ArrowRight size={16} />
          </Button>
        }
      >
        Your work and the checks that actually ran will appear here.
      </EmptyState>
    );
  return (
    <div className="pf-evidence-list">
      {attempts
        .slice()
        .reverse()
        .map((attempt) => (
          <article key={attempt.id}>
            <div className="pf-evidence-heading">
              <span className="pf-topic-icon">
                {attempt.passed ? (
                  <Check size={20} />
                ) : (
                  <FileCheck2 size={20} />
                )}
              </span>
              <div>
                <h2>
                  {missions.find(
                    (mission) => mission.id === attempt.missionId,
                  )?.[language === "hi" ? "titleHi" : "title"] ?? attempt.skill}
                </h2>
                <p>
                  {learningDate(attempt.createdAt, language, true)} ·{" "}
                  {attempt.skill}
                </p>
              </div>
              <Badge tone={attempt.passed ? "success" : "neutral"}>
                {attempt.evidenceType === "submitted"
                  ? "Review pending"
                  : attempt.passed
                    ? "Scoped check passed"
                    : "Practice recorded"}
              </Badge>
            </div>
            <p>{attempt.feedback}</p>
            <div className="pf-evidence-meta">
              <span>{attempt.evidenceType} evidence</span>
              <span>
                {attempt.assisted
                  ? "Assistance recorded"
                  : "No assistance recorded"}
              </span>
            </div>
            <button
              type="button"
              className="pf-evidence-toggle"
              aria-expanded={expanded === attempt.id}
              aria-controls={`pf-evidence-${attempt.id}`}
              onClick={() =>
                setExpanded((value) =>
                  value === attempt.id ? null : attempt.id,
                )
              }
            >
              {expanded === attempt.id
                ? "Hide supporting evidence"
                : "Inspect supporting evidence"}
              <ArrowRight size={15} />
            </button>
            {expanded === attempt.id && (
              <pre id={`pf-evidence-${attempt.id}`}>
                {JSON.stringify(
                  { checks: attempt.checks, submission: attempt.submission },
                  null,
                  2,
                )}
              </pre>
            )}
          </article>
        ))}
    </div>
  );
}
