"use client";

import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Clock3,
  Code2,
  Database,
  FlaskConical,
  GitBranch,
  Network,
  Server,
  ShieldCheck,
} from "lucide-react";
import {
  getRevision,
  nextNode,
  nodeState,
  selectSessionMission,
  totalXP,
  type Learner,
} from "@/lib/learning";
import { missions } from "@/lib/missions";
import { Badge, Button, Feedback, Progress } from "./primitives";
import { learningDate } from "./presentation";
import type { WorkspaceView } from "./WorkspaceShell";

const starterGoals = [
  {
    label: "Programming foundations",
    description: "Functions, logic, and your first working program",
    goal: "Learn programming from zero with JavaScript",
    icon: Code2,
  },
  {
    label: "Backend Engineering",
    description: "Git, API contracts, and incident decisions",
    goal: "Practice Git, API reading and incident response",
    icon: Server,
  },
  {
    label: "Data Structures & Algorithms",
    description: "Windows, search boundaries, and cache traces",
    goal: "Practice algorithms and state transitions",
    icon: Network,
  },
  {
    label: "SQL & Databases",
    description: "Practice queries on a real, bounded dataset",
    goal: "Practice SQL filtering and ordering",
    icon: Database,
  },
  {
    label: "Cloud & DevOps",
    description: "Engineering workflow exercises; no cloud deployment",
    goal: "Practice cloud engineering workflows with Git and incident response",
    icon: GitBranch,
  },
  {
    label: "Machine Learning",
    description: "Bounded model simulations and evidence practice",
    goal: "Understand machine learning experiments and evidence",
    icon: FlaskConical,
  },
];

export function HomeScreen({
  state,
  onGoal,
  onMission,
  onNavigate,
  onMinutes,
  onNotice,
  name,
  bonusSummary,
}: {
  state: Learner;
  onGoal: (goal: string) => void;
  onMission: (id: string) => void;
  onNavigate: (view: WorkspaceView) => void;
  onMinutes: (minutes: number) => void;
  onNotice: (message: string) => void;
  name?: string;
  bonusSummary?: React.ReactNode;
}) {
  const [goal, setGoal] = useState("");
  const hi = state.language === "hi",
    next = nextNode(state),
    mission = missions.find((item) => item.id === next?.missionId);
  const nodes = state.roadmap?.nodes ?? [],
    statuses = nodes.map((node) => nodeState(node, state));
  const checked = statuses.filter((status) =>
    ["completed", "verified", "revision"].includes(status),
  ).length;
  const verified = statuses.filter((status) => status === "verified").length;
  const revisions = getRevision(state),
    recent = state.attempts.slice(-3).reverse();
  function findSession() {
    const selected = selectSessionMission(state);
    if (selected) onMission(selected.id);
    else
      onNotice(
        "No unlocked full mission fits this session. Read a brief or save a draft; preparation does not award completion or XP.",
      );
  }
  return (
    <div className="pf-home">
      {!state.roadmap ? (
        <>
          <div className="pf-home-intro">
            <p className="pf-eyebrow">Your learning workspace</p>
            <h1>
              {hi ? "आप क्या सीखना चाहते हैं?" : "What do you want to learn?"}
            </h1>
            <p>
              {hi
                ? "एक लक्ष्य चुनें। हम उसे अभ्यास की एक स्पष्ट राह में बदलेंगे।"
                : "Choose a goal. We’ll turn it into a practical path you can follow."}
            </p>
          </div>
          <section
            className="pf-goal-panel pf-panel"
            aria-label="Start learning"
          >
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (goal.trim().length >= 3) onGoal(goal.trim());
              }}
            >
              <label className="pf-field" htmlFor="pf-learning-goal">
                {hi ? "आपका लक्ष्य" : "Your learning goal"}
              </label>
              <div className="pf-goal-field">
                <BookOpen size={22} />
                <input
                  id="pf-learning-goal"
                  aria-describedby="pf-goal-help"
                  placeholder={
                    hi
                      ? "जैसे: मेरी पहली JavaScript ऐप बनाना"
                      : "For example, build my first JavaScript app"
                  }
                  maxLength={200}
                  value={goal}
                  onChange={(event) => setGoal(event.target.value)}
                />
                <Button
                  type="submit"
                  variant="primary"
                  disabled={goal.trim().length < 3}
                >
                  {hi ? "मेरी सीखने की राह बनाएँ" : "Create my learning path"}
                  <ArrowRight size={17} />
                </Button>
              </div>
              <p id="pf-goal-help">
                Start from zero. Choose your pace. No entrance assessment
                required.
              </p>
            </form>
            <div className="pf-how-it-works">
              <span>
                <b>1</b>Choose a goal
              </span>
              <ChevronRight size={15} />
              <span>
                <b>2</b>Practice something real
              </span>
              <ChevronRight size={15} />
              <span>
                <b>3</b>Keep the evidence
              </span>
            </div>
          </section>
          <section className="pf-goal-section">
            <div className="pf-row">
              <h2>
                {hi ? "शुरुआत करने के कुछ तरीके" : "A few places to start"}
              </h2>
              <Button variant="quiet" onClick={() => onNavigate("explore")}>
                All paths
                <ArrowRight size={15} />
              </Button>
            </div>
            <div className="pf-goal-list">
              {starterGoals.map(
                ({ label, description, goal: value, icon: Icon }) => (
                  <button
                    type="button"
                    key={label}
                    onClick={() => onGoal(value)}
                  >
                    <span className="pf-topic-icon">
                      <Icon size={21} />
                    </span>
                    <span>
                      <strong>{label}</strong>
                      <small>{description}</small>
                    </span>
                    <ArrowRight size={17} />
                  </button>
                ),
              )}
            </div>
            <p className="pf-catalog-note">
              <ShieldCheck size={16} />
              Paths use the supported exercise catalogue. Python-specific goals
              need additional content; curated paths currently use JavaScript.
              Model labs demonstrate bounded concepts, not a complete course.
            </p>
          </section>
        </>
      ) : (
        <>
          <header className="pf-home-intro pf-returning-intro">
            <p className="pf-eyebrow">
              {hi ? "फिर से स्वागत है" : "Welcome back"}, {name || state.name}.
            </p>
            <h1>
              {hi
                ? "जहाँ रुके थे, वहीं से शुरू करें।"
                : "Keep your learning moving."}
            </h1>
            <p>
              {hi ? "आपका लक्ष्य" : "Your goal"}: <strong>{state.goal}</strong>
            </p>
          </header>
          <div className="pf-returning-grid">
            <section className="pf-panel pf-next-mission">
              <div className="pf-row">
                <span className="pf-eyebrow">
                  {next?.recovery
                    ? "Your recovery checkpoint"
                    : "Your next step"}
                </span>
                <Badge tone={next?.recovery ? "warning" : "neutral"}>
                  <Clock3 size={14} />
                  {mission?.minutes ?? state.minutes} min
                </Badge>
              </div>
              <h2>
                {next
                  ? hi
                    ? next.titleHi
                    : next.title
                  : "Your path is complete for now."}
              </h2>
              <p>
                {next?.description ??
                  "Review your evidence or choose another goal to keep building your skills."}
              </p>
              {next?.recovery && (
                <Feedback
                  tone="warning"
                  title="A short detour, with a clear way back"
                >
                  Complete this fresh check, then return to your original
                  mission.
                </Feedback>
              )}
              <Button
                variant="primary"
                onClick={() =>
                  next ? onMission(next.missionId) : onNavigate("dna")
                }
              >
                {next
                  ? hi
                    ? "सीखना जारी रखें"
                    : "Continue Learning"
                  : "Review my progress"}
                <ArrowRight size={17} />
              </Button>
              <small>
                {next && state.drafts[next.missionId]
                  ? "Your unfinished work is saved. Pick up from your draft."
                  : "Actual checks record progress. Opening a lesson does not."}
              </small>
            </section>
            <section className="pf-panel pf-current-path">
              <span className="pf-eyebrow">My Learning</span>
              <h3>{state.roadmap.title}</h3>
              <Badge tone="accent">
                {state.roadmap.source === "ai"
                  ? "AI-generated path"
                  : "Curated path"}
              </Badge>
              <div className="pf-path-count">
                <strong>
                  {checked}
                  <span> / {nodes.length}</span>
                </strong>
                <span>milestones checked</span>
              </div>
              <Progress
                value={checked}
                max={nodes.length}
                label="Checked roadmap milestones"
              />
              <p>
                {verified} currently verified · {revisions.length} to revisit
              </p>
              <Button variant="quiet" onClick={() => onNavigate("roadmap")}>
                Open my roadmap
                <ArrowRight size={16} />
              </Button>
            </section>
          </div>
          <div className="pf-home-lower">
            <section className="pf-recent-work">
              <div className="pf-row">
                <h2>Recent learning</h2>
                <Button variant="quiet" onClick={() => onNavigate("portfolio")}>
                  View evidence
                  <ArrowRight size={15} />
                </Button>
              </div>
              {recent.length ? (
                <ul>
                  {recent.map((attempt) => (
                    <li key={attempt.id}>
                      <span
                        className={`pf-activity-icon ${attempt.passed ? "pf-activity-icon--passed" : ""}`}
                      >
                        {attempt.passed ? (
                          <Check size={18} />
                        ) : (
                          <Code2 size={18} />
                        )}
                      </span>
                      <div>
                        <strong>
                          {missions.find(
                            (item) => item.id === attempt.missionId,
                          )?.title ?? attempt.skill}
                        </strong>
                        <small>
                          {attempt.evidenceType === "submitted"
                            ? "Submitted · review pending"
                            : attempt.passed
                              ? "Scoped checks passed"
                              : "Practice recorded"}{" "}
                          · {learningDate(attempt.createdAt, state.language)}
                        </small>
                      </div>
                      <Button
                        variant="quiet"
                        onClick={() =>
                          attempt.missionId.startsWith("simulation:")
                            ? onNavigate("lab")
                            : onMission(attempt.missionId)
                        }
                      >
                        Review
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="pf-muted">
                  Your first attempt will appear here. Start with the next
                  mission above.
                </p>
              )}
            </section>
            <section className="pf-session">
              <h3>A session that fits your day</h3>
              <p>Have a little time? Find an unlocked task that fits.</p>
              <div
                className="pf-duration"
                role="group"
                aria-label="Session duration"
              >
                {[5, 10, 20, 30].map((minutes) => (
                  <button
                    type="button"
                    key={minutes}
                    aria-pressed={state.minutes === minutes}
                    onClick={() => onMinutes(minutes)}
                  >
                    {minutes} min
                  </button>
                ))}
              </div>
              <Button onClick={findSession}>
                Find a fitting mission
                <ArrowRight size={15} />
              </Button>
              <small>
                {totalXP(state)} XP from the existing learning record.
              </small>
              {bonusSummary}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
