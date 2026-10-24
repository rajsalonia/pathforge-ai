"use client";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  Clock3,
  Code2,
  FlaskConical,
  Search,
} from "lucide-react";
import { missions } from "@/lib/missions";
import { pathways, type Learner } from "@/lib/learning";
import { Badge, Button, EmptyState, PageHeading, Tabs } from "./primitives";

export function PracticeCatalog({
  state,
  onMission,
  onLab,
}: {
  state: Learner;
  onMission: (id: string) => void;
  onLab: () => void;
}) {
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all");
  const visible = missions
    .filter((mission) =>
      `${mission.title} ${mission.titleHi} ${mission.skill}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .filter(
      (mission) =>
        filter === "all" ||
        (filter === "code" &&
          ["coding", "debugging", "algorithm", "project", "sql"].includes(
            mission.type,
          )) ||
        (filter === "engineering" &&
          ["git", "incident", "review", "experiment", "documentation"].includes(
            mission.type,
          )) ||
        (filter === "reflection" &&
          [
            "teach-back",
            "story",
            "roleplay",
            "real-world",
            "collaborative",
            "revision",
          ].includes(mission.type)),
    );
  return (
    <>
      <PageHeading
        label="Practice"
        title={
          state.language === "hi"
            ? "अभ्यास करें। प्रमाण रखें।"
            : "Put your understanding to work."
        }
        description="Choose a bounded challenge. Inspect the result. Build on what you actually checked."
      />
      <Tabs
        label="Practice destinations"
        tabs={[
          { value: "missions", label: "Missions" },
          { value: "lab", label: "Simulation Lab" },
        ]}
        value="missions"
        onChange={(value) => {
          if (value === "lab") onLab();
        }}
      />
      <div className="pf-catalog-controls">
        <div
          className="pf-filter-options"
          role="group"
          aria-label="Mission type"
        >
          {[
            { id: "all", label: "All missions" },
            { id: "code", label: "Coding & SQL" },
            { id: "engineering", label: "Engineering" },
            { id: "reflection", label: "Reflection & checks" },
          ].map((item) => (
            <button
              type="button"
              key={item.id}
              aria-pressed={filter === item.id}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <label className="pf-catalog-search">
          <Search size={17} />
          <input
            type="search"
            aria-label="Filter missions"
            placeholder="Find a mission"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>
      <div className="pf-mission-catalog">
        {visible.map((mission) => {
          const recorded = state.attempts.some(
            (attempt) =>
              attempt.missionId === mission.id &&
              attempt.passed &&
              ["tested", "assessed"].includes(attempt.evidenceType),
          );
          return (
            <button
              type="button"
              key={mission.id}
              onClick={() => onMission(mission.id)}
            >
              <span className="pf-topic-icon">
                {recorded ? <Check size={20} /> : <Code2 size={20} />}
              </span>
              <div>
                <span>
                  {mission.skill} · {mission.type}
                </span>
                <h2>
                  {state.language === "hi" ? mission.titleHi : mission.title}
                </h2>
                <p>
                  {state.language === "hi"
                    ? mission.objectiveHi
                    : mission.objective}
                </p>
                <small>
                  <Clock3 size={13} />
                  {mission.minutes} min
                  {recorded && <Badge tone="success">Checked before</Badge>}
                </small>
              </div>
              <ArrowRight size={18} />
            </button>
          );
        })}
      </div>
      {!visible.length && (
        <EmptyState
          icon={<Search size={30} />}
          title="No matching missions"
          action={
            <Button
              onClick={() => {
                setQuery("");
                setFilter("all");
              }}
            >
              Clear filters
            </Button>
          }
        >
          Try another skill or clear your filters to see the catalogue.
        </EmptyState>
      )}
      <div className="pf-practice-lab-link">
        <FlaskConical size={22} />
        <div>
          <h3>Prefer to see a concept change?</h3>
          <p>Explore deterministic models in the Simulation Lab.</p>
        </div>
        <Button onClick={onLab}>
          Open the lab
          <ArrowRight size={16} />
        </Button>
      </div>
    </>
  );
}
export function ExplorePaths({ onGoal }: { onGoal: (goal: string) => void }) {
  const [query, setQuery] = useState("");
  const visible = pathways.filter((path) =>
    `${path.name} ${path.topics}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        label="Explore paths"
        title="Start with something useful."
        description="Every path names its actual exercises and the limits of what they demonstrate."
      />
      <label className="pf-catalog-search pf-explore-search">
        <Search size={17} />
        <input
          type="search"
          aria-label="Search learning paths"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search skills and paths"
        />
      </label>
      <div className="pf-path-list">
        {visible.map((path) => (
          <button type="button" key={path.id} onClick={() => onGoal(path.goal)}>
            <div>
              <span className="pf-eyebrow">{path.topics}</span>
              <h2>{path.name}</h2>
              <p>{path.description}</p>
            </div>
            <ArrowRight size={18} />
          </button>
        ))}
      </div>
      {!visible.length && (
        <EmptyState
          icon={<Search size={30} />}
          title="No matching paths"
          action={
            <Button onClick={() => onGoal(query)}>Start with this goal</Button>
          }
        >
          The goal dialog explains which supported exercises are available.
        </EmptyState>
      )}
    </>
  );
}
