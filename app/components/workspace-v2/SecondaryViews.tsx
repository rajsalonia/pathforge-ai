"use client";
import { useState, type ReactNode } from "react";
import {
  ArrowRight,
  Check,
  Copy,
  Download,
  FolderKanban,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import type { Learner } from "@/lib/learning";
import { Badge, Button, EmptyState, Feedback, PageHeading } from "./primitives";

export function ProjectsView({
  state,
  onMission,
  onDownload,
  timer,
  onAddExpense,
  onDeleteExpense,
}: {
  state: Learner;
  onMission: (id: string) => void;
  onDownload: () => void;
  timer: ReactNode;
  onAddExpense: (label: string, amount: number) => void;
  onDeleteExpense: (id: string) => void;
}) {
  const [label, setLabel] = useState(""),
    [amount, setAmount] = useState("");
  const grown = state.projects.features.includes("focus");
  return (
    <>
      <PageHeading
        label="Projects"
        title="Build something that works."
        description="A provided scaffold, a concrete feature, and evidence of your contribution."
      />
      <div className="pf-project-layout">
        <section className="pf-panel pf-project-artifact">
          <div className="pf-row">
            <FolderKanban size={22} />
            <Badge tone={grown ? "success" : "neutral"}>
              {grown ? "Feature check passed" : "Starter scaffold"}
            </Badge>
          </div>
          <h2>My Focus Garden</h2>
          <p>
            A focus-session timer. Build and test its start, pause, tick, and
            reset behavior.
          </p>
          {grown ? (
            timer
          ) : (
            <div className="pf-timer-preview">
              <span>25:00</span>
              <p>
                The starter display is ready. Your checked state engine unlocks
                the working preview.
              </p>
            </div>
          )}
        </section>
        <section className="pf-project-next">
          <p className="pf-eyebrow">Next build milestone</p>
          <h2>
            {grown
              ? "A functional timer state engine"
              : "Make the timer state work"}
          </h2>
          <p>
            Implement the state transitions and run the fixed cases. The
            scaffold stays attributed separately from your checked function.
          </p>
          <Button variant="primary" onClick={() => onMission("build-focus")}>
            {grown ? "Revisit feature mission" : "Continue Building"}
            <ArrowRight size={16} />
          </Button>
          <div className="pf-project-feature">
            <Check size={17} />
            <span>
              {grown
                ? "Start, pause, tick, and reset checks recorded."
                : "Feature verification pending."}
            </span>
          </div>
          <Button disabled={!grown} onClick={onDownload}>
            <Download size={16} />
            Download working project
          </Button>
        </section>
      </div>
      <section className="pf-project-notebook">
        <h2>Project notebook</h2>
        <p>
          Practice persisted data with an expense list. This notebook does not
          award mastery.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const value = Number(amount);
            if (!label.trim() || !Number.isFinite(value) || value <= 0) return;
            onAddExpense(label.trim(), value);
            setLabel("");
            setAmount("");
          }}
        >
          <label className="pf-field">
            Expense label
            <input
              className="pf-input"
              value={label}
              maxLength={80}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Notebook, hosting, materials…"
            />
          </label>
          <label className="pf-field">
            Amount
            <input
              className="pf-input"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </label>
          <Button type="submit">
            <Plus size={16} />
            Add expense
          </Button>
        </form>
        {state.projects.expenses.map((expense) => (
          <div className="pf-expense-row" key={expense.id}>
            <span>{expense.label}</span>
            <strong>{expense.amount.toFixed(2)}</strong>
            <Button
              variant="quiet"
              aria-label={`Delete ${expense.label}`}
              onClick={() => onDeleteExpense(expense.id)}
            >
              <X size={16} />
            </Button>
          </div>
        ))}
        <div className="pf-expense-total">
          Total
          <strong>
            {state.projects.expenses
              .reduce((sum, expense) => sum + expense.amount, 0)
              .toFixed(2)}
          </strong>
        </div>
      </section>
    </>
  );
}
export type CollaborationRoomView = {
  code: string;
  members: {
    userId: string;
    role: string;
    name?: string;
    displayName?: string;
  }[];
  complete: boolean;
};
export function CollaborationView({
  authenticated,
  room,
  code,
  role,
  contribution,
  busy,
  error,
  onCode,
  onRole,
  onContribution,
  onAction,
  onCopy,
  artifact,
}: {
  authenticated: boolean;
  room: CollaborationRoomView | null;
  code: string;
  role: string;
  contribution: string;
  busy: boolean;
  error?: string;
  onCode: (value: string) => void;
  onRole: (value: string) => void;
  onContribution: (value: string) => void;
  onAction: (
    action: "create" | "join" | "contribute" | "refresh" | "leave",
  ) => void;
  onCopy: () => void;
  artifact: ReactNode;
}) {
  return (
    <>
      <PageHeading
        label="Learn together"
        title="Two responsibilities. One useful artifact."
        description="Create a private room, contribute your part, and keep attribution clear."
      />
      <div className="pf-collaboration-layout">
        <section className="pf-panel pf-stack">
          <h2>Build a learning club form</h2>
          <p className="pf-muted">
            One learner defines the structure; the other defines validation. The
            server checks membership and each assigned contribution.
          </p>
          {!authenticated && (
            <Feedback title="Sign in to collaborate">
              <a href="/signin-with-chatgpt?return_to=/" target="_top">
                Sign in to create or join a private room.
              </a>
            </Feedback>
          )}
          {error && (
            <Feedback title="The room could not be updated" tone="danger">
              {error}
            </Feedback>
          )}
          {!room ? (
            <>
              <label className="pf-field">
                Your responsibility
                <select
                  className="pf-input"
                  value={role}
                  onChange={(event) => onRole(event.target.value)}
                >
                  <option value="structure">Page structure</option>
                  <option value="behavior">Form behavior</option>
                </select>
              </label>
              <Button
                variant="primary"
                disabled={!authenticated}
                busy={busy}
                onClick={() => onAction("create")}
              >
                <Plus size={16} />
                Create a private room
              </Button>
              <label className="pf-field">
                Have an invitation?
                <input
                  className="pf-input"
                  value={code}
                  onChange={(event) => onCode(event.target.value)}
                  placeholder="Private invitation code"
                />
              </label>
              <Button
                disabled={!authenticated || !code.trim()}
                busy={busy}
                onClick={() => onAction("join")}
              >
                Join room
                <ArrowRight size={16} />
              </Button>
            </>
          ) : (
            <>
              <div className="pf-room-invite">
                <span>Private invitation</span>
                <strong>{room.code}</strong>
                <Button onClick={onCopy}>
                  <Copy size={16} />
                  Copy code
                </Button>
              </div>
              <div className="pf-row">
                <Badge>{room.members.length} of 2 partners joined</Badge>
                <Button
                  variant="quiet"
                  disabled={busy}
                  onClick={() => onAction("refresh")}
                >
                  <RefreshCw size={16} />
                  Refresh
                </Button>
              </div>
              {room.members.map((member) => (
                <div className="pf-room-member" key={member.userId}>
                  <Users size={18} />
                  <div>
                    <strong>
                      {member.name ?? member.displayName ?? "Learning partner"}
                    </strong>
                    <p>
                      {member.role === "structure"
                        ? "Page structure"
                        : "Form behavior"}
                    </p>
                  </div>
                </div>
              ))}
              <label className="pf-field">
                Your declarative contribution
                <textarea
                  className="pf-input pf-contribution"
                  value={contribution}
                  rows={6}
                  onChange={(event) => onContribution(event.target.value)}
                  spellCheck={false}
                />
              </label>
              <small className="pf-muted">
                Structure: title and name/email fields. Behavior: required
                fields and email validation. Your assigned role controls what
                the server accepts.
              </small>
              <Button
                variant="primary"
                busy={busy}
                onClick={() => onAction("contribute")}
              >
                <Check size={16} />
                Check & contribute
              </Button>
              <Button
                variant="quiet"
                disabled={busy}
                onClick={() => onAction("leave")}
              >
                Leave room
              </Button>
            </>
          )}
        </section>
        <section
          className="pf-panel pf-joint-artifact"
          aria-label="Shared artifact"
        >
          {room?.complete ? (
            artifact
          ) : (
            <EmptyState
              icon={<Users size={32} />}
              title="The shared form appears here."
            >
              Two distinct learners must submit complementary checked
              contributions. No partner activity is simulated.
            </EmptyState>
          )}
        </section>
      </div>
    </>
  );
}
export function SettingsView({
  state,
  onUpdate,
  sync,
  authenticated,
  ready,
  hasBackup,
  onExport,
  onImport,
  onBackup,
  onReload,
  onDelete,
}: {
  state: Learner;
  onUpdate: (patch: Partial<Learner>) => void;
  sync: string;
  authenticated: boolean;
  ready: boolean;
  hasBackup: boolean;
  onExport: () => void;
  onImport: () => void;
  onBackup: () => void;
  onReload: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <PageHeading
        label="Settings & data"
        title="Make this workspace yours."
        description="Your language, your pace, and control over your learning record."
      />
      <div className="pf-settings-layout">
        <section className="pf-panel pf-stack">
          <h2>Learning preferences</h2>
          <label className="pf-field">
            Display name
            <input
              className="pf-input"
              value={state.name}
              maxLength={40}
              onChange={(event) =>
                onUpdate({ name: event.target.value || "Explorer" })
              }
            />
          </label>
          <label className="pf-field">
            Language
            <select
              className="pf-input"
              value={state.language}
              onChange={(event) => onUpdate({ language: event.target.value })}
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी · Hindi</option>
            </select>
          </label>
          <label className="pf-setting-toggle">
            <span>
              <strong>Larger text</strong>
              <small>More room for reading and controls.</small>
            </span>
            <input
              type="checkbox"
              checked={state.preferences.largeText}
              onChange={(event) =>
                onUpdate({
                  preferences: {
                    ...state.preferences,
                    largeText: event.target.checked,
                  },
                })
              }
            />
          </label>
          <label className="pf-setting-toggle">
            <span>
              <strong>Reduced motion</strong>
              <small>Keep transitions quiet.</small>
            </span>
            <input
              type="checkbox"
              checked={state.preferences.reducedMotion}
              onChange={(event) =>
                onUpdate({
                  preferences: {
                    ...state.preferences,
                    reducedMotion: event.target.checked,
                  },
                })
              }
            />
          </label>
          <small className="pf-muted">
            Language changes preserve the same evidence. Some technical
            reference details remain in English.
          </small>
        </section>
        <section className="pf-panel pf-stack">
          <h2>Your progress belongs to you.</h2>
          <p className="pf-muted" role="status">
            {sync}
          </p>
          {!authenticated && (
            <a
              className="pf-button pf-button--primary"
              href="/signin-with-chatgpt?return_to=/"
              target="_top"
            >
              Sign in & save across devices
              <ArrowRight size={16} />
            </a>
          )}
          <Button disabled={!ready} onClick={onExport}>
            <Download size={16} />
            Export workspace
          </Button>
          <Button disabled={!ready} onClick={onImport}>
            <Upload size={16} />
            Import saved progress
          </Button>
          {hasBackup && (
            <Button onClick={onBackup}>
              <Download size={16} />
              Download device backup
            </Button>
          )}
          {authenticated && (
            <Button disabled={!ready} onClick={onReload}>
              <RefreshCw size={16} />
              Reload cloud copy
            </Button>
          )}
          <p className="pf-settings-privacy">
            Guest work stays in the browser. Signed-in work uses the existing
            account sync. AI receives only the request context you explicitly
            approve.
          </p>
          <Button
            className="pf-danger-button"
            disabled={!ready}
            onClick={onDelete}
          >
            <Trash2 size={16} />
            Delete my learning data
          </Button>
          {authenticated && (
            <a href="/signout-with-chatgpt?return_to=/" target="_top">
              Sign out
            </a>
          )}
        </section>
      </div>
      <Feedback title="A scoped record, with clear limits">
        <ShieldCheck size={16} />
        AI feedback is advisory. Browser tests record task performance, not
        identity or authorship. Import, export, deletion, and cloud conflict
        handling remain with the existing controller.
      </Feedback>
    </>
  );
}
