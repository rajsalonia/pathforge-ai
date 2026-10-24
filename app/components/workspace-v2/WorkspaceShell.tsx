"use client";

import { useRef, useState, type ReactNode } from "react";
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  Code2,
  Compass,
  FolderKanban,
  GitBranch,
  Home,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { missions } from "@/lib/missions";
import { Button, trapDialogFocus } from "./primitives";
import "./styles/index.css";

export type WorkspaceView =
  | "home"
  | "roadmap"
  | "missions"
  | "mission"
  | "lab"
  | "projects"
  | "dna"
  | "portfolio"
  | "together"
  | "explore"
  | "settings";
export const primaryNavigation = [
  { id: "home", label: "Home", hi: "होम", icon: Home },
  { id: "roadmap", label: "My Learning", hi: "मेरी सीख", icon: BookOpen },
  { id: "missions", label: "Practice", hi: "अभ्यास", icon: Code2 },
  { id: "projects", label: "Projects", hi: "प्रोजेक्ट", icon: FolderKanban },
  { id: "dna", label: "Progress", hi: "प्रगति", icon: ShieldCheck },
] as const;
const secondaryNavigation = [
  {
    id: "explore",
    label: "Explore paths",
    hi: "सीखने की राहें",
    icon: Compass,
  },
  { id: "together", label: "Learn together", hi: "साथ सीखें", icon: Users },
  {
    id: "settings",
    label: "Settings & data",
    hi: "सेटिंग और डेटा",
    icon: Settings,
  },
] as const;
const viewTitles: Record<WorkspaceView, string> = {
  home: "Home",
  roadmap: "My Learning",
  missions: "Practice",
  mission: "Mission workspace",
  lab: "Simulation Lab",
  projects: "Projects",
  dna: "Progress",
  portfolio: "Evidence portfolio",
  together: "Learn together",
  explore: "Explore paths",
  settings: "Settings & data",
};

export function WorkspaceShell({
  view,
  onNavigate,
  onMission,
  language = "en",
  onLanguage,
  name,
  accountLabel,
  sync,
  children,
  largeText = false,
  reducedMotion = false,
}: {
  view: WorkspaceView;
  onNavigate: (view: WorkspaceView) => void;
  onMission: (id: string) => void;
  language?: string;
  onLanguage: () => void;
  name: string;
  accountLabel: string;
  sync: string;
  children: ReactNode;
  largeText?: boolean;
  reducedMotion?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawer = useRef<HTMLDialogElement>(null),
    main = useRef<HTMLElement>(null),
    menu = useRef<HTMLButtonElement>(null);
  const hi = language === "hi";
  const primary =
    view === "lab" || view === "mission"
      ? "missions"
      : view === "portfolio"
        ? "dna"
        : view;
  const matches = query.trim()
    ? missions
        .filter((mission) =>
          `${mission.title} ${mission.titleHi} ${mission.skill}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
        )
        .slice(0, 8)
    : [];
  function closeDrawer() {
    drawer.current?.close();
    setMobileOpen(false);
  }
  function navigate(destination: WorkspaceView) {
    closeDrawer();
    setQuery("");
    onNavigate(destination);
    requestAnimationFrame(() => main.current?.focus());
  }
  function openMission(id: string) {
    closeDrawer();
    setQuery("");
    onMission(id);
    requestAnimationFrame(() => main.current?.focus());
  }
  const navigation = (
    <>
      <button
        type="button"
        className="pf-brand"
        onClick={() => navigate("home")}
        aria-label="PathForge AI home"
      >
        <span className="pf-brand-mark">
          <GitBranch size={22} />
        </span>
        <span className="pf-brand-wordmark">
          PathForge <span className="pf-brand-tag">AI</span>
        </span>
      </button>
      <div className="pf-workspace-label">
        <span className="pf-account-dot" />
        Personal workspace
      </div>
      <nav
        aria-label={hi ? "मुख्य नेविगेशन" : "Primary navigation"}
        className="pf-nav"
      >
        {primaryNavigation.map(({ id, label, hi: translated, icon: Icon }) => (
          <button
            type="button"
            key={id}
            aria-current={primary === id ? "page" : undefined}
            onClick={() => navigate(id)}
          >
            <Icon size={19} />
            <span>{hi ? translated : label}</span>
            {primary === id && <span className="pf-nav-indicator" />}
          </button>
        ))}
      </nav>
      <div className="pf-sidebar-secondary">
        <p className="pf-eyebrow">
          {hi ? "और विकल्प" : "More from your workspace"}
        </p>
        <nav aria-label="More workspace destinations" className="pf-nav">
          {secondaryNavigation.map(
            ({ id, label, hi: translated, icon: Icon }) => (
              <button
                type="button"
                key={id}
                aria-current={view === id ? "page" : undefined}
                onClick={() => navigate(id)}
              >
                <Icon size={18} />
                <span>{hi ? translated : label}</span>
              </button>
            ),
          )}
        </nav>
      </div>
      <div className="pf-account">
        <span className="pf-avatar" aria-hidden="true">
          {Array.from(name || "Learner")[0]}
        </span>
        <div>
          <strong>{name || "Learner"}</strong>
          <small>{accountLabel}</small>
        </div>
        <button
          type="button"
          aria-label="Account settings"
          onClick={() => navigate("settings")}
        >
          <Settings size={18} />
        </button>
      </div>
    </>
  );
  return (
    <div
      className="pf-workspace pf-shell"
      lang={language}
      data-large-text={largeText}
      data-reduced-motion={reducedMotion}
    >
      <a href="#pf-main-content" className="pf-skip">
        Skip to learning content
      </a>
      <aside className="pf-sidebar">{navigation}</aside>
      <dialog
        ref={drawer}
        tabIndex={-1}
        onKeyDown={trapDialogFocus}
        className="pf-drawer pf-workspace"
        aria-label="Workspace navigation"
        onCancel={() => {
          setMobileOpen(false);
        }}
        onClose={() => {
          setMobileOpen(false);
          menu.current?.focus();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeDrawer();
        }}
      >
        <div className="pf-drawer-content">
          <Button
            variant="quiet"
            className="pf-close-drawer"
            aria-label="Close navigation"
            onClick={closeDrawer}
          >
            <X size={20} />
          </Button>
          {navigation}
        </div>
      </dialog>
      <div className="pf-main-shell">
        <header className="pf-topbar">
          <div className="pf-breadcrumb">
            <button
              ref={menu}
              type="button"
              className="pf-menu-toggle"
              aria-label="Open navigation"
              aria-expanded={mobileOpen}
              onClick={() => {
                drawer.current?.showModal();
                setMobileOpen(true);
              }}
            >
              <Menu size={21} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>
              {hi
                ? (primaryNavigation.find((item) => item.id === primary)?.hi ??
                  viewTitles[view])
                : viewTitles[view]}
            </strong>
          </div>
          <div className="pf-top-actions">
            <div className="pf-search">
              <Search size={17} />
              <input
                type="search"
                aria-label="Search missions"
                placeholder={hi ? "अभ्यास खोजें" : "Search missions"}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setQuery("");
                }}
              />
              {query && (
                <button
                  type="button"
                  aria-label="Clear mission search"
                  onClick={() => setQuery("")}
                >
                  <X size={16} />
                </button>
              )}
              {query.trim() && (
                <section
                  className="pf-search-results"
                  aria-label="Mission search results"
                >
                  <p role="status">
                    {matches.length
                      ? `${matches.length} matching missions`
                      : "No matching missions. Try SQL, Git, or functions."}
                  </p>
                  {matches.map((mission) => (
                    <button
                      type="button"
                      key={mission.id}
                      onClick={() => openMission(mission.id)}
                    >
                      <div>
                        <strong>{hi ? mission.titleHi : mission.title}</strong>
                        <small>
                          {mission.skill} · {mission.minutes} min
                        </small>
                      </div>
                      <ArrowRight size={16} />
                    </button>
                  ))}
                </section>
              )}
            </div>
            <Button
              variant="quiet"
              aria-label={
                hi ? "हिन्दी — Switch to English" : "EN — हिन्दी में बदलें"
              }
              onClick={onLanguage}
            >
              {hi ? "हिन्दी" : "EN"}
            </Button>
          </div>
        </header>
        <main ref={main} id="pf-main-content" tabIndex={-1} className="pf-main">
          {children}
        </main>
        <footer className="pf-footer">
          <span>Learn by doing. Keep the evidence.</span>
          <span>
            <span className="pf-save-dot" />
            {sync}
          </span>
        </footer>
      </div>
    </div>
  );
}
