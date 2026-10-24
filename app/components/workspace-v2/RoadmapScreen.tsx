"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  CircleDot,
  GitBranch,
  List,
  LockKeyhole,
  Maximize2,
  Minus,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Undo2,
} from "lucide-react";
import {
  nextNode,
  nodeState,
  type Learner,
  type SkillNode,
} from "@/lib/learning";
import { missions } from "@/lib/missions";
import {
  Badge,
  Button,
  EmptyState,
  Feedback,
  PageHeading,
  Progress,
  type Tone,
} from "./primitives";

const statusPresentation: Record<
  string,
  { label: string; icon: typeof Check; tone: Tone }
> = {
  available: { label: "Available", icon: CircleDot, tone: "accent" },
  attempted: { label: "Practicing", icon: CircleDot, tone: "accent" },
  "needs-practice": {
    label: "Needs practice",
    icon: RotateCcw,
    tone: "warning",
  },
  verified: { label: "Verified", icon: Check, tone: "success" },
  completed: { label: "Completed", icon: Check, tone: "success" },
  revision: { label: "Needs revision", icon: RefreshCw, tone: "warning" },
  blocked: { label: "Locked", icon: LockKeyhole, tone: "neutral" },
};
function graphLayout(nodes: SkillNode[]) {
  const byId = new Map(nodes.map((node) => [node.id, node])),
    levels = new Map<string, number>();
  function depth(id: string, visiting = new Set<string>()): number {
    if (levels.has(id)) return levels.get(id)!;
    if (visiting.has(id)) return 0;
    const node = byId.get(id);
    if (!node) return 0;
    const next = new Set(visiting);
    next.add(id);
    const value = node.prerequisites.length
      ? 1 +
        Math.max(
          ...node.prerequisites
            .filter((key) => byId.has(key))
            .map((key) => depth(key, next)),
          -1,
        )
      : 0;
    levels.set(id, value);
    return value;
  }
  nodes.forEach((node) => depth(node.id));
  const rows = new Map<number, SkillNode[]>();
  for (const node of nodes) {
    const level = levels.get(node.id)!;
    rows.set(level, [...(rows.get(level) ?? []), node]);
  }
  const columns = Math.max(1, ...[...rows.values()].map((row) => row.length));
  const width = columns * 276 - 36;
  const positions = new Map<string, { x: number; y: number }>();
  for (const [level, row] of rows)
    row.forEach((node, index) =>
      positions.set(node.id, {
        x: (width - row.length * 276 + 36) / 2 + index * 276,
        y: level * 174,
      }),
    );
  return {
    positions,
    width,
    height: (Math.max(0, ...rows.keys()) + 1) * 174 - 54,
  };
}
export function RoadmapScreen({
  state,
  onMission,
  onGoal,
}: {
  state: Learner;
  onMission: (id: string) => void;
  onGoal: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null),
    [search, setSearch] = useState(""),
    [listView, setListView] = useState(false);
  const [zoomOverride, setZoom] = useState<number | null>(null),
    [pan, setPan] = useState({ x: 24, y: 24 });
  const [viewport, setViewport] = useState({ width: 700, height: 560 });
  const canvas = useRef<HTMLDivElement>(null),
    drag = useRef<{ x: number; y: number; px: number; py: number } | null>(
      null,
    );
  const map = state.roadmap,
    hi = state.language === "hi",
    next = nextNode(state);
  const layout = useMemo(() => graphLayout(map?.nodes ?? []), [map]);
  const hasMap = Boolean(map?.nodes.length);
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const box = entries[0].contentRect;
      setViewport({ width: box.width, height: box.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasMap, listView]);
  if (!map || !map.nodes.length)
    return (
      <EmptyState
        icon={<GitBranch size={36} />}
        title="Your path starts with a goal."
        action={
          <Button variant="primary" onClick={onGoal}>
            Create my learning path
            <ArrowRight size={16} />
          </Button>
        }
      >
        Choose what you want to learn. Your roadmap will show the first step and
        the skills it builds on.
      </EmptyState>
    );
  const selected =
    map.nodes.find((node) => node.id === selectedId) ?? next ?? map.nodes[0];
  const done = map.nodes.filter((node) =>
    ["completed", "verified", "revision"].includes(nodeState(node, state)),
  ).length;
  const fit = Math.max(
    0.2,
    Math.min(
      1,
      (viewport.width - 48) / layout.width,
      (viewport.height - 48) / layout.height,
    ),
  );
  const zoom = zoomOverride ?? 1;
  const selectedStatus = nodeState(selected, state),
    selectedMission = missions.find(
      (mission) => mission.id === selected.missionId,
    );
  function status(node: SkillNode) {
    const raw = nodeState(node, state),
      presentation = statusPresentation[raw] ?? statusPresentation.available;
    return {
      ...presentation,
      label:
        next?.id === node.id && raw === "available"
          ? "Current step"
          : presentation.label,
    };
  }
  function select(node: SkillNode) {
    setSelectedId(node.id);
  }
  const matching = map.nodes.filter((node) =>
    `${node.title} ${node.titleHi}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        label="My Learning"
        title={map.title}
        description="A practical path, with evidence behind every step."
        action={
          <Button onClick={onGoal}>
            <RefreshCw size={16} />
            Adjust goal
          </Button>
        }
      />
      <div className="pf-map-summary">
        <Badge tone="accent">
          {map.source === "ai" ? "AI-generated path" : "Curated adaptive path"}
        </Badge>
        <span>
          {done} of {map.nodes.length} milestones checked
        </span>
        <Progress
          value={done}
          max={map.nodes.length}
          label="Checked milestones"
        />
        <span>{Math.round((done / map.nodes.length) * 100)}%</span>
      </div>
      <div className="pf-map-layout">
        <section
          className="pf-map-panel pf-panel"
          aria-label="Learning roadmap"
        >
          <div className="pf-map-toolbar">
            <label className="pf-map-search">
              <Search size={17} />
              <input
                aria-label="Search roadmap topics"
                placeholder="Find a topic"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <Button
              variant="quiet"
              aria-pressed={listView}
              onClick={() => setListView((value) => !value)}
            >
              <List size={16} />
              {listView ? "Map view" : "Step list"}
            </Button>
          </div>
          <div
            className={`pf-map-visual ${listView ? "pf-map-visual--hidden" : ""}`}
          >
            <div
              ref={canvas}
              className="pf-map-canvas"
              tabIndex={0}
              role="region"
              aria-label="Skill map. Arrow keys pan; plus and minus zoom. A step-list alternative is available."
              onKeyDown={(event) => {
                if (event.target !== event.currentTarget) return;
                const directions: Record<string, { x: number; y: number }> = {
                  ArrowLeft: { x: 40, y: 0 },
                  ArrowRight: { x: -40, y: 0 },
                  ArrowUp: { x: 0, y: 40 },
                  ArrowDown: { x: 0, y: -40 },
                };
                if (directions[event.key]) {
                  event.preventDefault();
                  const delta = directions[event.key];
                  setPan((value) => ({
                    x: value.x + delta.x,
                    y: value.y + delta.y,
                  }));
                }
                if (["+", "=", "-"].includes(event.key)) {
                  event.preventDefault();
                  setZoom(
                    Math.max(
                      0.2,
                      Math.min(1.5, zoom + (event.key === "-" ? -0.1 : 0.1)),
                    ),
                  );
                }
              }}
              onPointerDown={(event) => {
                if ((event.target as Element).closest("button")) return;
                drag.current = {
                  x: event.clientX,
                  y: event.clientY,
                  px: pan.x,
                  py: pan.y,
                };
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                const start = drag.current;
                if (start)
                  setPan({
                    x: start.px + event.clientX - start.x,
                    y: start.py + event.clientY - start.y,
                  });
              }}
              onPointerUp={() => {
                drag.current = null;
              }}
              onPointerCancel={() => {
                drag.current = null;
              }}
            >
              <div
                className="pf-map-world"
                style={{
                  width: layout.width,
                  height: layout.height,
                  transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})`,
                }}
              >
                <svg
                  className="pf-map-edges"
                  width={layout.width}
                  height={layout.height}
                  aria-hidden="true"
                >
                  {map.nodes.flatMap((node) =>
                    node.prerequisites.map((id) => {
                      const from = layout.positions.get(id),
                        to = layout.positions.get(node.id);
                      return from && to ? (
                        <path
                          key={`${id}-${node.id}`}
                          className={
                            selected.id === node.id || selected.id === id
                              ? "pf-edge-active"
                              : ""
                          }
                          d={`M${from.x + 120},${from.y + 120} C${from.x + 120},${from.y + 150} ${to.x + 120},${to.y - 30} ${to.x + 120},${to.y}`}
                        />
                      ) : null;
                    }),
                  )}
                </svg>
                {map.nodes.map((node, index) => {
                  const presentation = status(node),
                    Icon = presentation.icon,
                    position = layout.positions.get(node.id)!;
                  return (
                    <button
                      type="button"
                      key={node.id}
                      className={`pf-map-node pf-map-node--${nodeState(node, state)} ${node.id === selected.id ? "pf-map-node--selected" : ""} ${!matching.includes(node) ? "pf-map-node--dim" : ""}`}
                      style={{ left: position.x, top: position.y }}
                      aria-pressed={selected.id === node.id}
                      onClick={() => select(node)}
                    >
                      <span className="pf-map-node-number">
                        {node.recovery ? (
                          <>
                            <Undo2 size={14} />
                            Recovery detour
                          </>
                        ) : (
                          `Step ${index + 1}`
                        )}
                      </span>
                      <strong>{hi ? node.titleHi : node.title}</strong>
                      <span>
                        <Icon size={15} />
                        {presentation.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="pf-map-controls">
              <span>
                <Check size={14} />
                Verified
                <LockKeyhole size={14} />
                Locked
              </span>
              <div>
                <Button
                  variant="quiet"
                  aria-label="Zoom out"
                  onClick={() => setZoom(Math.max(0.2, zoom - 0.1))}
                >
                  <Minus size={16} />
                </Button>
                <output aria-label="Map zoom">{Math.round(zoom * 100)}%</output>
                <Button
                  variant="quiet"
                  aria-label="Zoom in"
                  onClick={() => setZoom(Math.min(1.5, zoom + 0.1))}
                >
                  <Plus size={16} />
                </Button>
                <Button
                  variant="quiet"
                  aria-label="Fit roadmap to view"
                  onClick={() => {
                    setZoom(fit);
                    setPan({ x: 24, y: 24 });
                  }}
                >
                  <Maximize2 size={16} />
                </Button>
              </div>
            </div>
          </div>
          <ol
            className={`pf-roadmap-list ${listView ? "pf-roadmap-list--visible" : ""}`}
            aria-label="Roadmap step list"
          >
            {matching.map((node) => {
              const presentation = status(node),
                Icon = presentation.icon;
              return (
                <li key={node.id}>
                  <button
                    type="button"
                    aria-pressed={node.id === selected.id}
                    onClick={() => select(node)}
                  >
                    <span
                      className={`pf-step-icon pf-step-icon--${presentation.tone}`}
                    >
                      <Icon size={18} />
                    </span>
                    <div>
                      <strong>{hi ? node.titleHi : node.title}</strong>
                      <small>
                        {node.recovery ? "Recovery detour · " : ""}
                        {presentation.label} ·{" "}
                        {missions.find(
                          (mission) => mission.id === node.missionId,
                        )?.minutes ?? 10}{" "}
                        min
                      </small>
                    </div>
                    <ArrowRight size={16} />
                  </button>
                </li>
              );
            })}
          </ol>
          {matching.length === 0 && (
            <p className="pf-map-no-results" role="status">
              No topics match your search. Clear it to see the full path.
            </p>
          )}
        </section>
        <aside
          className="pf-panel pf-map-inspector"
          aria-label="Selected milestone details"
        >
          <Badge tone={status(selected).tone}>
            {selected.recovery ? "Recovery detour" : status(selected).label}
          </Badge>
          <h2>{hi ? selected.titleHi : selected.title}</h2>
          <p>{selected.description}</p>
          <div className="pf-milestone-meta">
            <ClockBadge minutes={selectedMission?.minutes ?? 10} />
            <span>{selectedMission?.skill}</span>
          </div>
          <h3>Builds on</h3>
          {selected.prerequisites.length ? (
            <ul>
              {selected.prerequisites.map((id) => {
                const prerequisite = map.nodes.find((node) => node.id === id);
                return (
                  <li key={id}>
                    {prerequisite ? (
                      <button
                        type="button"
                        onClick={() => select(prerequisite)}
                      >
                        {hi ? prerequisite.titleHi : prerequisite.title}
                        <ArrowRight size={14} />
                      </button>
                    ) : (
                      "Unavailable prerequisite"
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p>A starting point. No earlier roadmap milestone is required.</p>
          )}
          {selected.recovery && (
            <Feedback tone="warning" title="Why this detour appeared">
              {selected.description}
              <Button
                variant="quiet"
                onClick={() => {
                  const original = map.nodes.find(
                    (node) => node.id === selected.recovery!.forNodeId,
                  );
                  if (original) select(original);
                }}
              >
                <Undo2 size={15} />
                View original mission
              </Button>
            </Feedback>
          )}
          {selectedStatus === "blocked" && (
            <Feedback title="Earlier checks come first">
              You can preview this mission. Its prerequisites remain visible and
              its learning state stays controlled by core verification.
            </Feedback>
          )}
          <Button
            variant="primary"
            onClick={() => onMission(selected.missionId)}
          >
            {selectedStatus === "blocked" ? "Preview mission" : "Open mission"}
            <ArrowRight size={16} />
          </Button>
          <small>
            Only actual mission checks update your learning record. Opening a
            milestone never verifies it.
          </small>
        </aside>
      </div>
      <details className="pf-map-scope">
        <summary>Path coverage and assessment limits</summary>
        <p>{map.description}</p>
      </details>
    </>
  );
}
function ClockBadge({ minutes }: { minutes: number }) {
  return <span>{minutes} minute mission</span>;
}
