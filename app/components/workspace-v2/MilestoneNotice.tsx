"use client";
import { ArrowRight, CheckCircle2, X } from "lucide-react";
import type { LearningEvent } from "@/lib/learning-events";
import { Button } from "./primitives";

/** Consume only a committed core event. No reward ledger or XP increment lives here. */
export function MilestoneNotice({
  event,
  nextTitle,
  onContinue,
  onDismiss,
}: {
  event: Extract<LearningEvent, { type: "task.checks.passed" }>;
  nextTitle?: string;
  onContinue: () => void;
  onDismiss: () => void;
}) {
  const title =
    event.scope === "bounded-knowledge-check"
      ? "Knowledge checkpoint passed"
      : event.assisted
        ? "Task checks passed with assistance"
        : "Task checks passed";
  return (
    <section
      className="pf-milestone-notice"
      role="status"
      aria-label="Learning check result"
    >
      <CheckCircle2 size={24} />
      <div>
        <strong>{title}</strong>
        <p>
          {event.checksPassed} of {event.checksTotal} checks passed.{" "}
          {nextTitle ? `Next: ${nextTitle}` : "Your evidence is recorded."}
        </p>
      </div>
      <Button onClick={onContinue}>
        Continue
        <ArrowRight size={16} />
      </Button>
      <Button
        variant="quiet"
        aria-label="Dismiss learning result"
        onClick={onDismiss}
      >
        <X size={18} />
      </Button>
    </section>
  );
}
