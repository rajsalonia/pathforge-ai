"use client";
import { type ReactNode } from "react";
import { Send } from "lucide-react";
import { Button, Feedback } from "./primitives";

export function LearningCompanion({
  question,
  messages,
  busy,
  error,
  onQuestion,
  onSend,
  speechControls,
}: {
  question: string;
  messages: { role: string; text: string }[];
  busy: boolean;
  error?: string;
  onQuestion: (value: string) => void;
  onSend: () => void;
  speechControls?: ReactNode;
}) {
  return (
    <section
      className="pf-panel pf-tutor"
      aria-label="Contextual learning help"
    >
      <h2>Help with this mission</h2>
      <p>
        Ask about a concept or an error. Your own checks still establish the
        result.
      </p>
      {messages.length ? (
        <div className="pf-chat-history" aria-label="Learning conversation">
          {messages.map((message, index) => (
            <article key={index}>
              <strong>
                {message.role === "learner" ? "You" : "PathForge"}
              </strong>
              <p>{message.text}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="pf-tutor-suggestions">
          <Button
            variant="quiet"
            onClick={() => onQuestion("Explain this with a simple example.")}
          >
            Explain with an example
          </Button>
          <Button
            variant="quiet"
            onClick={() =>
              onQuestion("Help me understand the first failing test.")
            }
          >
            Understand a failing test
          </Button>
        </div>
      )}
      {error && (
        <Feedback title="AI help is unavailable" tone="warning">
          {error}
        </Feedback>
      )}
      <form
        className="pf-stack"
        onSubmit={(event) => {
          event.preventDefault();
          if (question.trim()) onSend();
        }}
      >
        <label className="pf-field">
          Your question
          <textarea
            className="pf-input"
            rows={3}
            value={question}
            onChange={(event) => onQuestion(event.target.value)}
            placeholder="What part is unclear?"
          />
        </label>
        <Button type="submit" disabled={!question.trim()} busy={busy}>
          <Send size={16} />
          Ask for help
        </Button>
      </form>
      {speechControls}
      <small>
        AI needs a configured provider and explicit consent. Your request is
        sent only when you ask.
      </small>
    </section>
  );
}
export function SkillBridgeView({
  known,
  result,
  busy,
  error,
  onKnown,
  onAnalyze,
}: {
  known: string;
  result: string;
  busy: boolean;
  error?: string;
  onKnown: (value: string) => void;
  onAnalyze: () => void;
}) {
  return (
    <section className="pf-panel pf-bridge">
      <h2>Connect what you already know</h2>
      <p>
        Describe a familiar skill. A comparison can suggest where to start; only
        an independent task check can support skipping lessons.
      </p>
      <label className="pf-field">
        Your existing experience
        <textarea
          className="pf-input"
          rows={3}
          value={known}
          onChange={(event) => onKnown(event.target.value)}
        />
      </label>
      <Button disabled={!known.trim()} busy={busy} onClick={onAnalyze}>
        Find connections
      </Button>
      {error && (
        <Feedback title="The comparison could not be generated" tone="warning">
          {error}
        </Feedback>
      )}
      {result && (
        <div className="pf-ai-advice">
          <h3>Advisory comparison</h3>
          <p>{result}</p>
          <small>Self-report and AI feedback do not verify a skill.</small>
        </div>
      )}
    </section>
  );
}
