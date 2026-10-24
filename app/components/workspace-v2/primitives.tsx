"use client";

import {
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type ReactNode,
  type KeyboardEvent,
} from "react";
import { AlertCircle, CheckCircle2, Info, LoaderCircle, X } from "lucide-react";

export type Tone = "neutral" | "accent" | "success" | "warning" | "danger";
export function Button({
  variant = "secondary",
  busy = false,
  className = "",
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "quiet";
  busy?: boolean;
}) {
  return (
    <button
      type="button"
      title={props.title ?? props["aria-label"]}
      {...props}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={`pf-button pf-button--${variant} ${className}`}
    >
      {busy && (
        <LoaderCircle size={17} className="pf-spinner" aria-hidden="true" />
      )}
      {children}
    </button>
  );
}
export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return <span className={`pf-badge pf-badge--${tone}`}>{children}</span>;
}
export function PageHeading({
  label,
  title,
  description,
  action,
}: {
  label?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="pf-page-heading">
      <div>
        {label && <p className="pf-eyebrow">{label}</p>}
        <h1>{title}</h1>
        {description && <p className="pf-description">{description}</p>}
      </div>
      {action}
    </header>
  );
}
export function Progress({
  value,
  max,
  label,
}: {
  value: number;
  max: number;
  label: string;
}) {
  const percent = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div
      className="pf-progress"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percent)}
      aria-valuetext={`${value} of ${max}`}
    >
      <span style={{ width: `${percent}%` }} />
    </div>
  );
}
export function Feedback({
  title,
  children,
  tone = "neutral",
}: {
  title: string;
  children?: ReactNode;
  tone?: Tone;
}) {
  const Icon =
    tone === "success"
      ? CheckCircle2
      : tone === "danger" || tone === "warning"
        ? AlertCircle
        : Info;
  return (
    <div
      className={`pf-feedback pf-feedback--${tone}`}
      role={tone === "danger" ? "alert" : "status"}
    >
      <Icon size={20} aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        {children && <div>{children}</div>}
      </div>
    </div>
  );
}
export function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="pf-empty">
      <div className="pf-empty-icon" aria-hidden="true">
        {icon}
      </div>
      <h2>{title}</h2>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function Tabs({
  label,
  tabs,
  value,
  onChange,
}: {
  label: string;
  tabs: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  // These switch complete destinations; ordinary links/buttons avoid fake ARIA tabpanels.
  return (
    <nav className="pf-tabs" aria-label={label}>
      {tabs.map((tab) => (
        <button
          type="button"
          key={tab.value}
          aria-current={value === tab.value ? "page" : undefined}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
export function trapDialogFocus(event: KeyboardEvent<HTMLDialogElement>) {
  if (event.key !== "Tab") return;
  const elements = [
    ...event.currentTarget.querySelectorAll<HTMLElement>(
      'button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),summary,[tabindex]:not([tabindex="-1"])',
    ),
  ].filter((element) => element.getClientRects().length > 0);
  const first = elements[0],
    last = elements[elements.length - 1];
  if (!first) {
    event.preventDefault();
    event.currentTarget.focus();
    return;
  }
  if (
    event.shiftKey &&
    (document.activeElement === first ||
      document.activeElement === event.currentTarget)
  ) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
export function Dialog({
  open,
  onClose,
  title,
  children,
  busy = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  busy?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const element = ref.current;
    if (open && !element?.open) {
      trigger.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      element?.showModal();
    } else if (!open && element?.open) element.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      tabIndex={-1}
      onKeyDown={trapDialogFocus}
      onClose={() => {
        const target = trigger.current?.isConnected
          ? trigger.current
          : document.getElementById("pf-main-content");
        target?.focus({ preventScroll: true });
      }}
      className="pf-dialog pf-workspace"
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div className="pf-dialog-body">
        <header>
          <h2>{title}</h2>
          <Button
            disabled={busy}
            variant="quiet"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={20} />
          </Button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
export function Skeleton({
  label = "Loading your workspace",
}: {
  label?: string;
}) {
  return (
    <div className="pf-skeleton" role="status">
      <span className="pf-sr-only">{label}</span>
      <div />
      <div />
      <div />
    </div>
  );
}
