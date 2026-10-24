"use client";

import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  Play,
  RotateCcw,
} from "lucide-react";
import {
  type SimulationFrame,
  type SimulationResult,
  type SimulationTopic,
} from "@/lib/simulations";
import { Badge, Button, Feedback, PageHeading } from "./primitives";

export function SimulationFrameView({ frame }: { frame: SimulationFrame }) {
  const values = frame.cells.map((cell) => Number(cell.value));
  const numeric = values.every(Number.isFinite),
    signed = values.some((value) => value < 0);
  return (
    <div className="pf-frame-view">
      {frame.kind === "scatter" && frame.points ? (
        <ScatterView frame={frame} />
      ) : frame.kind === "bars" && numeric ? (
        <div
          className="pf-bars-scroll"
          tabIndex={0}
          role="region"
          aria-label={`${frame.title}, bar chart`}
        >
          <div
            className="pf-bars"
            style={{
              gridTemplateColumns: `repeat(${Math.max(1, values.length)}, minmax(48px,1fr))`,
            }}
          >
            {frame.cells.map((cell, index) => (
              <div
                key={index}
                className={`pf-bar pf-cell--${cell.tone ?? "normal"}`}
              >
                <strong>{cell.value}</strong>
                <div
                  className={`pf-bar-track ${signed ? "pf-bar-track--signed" : ""}`}
                >
                  <span
                    style={{
                      height: `${Math.max(1, (Math.abs(values[index]) / Math.max(1, ...values.map(Math.abs))) * (signed ? 50 : 100))}%`,
                      ...(signed
                        ? values[index] < 0
                          ? { top: "50%" }
                          : { bottom: "50%" }
                        : {}),
                    }}
                  />
                </div>
                <span>{cell.label}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div
          className={`pf-frame-cells pf-frame-cells--${frame.kind ?? "table"}`}
        >
          {frame.cells.map((cell, index) => (
            <div
              key={index}
              className={`pf-frame-cell pf-cell--${cell.tone ?? "normal"}`}
            >
              <span>{cell.label}</span>
              <strong>{cell.value}</strong>
            </div>
          ))}
        </div>
      )}
      {!frame.cells.length && frame.kind !== "scatter" && (
        <p className="pf-muted">The structure is empty at this step.</p>
      )}
      {frame.links?.length ? (
        <div className="pf-frame-links" aria-label="Connections">
          {frame.links.map((link, index) => (
            <span key={index}>
              {frame.cells[link.from]?.label ?? link.from}
              <ArrowRight size={14} />
              {frame.cells[link.to]?.label ?? link.to}
              {link.label ? ` (${link.label})` : ""}
            </span>
          ))}
        </div>
      ) : null}
      <details className="pf-frame-table">
        <summary>Inspect the computed state as a table</summary>
        <div className="pf-table-scroll">
          <table>
            <caption>{frame.title}</caption>
            <thead>
              <tr>
                <th scope="col">State</th>
                <th scope="col">Value</th>
              </tr>
            </thead>
            <tbody>
              {frame.cells.map((cell, index) => (
                <tr key={index}>
                  <th scope="row">{cell.label}</th>
                  <td>{cell.value}</td>
                </tr>
              ))}
              {frame.points?.map((point, index) => (
                <tr key={`point-${index}`}>
                  <th scope="row">
                    {point.group ?? "Point"} x={Number(point.x.toFixed(3))}
                  </th>
                  <td>{Number(point.y.toFixed(4))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
function ScatterView({ frame }: { frame: SimulationFrame }) {
  const points = frame.points ?? [],
    minX = Math.min(-1, ...points.map((point) => point.x)),
    maxX = Math.max(1, ...points.map((point) => point.x));
  const minY = Math.min(0, ...points.map((point) => point.y)),
    maxY = Math.max(1, ...points.map((point) => point.y));
  const x = (value: number) =>
    54 + ((value - minX) / Math.max(1e-9, maxX - minX)) * 550;
  const y = (value: number) =>
    245 - ((value - minY) / Math.max(1e-9, maxY - minY)) * 205;
  return (
    <>
      <div
        className="pf-scatter-scroll"
        tabIndex={0}
        role="region"
        aria-label="Computed training and validation chart"
      >
        <svg viewBox="0 0 660 290" role="img" aria-label={frame.title}>
          <title>
            {frame.title}. Circles are training points; squares are validation
            points; the line is the computed fit.
          </title>
          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
            const value = minY + fraction * (maxY - minY);
            return (
              <g key={fraction}>
                <line x1="54" x2="604" y1={y(value)} y2={y(value)} />
                <text x="44" y={y(value) + 5} textAnchor="end">
                  {value.toFixed(1)}
                </text>
              </g>
            );
          })}
          <line x1="54" x2="604" y1="245" y2="245" />
          {[minX, (minX + maxX) / 2, maxX].map((value) => (
            <text key={value} x={x(value)} y="275" textAnchor="middle">
              {value.toFixed(1)}
            </text>
          ))}
          <polyline
            className="pf-fit-line"
            fill="none"
            points={points
              .filter((point) => point.group === "curve")
              .map((point) => `${x(point.x)},${y(point.y)}`)
              .join(" ")}
          />
          {points
            .filter((point) => point.group !== "curve")
            .map((point, index) =>
              point.group === "validation" ? (
                <rect
                  className="pf-validation-point"
                  key={index}
                  x={x(point.x) - 5}
                  y={y(point.y) - 5}
                  width="10"
                  height="10"
                />
              ) : (
                <circle
                  className="pf-training-point"
                  key={index}
                  cx={x(point.x)}
                  cy={y(point.y)}
                  r="5"
                />
              ),
            )}
        </svg>
      </div>
      <div className="pf-chart-legend">
        <span>● Training</span>
        <span>■ Validation</span>
        <span>— Computed fit</span>
      </div>
      <div className="pf-frame-cells">
        {frame.cells.map((cell, index) => (
          <div className="pf-frame-cell" key={index}>
            <span>{cell.label}</span>
            <strong>{cell.value}</strong>
          </div>
        ))}
      </div>
    </>
  );
}

export type SimulationWorkbenchProps = {
  topics: SimulationTopic[];
  selected: SimulationTopic;
  input: string;
  parameter: number;
  prediction: string;
  result: SimulationResult | null;
  frameIndex: number;
  started: boolean;
  predictionCorrect: boolean;
  transfer: string;
  explanation: string;
  verification: "correct" | "incorrect" | null;
  saved: boolean;
  error?: string;
  language?: string;
  onTopic: (topic: SimulationTopic) => void;
  onInput: (value: string) => void;
  onParameter: (value: number) => void;
  onPrediction: (value: string) => void;
  onRun: () => void;
  onReset: () => void;
  onStep: (value: number) => void;
  onTransfer: (value: string) => void;
  onExplanation: (value: string) => void;
  onVerify: () => void;
};
/** The owning controller retains runSimulation, answersMatch and evidence emission. */
export function SimulationWorkbench({
  topics,
  selected,
  input,
  parameter,
  prediction,
  result,
  frameIndex,
  started,
  predictionCorrect,
  transfer,
  explanation,
  verification,
  saved,
  error,
  language = "en",
  onTopic,
  onInput,
  onParameter,
  onPrediction,
  onRun,
  onReset,
  onStep,
  onTransfer,
  onExplanation,
  onVerify,
}: SimulationWorkbenchProps) {
  const frame = result?.frames[frameIndex],
    hi = language === "hi";
  return (
    <>
      <PageHeading
        label="Practice / Simulation Lab"
        title={
          hi
            ? "विचार को प्रयोग में देखें।"
            : "Turn a concept into an experiment."
        }
        description={
          hi
            ? "अनुमान लगाएँ, चलाएँ, और बदली स्थिति में फिर जाँचें।"
            : "Predict an outcome. Inspect each state change. Test your understanding again."
        }
      />
      <div className="pf-lab-layout">
        <section
          className="pf-panel pf-lab-controls"
          aria-label="Experiment controls"
        >
          <h2>
            <FlaskConical size={19} />
            Your experiment
          </h2>
          <label className="pf-field">
            Concept
            <select
              className="pf-input"
              value={selected.id}
              onChange={(event) => {
                const topic = topics.find(
                  (item) => item.id === event.target.value,
                );
                if (topic) onTopic(topic);
              }}
            >
              {[...new Set(topics.map((topic) => topic.category))].map(
                (category) => (
                  <optgroup label={category} key={category}>
                    {topics
                      .filter((topic) => topic.category === category)
                      .map((topic) => (
                        <option key={topic.id} value={topic.id}>
                          {topic.name}
                        </option>
                      ))}
                  </optgroup>
                ),
              )}
            </select>
          </label>
          <p>{selected.description}</p>
          <label className="pf-field">
            {selected.inputLabel}
            <textarea
              className="pf-input"
              value={input}
              rows={3}
              spellCheck={false}
              onChange={(event) => onInput(event.target.value)}
            />
            <small>{selected.inputHelp}</small>
          </label>
          <label className="pf-field">
            {selected.parameterLabel}
            <span className="pf-parameter">
              <input
                type="range"
                min={selected.min}
                max={selected.max}
                value={parameter}
                onChange={(event) => onParameter(Number(event.target.value))}
              />
              <output>{parameter}</output>
            </span>
          </label>
          <label className="pf-field">
            Predict before you run
            <small>
              {result?.metric ??
                "Enter valid input to see the outcome to predict."}
            </small>
            <input
              className="pf-input"
              value={prediction}
              disabled={started}
              placeholder="Your predicted outcome"
              onChange={(event) => onPrediction(event.target.value)}
            />
          </label>
          <Button
            variant="primary"
            disabled={started || !result || !prediction.trim()}
            onClick={onRun}
          >
            <Play size={16} />
            Run simulation
          </Button>
          <Button variant="quiet" onClick={onReset}>
            <RotateCcw size={16} />
            Reset experiment
          </Button>
          {error && (
            <Feedback title="Check the experiment input" tone="danger">
              {error}
            </Feedback>
          )}
        </section>
        <div className="pf-lab-output">
          <section className="pf-panel pf-lab-instrument">
            <div className="pf-row">
              <div>
                <p className="pf-eyebrow">{selected.category}</p>
                <h2>{selected.name}</h2>
              </div>
              <Badge>{started ? "Computed run" : "Initial state"}</Badge>
            </div>
            <p className="pf-lab-model">{selected.model}</p>
            {frame ? (
              <>
                <div className="pf-frame-heading">
                  <span>
                    Step {frameIndex + 1} of {result!.frames.length}
                  </span>
                  <h3>{frame.title}</h3>
                  <p>{frame.note}</p>
                </div>
                <SimulationFrameView frame={frame} />
                <div className="pf-frame-navigation">
                  <Button
                    aria-label="Previous simulation step"
                    disabled={frameIndex <= 0 || !started}
                    onClick={() => onStep(frameIndex - 1)}
                  >
                    <ChevronLeft size={17} />
                    Previous
                  </Button>
                  <input
                    type="range"
                    aria-label="Simulation step"
                    min={0}
                    max={result!.frames.length - 1}
                    value={frameIndex}
                    disabled={!started}
                    onChange={(event) => onStep(Number(event.target.value))}
                  />
                  <Button
                    disabled={
                      frameIndex >= result!.frames.length - 1 || !started
                    }
                    onClick={() => onStep(frameIndex + 1)}
                  >
                    Next
                    <ChevronRight size={17} />
                  </Button>
                </div>
              </>
            ) : (
              <div className="pf-empty">
                <FlaskConical size={32} />
                <p>Choose valid inputs to see the initial model state.</p>
              </div>
            )}
          </section>
          {started && result && (
            <section
              className="pf-panel pf-transfer-check"
              aria-label="Fresh understanding check"
            >
              <h2>Try a fresh understanding check</h2>
              <Feedback
                title={
                  predictionCorrect
                    ? "Your original prediction matched."
                    : "Your original prediction did not match."
                }
                tone={predictionCorrect ? "success" : "warning"}
              >
                {result.metric}: {result.answer}.{" "}
                {predictionCorrect
                  ? "Now reason about a changed parameter."
                  : "Review the state changes, then reset for a new prediction before another run."}
              </Feedback>
              <label className="pf-field">
                {result.check.question}
                <input
                  className="pf-input"
                  value={transfer}
                  onChange={(event) => onTransfer(event.target.value)}
                  disabled={verification !== null}
                  placeholder="Your prediction for the changed input"
                />
              </label>
              <label className="pf-field">
                Explain what changed
                <textarea
                  className="pf-input"
                  rows={3}
                  value={explanation}
                  onChange={(event) => onExplanation(event.target.value)}
                  disabled={verification !== null}
                />
                <small>
                  The explanation is saved but ungraded. The two predictions are
                  checked against computed outcomes.
                </small>
              </label>
              <Button
                variant="primary"
                disabled={
                  verification !== null ||
                  !transfer.trim() ||
                  explanation.trim().length < 12
                }
                onClick={onVerify}
              >
                <Check size={16} />
                Check my understanding
              </Button>
              {verification && (
                <Feedback
                  title={
                    saved
                      ? "Both prediction checks passed."
                      : "Keep practicing this model."
                  }
                  tone={saved ? "success" : "warning"}
                >
                  {saved
                    ? "Your controller can record this bounded simulation evidence. This does not certify broader mastery."
                    : "A correct transfer answer alone does not replace the original prediction. Reset and try both checks again."}
                </Feedback>
              )}
            </section>
          )}
        </div>
      </div>
    </>
  );
}
