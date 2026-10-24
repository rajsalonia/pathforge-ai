// TEST HARNESS ONLY. This is not an application route or replacement controller.
// Starts empty, records real evaluator/model results, and uses a namespaced test store.
import { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  initialLearner,
  curatedRoadmap,
  adaptAfterAttempt,
  nextNode,
  type Learner,
  type Attempt,
} from "@/lib/learning";
import {
  deriveLearningEvents,
  type LearningEvent,
} from "@/lib/learning-events";
import {
  missions,
  codeChallenges,
  evaluateMission,
  confirmSubmissionCheck,
  submissionChecks,
} from "@/lib/missions";
import {
  runSimulation,
  answersMatch,
  simulationTopics,
  type SimulationEvidence,
  type SimulationResult,
} from "@/lib/simulations";
import {
  WorkspaceShell,
  HomeScreen,
  GoalDialog,
  RoadmapScreen,
  MissionWorkspaceView,
  LearningCompanion,
  PracticeCatalog,
  ProgressScreen,
  SimulationWorkbench,
  SimulationFrameView,
  ExplorePaths,
  SettingsView,
  ProjectsView,
  CollaborationView,
  SkillBridgeView,
  MilestoneNotice,
  Button,
  Feedback,
  Tabs,
  type RunnerOutputView,
  type WorkspaceView,
} from "@/app/components/workspace-v2";

import { StatesFixture } from "./StatesFixture";

const storageKey = "pathforge-ui-component-test-v1";
function Fixture() {
  const [state, setState] = useState<Learner>(() => {
    try {
      return (
        JSON.parse(localStorage.getItem(storageKey) ?? "null") ??
        structuredClone(initialLearner)
      );
    } catch {
      return structuredClone(initialLearner);
    }
  });
  const [view, setView] = useState<WorkspaceView>("home"),
    [active, setActive] = useState("first-function");
  const [goal, setGoal] = useState(""),
    [level, setLevel] = useState("beginner"),
    [dialog, setDialog] = useState(false);
  const [text, setText] = useState(""),
    [choice, setChoice] = useState(""),
    [hints, setHints] = useState(0),
    [running, setRunning] = useState(false);
  const [evaluation, setEvaluation] = useState<ReturnType<
      typeof evaluateMission
    > | null>(null),
    [runnerOutput, setRunnerOutput] = useState<RunnerOutputView | null>(null);
  const [question, setQuestion] = useState(""),
    [notice, setNotice] = useState(""),
    [knowledgeChoice, setKnowledgeChoice] = useState("");
  const [success, setSuccess] = useState<Extract<
    LearningEvent,
    { type: "task.checks.passed" }
  > | null>(null);
  const evidence = useRef<{ code: string; output: unknown } | null>(null),
    worker = useRef<Worker | null>(null);
  const mission = missions.find((item) => item.id === active)!;
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(state));
    document.documentElement.lang = state.language;
  }, [state]);
  useEffect(
    () => () => {
      worker.current?.terminate();
    },
    [],
  );
  function navigate(value: WorkspaceView) {
    setView(value);
    window.scrollTo(0, 0);
  }
  function update(patch: Partial<Learner>) {
    setState((previous) => ({ ...previous, ...patch }));
  }
  function openMission(id: string) {
    if (!missions.some((item) => item.id === id)) {
      setNotice("This evidence belongs to the Simulation Lab.");
      setView("lab");
      return;
    }
    worker.current?.terminate();
    evidence.current = null;
    setActive(id);
    setText(
      state.drafts[id] ??
        missions.find((item) => item.id === id)?.starter ??
        "",
    );
    setChoice("");
    setHints(0);
    setEvaluation(null);
    setRunnerOutput(null);
    setRunning(false);
    setKnowledgeChoice("");
    navigate("mission");
  }
  function edit(value: string) {
    setText(value);
    evidence.current = null;
    setRunnerOutput(null);
    setEvaluation(null);
    setKnowledgeChoice("");
    setState((previous) => ({
      ...previous,
      drafts: { ...previous.drafts, [active]: value },
    }));
  }
  function begin(value: string) {
    setGoal(value);
    setDialog(true);
  }
  function record(entry: Attempt) {
    const after = adaptAfterAttempt(state, entry);
    const resultEvents = deriveLearningEvents(state, after, {
      learnerScope: "ui-component-test",
      attemptId: entry.id,
      origin: "interaction",
    });
    setState(after);
    setSuccess(
      resultEvents.find(
        (
          event,
        ): event is Extract<LearningEvent, { type: "task.checks.passed" }> =>
          event.type === "task.checks.passed",
      ) ?? null,
    );
  }
  function check(bounded = false) {
    const submission = bounded
      ? { text, checkChoice: knowledgeChoice, artifactReview: "pending" }
      : {
          text,
          query: text,
          commands: text,
          code: text,
          choice,
          testResults:
            evidence.current?.code === text
              ? evidence.current.output
              : undefined,
        };
    const result = bounded
      ? confirmSubmissionCheck(active, submission, knowledgeChoice)
      : evaluateMission(active, submission);
    setEvaluation(result);
    record({
      id: crypto.randomUUID(),
      missionId: active,
      skill: mission.skill,
      passed: result.passed,
      evidenceType: result.evidenceType,
      assisted: hints > 0,
      feedback: result.feedback,
      checks: result.checks,
      submission,
      createdAt: new Date().toISOString(),
      minutes: Math.min(state.minutes, mission.minutes),
    });
  }
  function run() {
    const source = text;
    setRunning(true);
    setEvaluation(null);
    evidence.current = null;
    worker.current?.terminate();
    const instance = new Worker("/api/runner");
    worker.current = instance;
    const timer = setTimeout(() => {
      if (worker.current === instance) {
        instance.terminate();
        worker.current = null;
        setRunning(false);
        setRunnerOutput({ error: "Execution stopped after 2 seconds." });
      }
    }, 2000);
    instance.onmessage = (event) => {
      if (worker.current !== instance) return;
      clearTimeout(timer);
      evidence.current = { code: source, output: event.data };
      setRunnerOutput(event.data);
      setRunning(false);
      instance.terminate();
      worker.current = null;
    };
    instance.onerror = () => {
      clearTimeout(timer);
      if (worker.current !== instance) return;
      setRunnerOutput({ error: "The isolated runner could not start." });
      setRunning(false);
      instance.terminate();
      worker.current = null;
    };
    instance.postMessage({
      id: active,
      code: source,
      ...codeChallenges[active],
    });
  }
  const tutor = (
    <LearningCompanion
      question={question}
      messages={[]}
      busy={false}
      error={notice.includes("provider") ? notice : undefined}
      onQuestion={setQuestion}
      onSend={() =>
        setNotice(
          "Live AI provider is not configured in this test environment. No request was sent.",
        )
      }
    />
  );
  const knowledge = submissionChecks[active];
  return (
    <WorkspaceShell
      view={view}
      onNavigate={navigate}
      onMission={openMission}
      language={state.language}
      onLanguage={() =>
        update({ language: state.language === "hi" ? "en" : "hi" })
      }
      name={state.name}
      accountLabel="Component test · local data"
      sync="Test state saved in this browser"
      largeText={state.preferences.largeText}
      reducedMotion={state.preferences.reducedMotion}
    >
      {success && (
        <MilestoneNotice
          event={success}
          nextTitle={nextNode(state)?.title}
          onDismiss={() => setSuccess(null)}
          onContinue={() => {
            setSuccess(null);
            const next = nextNode(state);
            if (next) openMission(next.missionId);
            else navigate("dna");
          }}
        />
      )}
      {notice && (
        <Feedback title="Workspace feedback">
          {notice}
          <Button variant="quiet" onClick={() => setNotice("")}>
            Dismiss
          </Button>
        </Feedback>
      )}
      {view === "home" && (
        <HomeScreen
          state={state}
          onGoal={begin}
          onMission={openMission}
          onNavigate={navigate}
          onMinutes={(minutes) => update({ minutes })}
          onNotice={setNotice}
        />
      )}
      {view === "roadmap" && (
        <RoadmapScreen
          state={state}
          onMission={openMission}
          onGoal={() => begin(state.goal)}
        />
      )}
      {view === "missions" && (
        <PracticeCatalog
          state={state}
          onMission={openMission}
          onLab={() => navigate("lab")}
        />
      )}
      {view === "explore" && <ExplorePaths onGoal={begin} />}
      {view === "mission" && (
        <MissionWorkspaceView
          key={active}
          mission={mission}
          language={state.language}
          text={text}
          choice={choice}
          onText={edit}
          onChoice={setChoice}
          onBack={() => navigate("roadmap")}
          onRun={run}
          onCheck={() => check()}
          onHint={() =>
            setHints((value) => Math.min(mission.hints.length, value + 1))
          }
          onReset={() => edit(mission.starter ?? "")}
          onContinue={() => navigate("roadmap")}
          running={running}
          evaluation={evaluation}
          runnerOutput={runnerOutput}
          assisted={hints > 0}
          hintsUsed={hints}
          hint={hints ? mission.hints[hints - 1] : undefined}
          previousFails={
            state.attempts.filter(
              (entry) =>
                entry.missionId === active &&
                !entry.passed &&
                ["tested", "assessed"].includes(entry.evidenceType),
            ).length
          }
          tutor={tutor}
          knowledgeCheck={
            knowledge &&
            evaluation?.evidenceType === "submitted" &&
            text.length >= 80 ? (
              <fieldset className="pf-mission-choices">
                <legend>{knowledge.question}</legend>
                {knowledge.options.map((option) => (
                  <label key={option}>
                    <input
                      type="radio"
                      name="ui-knowledge"
                      checked={knowledgeChoice === option}
                      onChange={() => setKnowledgeChoice(option)}
                    />
                    <strong>{option}</strong>
                  </label>
                ))}
                <Button disabled={!knowledgeChoice} onClick={() => check(true)}>
                  Assess the bounded question
                </Button>
              </fieldset>
            ) : undefined
          }
        />
      )}
      {view === "lab" && (
        <>
          <Tabs
            label="Practice destinations"
            tabs={[
              { value: "missions", label: "Missions" },
              { value: "lab", label: "Simulation Lab" },
            ]}
            value="lab"
            onChange={(value) => navigate(value as WorkspaceView)}
          />
          <Lab
            language={state.language}
            onEvidence={(id, result) =>
              record({
                id: crypto.randomUUID(),
                missionId: id,
                skill: result.topic,
                passed: true,
                evidenceType: "tested",
                assisted: false,
                feedback: "Both bounded model predictions matched.",
                checks: result.checks,
                submission: result,
                createdAt: new Date().toISOString(),
                minutes: 10,
              })
            }
          />
        </>
      )}
      {(view === "dna" || view === "portfolio") && (
        <ProgressScreen
          state={state}
          view={view}
          onView={navigate}
          onMission={openMission}
          bridge={
            <SkillBridgeView
              known={question}
              result=""
              busy={false}
              onKnown={setQuestion}
              onAnalyze={() =>
                setNotice(
                  "Live AI provider is not configured in this test environment.",
                )
              }
            />
          }
        />
      )}
      {view === "projects" && (
        <ProjectsView
          state={state}
          onMission={openMission}
          onDownload={() =>
            setNotice(
              "Project export remains with the existing application controller.",
            )
          }
          timer={<p>Existing functional timer belongs in this slot.</p>}
          onAddExpense={(label, amount) =>
            update({
              projects: {
                ...state.projects,
                expenses: [
                  ...state.projects.expenses,
                  { id: crypto.randomUUID(), label, amount },
                ],
              },
            })
          }
          onDeleteExpense={(id) =>
            update({
              projects: {
                ...state.projects,
                expenses: state.projects.expenses.filter(
                  (expense) => expense.id !== id,
                ),
              },
            })
          }
        />
      )}
      {view === "together" && (
        <CollaborationView
          authenticated={false}
          room={null}
          code={question}
          role="structure"
          contribution=""
          busy={false}
          onCode={setQuestion}
          onRole={() => {}}
          onContribution={() => {}}
          onAction={() => {}}
          onCopy={() => {}}
          artifact={null}
        />
      )}
      {view === "settings" && (
        <SettingsView
          state={state}
          onUpdate={update}
          sync="Component test storage only; account sync stays with the application controller."
          authenticated={false}
          ready
          hasBackup={false}
          onExport={() =>
            setNotice("Export remains with the application controller.")
          }
          onImport={() =>
            setNotice("Import remains with the application controller.")
          }
          onBackup={() => {}}
          onReload={() => {}}
          onDelete={() => {
            localStorage.removeItem(storageKey);
            setState(structuredClone(initialLearner));
          }}
        />
      )}
      <GoalDialog
        open={dialog}
        goal={goal}
        level={level}
        minutes={state.minutes}
        language={state.language}
        busy={false}
        aiAvailability="not-configured"
        onGoal={setGoal}
        onLevel={setLevel}
        onMinutes={(minutes) => update({ minutes })}
        onLanguage={(language) => update({ language })}
        onCreate={() => {
          update({ goal, level, roadmap: curatedRoadmap(goal, level) });
          setDialog(false);
          navigate("roadmap");
        }}
        onClose={() => setDialog(false)}
      />
    </WorkspaceShell>
  );
}
function Lab({
  language,
  onEvidence,
}: {
  language: string;
  onEvidence: (id: string, evidence: SimulationEvidence) => void;
}) {
  const [selected, setSelected] = useState(
    simulationTopics.find((topic) => topic.id === "sorting")!,
  );
  const [input, setInput] = useState(selected.input),
    [parameter, setParameter] = useState(selected.parameter),
    [prediction, setPrediction] = useState("");
  const [result, setResult] = useState<SimulationResult | null>(null),
    [step, setStep] = useState(0),
    [transfer, setTransfer] = useState(""),
    [explanation, setExplanation] = useState(""),
    [verification, setVerification] = useState<"correct" | "incorrect" | null>(
      null,
    ),
    [saved, setSaved] = useState(false);
  const preview = useMemo(() => {
    try {
      return {
        data: runSimulation(selected.id, input, parameter),
        error: undefined,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : "Invalid input",
      };
    }
  }, [selected, input, parameter]);
  function reset() {
    setResult(null);
    setStep(0);
    setPrediction("");
    setTransfer("");
    setExplanation("");
    setVerification(null);
    setSaved(false);
  }
  function verify() {
    if (!result) return;
    const original = answersMatch(prediction, result.answer),
      correct = answersMatch(transfer, result.check.expected);
    setVerification(correct ? "correct" : "incorrect");
    if (!original || !correct) return;
    setSaved(true);
    onEvidence(`simulation:${selected.id}`, {
      type: "simulation",
      topic: selected.name,
      title: selected.name,
      category: selected.category,
      status: "verified",
      passed: true,
      score: 2,
      total: 2,
      method: "deterministic-state-model",
      scope: "Two bounded predictions",
      model: selected.model,
      input: result.input,
      parameter,
      prediction,
      actual: result.answer,
      predictionMadeBeforeRun: true,
      transfer: {
        input: result.check.input,
        parameter: result.check.parameter,
        prediction: transfer,
        actual: result.check.expected,
      },
      explanation,
      explanationGraded: false,
      transitions: result.frames.length,
      checks: [
        {
          name: "Prediction",
          passed: true,
          expected: result.answer,
          actual: prediction,
        },
        {
          name: "Transfer",
          passed: true,
          expected: result.check.expected,
          actual: transfer,
        },
      ],
    });
  }
  return (
    <SimulationWorkbench
      topics={simulationTopics}
      selected={selected}
      input={input}
      parameter={parameter}
      prediction={prediction}
      result={result ?? preview.data}
      frameIndex={step}
      started={Boolean(result)}
      predictionCorrect={Boolean(
        result && answersMatch(prediction, result.answer),
      )}
      transfer={transfer}
      explanation={explanation}
      verification={verification}
      saved={saved}
      error={preview.error}
      language={language}
      onTopic={(topic) => {
        setSelected(topic);
        setInput(topic.input);
        setParameter(topic.parameter);
        reset();
      }}
      onInput={(value) => {
        setInput(value);
        reset();
      }}
      onParameter={(value) => {
        setParameter(value);
        reset();
      }}
      onPrediction={setPrediction}
      onRun={() => {
        if (preview.data) setResult(preview.data);
      }}
      onReset={reset}
      onStep={setStep}
      onTransfer={setTransfer}
      onExplanation={setExplanation}
      onVerify={verify}
    />
  );
}
// Export for isolated malformed/long-state rendering checks without a product route.
export { SimulationFrameView };
createRoot(document.getElementById("root")!).render(
  new URLSearchParams(location.search).get("scenario") === "states" ? (
    <StatesFixture />
  ) : (
    <Fixture />
  ),
);
