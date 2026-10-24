"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { curatedRoadmap } from "@/lib/learning";
import { Button, Dialog, Feedback } from "./primitives";

export function GoalDialog({
  open,
  goal,
  level,
  minutes,
  language,
  busy,
  error,
  aiAvailability,
  onGoal,
  onLevel,
  onMinutes,
  onLanguage,
  onCreate,
  onClose,
}: {
  open: boolean;
  goal: string;
  level: string;
  minutes: number;
  language: string;
  busy: boolean;
  error?: string;
  aiAvailability:
    | "available"
    | "sign-in-required"
    | "not-configured"
    | "unknown";
  onGoal: (value: string) => void;
  onLevel: (value: string) => void;
  onMinutes: (value: number) => void;
  onLanguage: (value: string) => void;
  onCreate: (useAI: boolean) => void;
  onClose: () => void;
}) {
  const preview = goal.trim().length >= 3 ? curatedRoadmap(goal, level) : null;
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={
        language === "hi" ? "अपनी सीखने की राह बनाएँ" : "Make this path yours"
      }
      busy={busy}
    >
      <div className="pf-stack">
        <p className="pf-muted">
          A goal and a little context are enough to find your first step.
        </p>
        <label className="pf-field">
          Learning goal
          <input
            disabled={busy}
            autoFocus
            className="pf-input"
            value={goal}
            maxLength={200}
            onChange={(event) => onGoal(event.target.value)}
          />
        </label>
        <fieldset disabled={busy} className="pf-level-field">
          <legend>Where are you starting?</legend>
          <div>
            {[
              {
                value: "beginner",
                label: "Beginner",
                description: "Start from zero",
              },
              {
                value: "intermediate",
                label: "Some experience",
                description: "Practice the basics",
              },
              {
                value: "diagnostic",
                label: "Check my starting point",
                description: "Optional first check",
              },
            ].map((option) => (
              <label key={option.value}>
                <input
                  type="radio"
                  name="pf-start-level"
                  value={option.value}
                  checked={level === option.value}
                  onChange={() => onLevel(option.value)}
                />
                <span>
                  <strong>{option.label}</strong>
                  <small>{option.description}</small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="pf-form-columns">
          <label className="pf-field">
            Session length
            <select
              disabled={busy}
              className="pf-input"
              value={minutes}
              onChange={(event) => onMinutes(Number(event.target.value))}
            >
              {[2, 5, 10, 20, 30].map((value) => (
                <option value={value} key={value}>
                  {value} minutes
                </option>
              ))}
            </select>
          </label>
          <label className="pf-field">
            Language
            <select
              disabled={busy}
              className="pf-input"
              value={language}
              onChange={(event) => onLanguage(event.target.value)}
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
            </select>
          </label>
        </div>
        {preview && (
          <details className="pf-scope-preview">
            <summary>What the guided path covers: {preview.title}</summary>
            <p>{preview.description}</p>
          </details>
        )}
        {error && (
          <Feedback title="Your path could not be created" tone="danger">
            {error}
          </Feedback>
        )}
        <Button
          variant="primary"
          busy={busy}
          disabled={goal.trim().length < 3}
          onClick={() => onCreate(false)}
        >
          Create my learning path
          <ArrowRight size={16} />
        </Button>
        <Button
          busy={busy}
          disabled={
            goal.trim().length < 3 ||
            aiAvailability === "not-configured" ||
            aiAvailability === "sign-in-required"
          }
          onClick={() => onCreate(true)}
        >
          <Sparkles size={16} />
          Generate a personalized AI path
        </Button>
        <small className="pf-muted">
          {aiAvailability === "not-configured"
            ? "Live AI is not configured. Guided paths work without a provider."
            : aiAvailability === "sign-in-required"
              ? "Sign in to request a personalized AI path. Guided paths work as a guest."
              : "AI requires a configured provider and explicit consent before sending your request."}{" "}
          Self-reported experience never verifies a skill.
        </small>
      </div>
    </Dialog>
  );
}
