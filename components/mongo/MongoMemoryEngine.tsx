"use client";

import { useEffect, useState } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { searchEngineLabel } from "@/lib/search-labels";
import { SearchEngineBadge } from "./SearchEngineBadge";
import { MONGO_TRACE } from "./constants";
import type { MongoTraceData } from "./types";

type StageId =
  | "incident"
  | "embed"
  | "vector"
  | "matches"
  | "actions"
  | "agg"
  | "evidence"
  | "ai"
  | "human";

const STAGE_ORDER: StageId[] = [
  "incident",
  "embed",
  "vector",
  "matches",
  "actions",
  "agg",
  "evidence",
  "ai",
  "human",
];

const PIPELINE: Array<{ id: StageId; label: string; kind: "mongo" | "ai" | "flow" }> = [
  { id: "incident", label: "Current incident", kind: "flow" },
  { id: "embed", label: "Embedding", kind: "flow" },
  { id: "vector", label: "MongoDB Vector Search", kind: "mongo" },
  { id: "matches", label: "Historical matches", kind: "mongo" },
  { id: "agg", label: "MongoDB Aggregation", kind: "mongo" },
  { id: "ai", label: "AI evidence brief", kind: "ai" },
];

function stageState(
  stageId: StageId,
  activeIndex: number,
  complete: boolean,
): "pending" | "active" | "done" {
  const index = STAGE_ORDER.indexOf(stageId);
  if (complete || index < activeIndex) return "done";
  if (index === activeIndex) return "active";
  return "pending";
}

export function MongoMemoryEngine({
  running,
  data,
}: {
  running: boolean;
  data?: MongoTraceData | null;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (!running && data) {
      setActiveIndex(STAGE_ORDER.length - 1);
      setComplete(true);
      return;
    }
    if (!running) return;

    setComplete(false);
    setActiveIndex(0);
    let index = 0;
    const id = window.setInterval(() => {
      index += 1;
      if (index >= STAGE_ORDER.length) {
        window.clearInterval(id);
        setComplete(true);
        return;
      }
      setActiveIndex(index);
    }, 220);
    return () => window.clearInterval(id);
  }, [running, data]);

  const matchSource = data?.searchSource ?? data?.matches[0]?.source;
  const matchCount = data?.matches.length ?? 0;
  const aggTotals = (data?.aggregations ?? []).reduce(
    (acc, row) => ({
      failed: acc.failed + row.failed,
      temporary: acc.temporary + row.temporary,
      resolved: acc.resolved + row.successful,
      attempts: acc.attempts + row.totalAttempts,
    }),
    { failed: 0, temporary: 0, resolved: 0, attempts: 0 },
  );

  const labels: Record<StageId, { title: string; detail: string }> = {
    incident: {
      title: "Incident context ready",
      detail: data?.queryLabel ?? "Current failure loaded for investigation",
    },
    embed: {
      title: "Query embedded",
      detail: MONGO_TRACE.embeddingLabel,
    },
    vector: {
      title: "Historical memory searched",
      detail: `${searchEngineLabel(matchSource)} · index ${MONGO_TRACE.vectorIndex} · ${MONGO_TRACE.embeddingSimilarity}`,
    },
    matches: {
      title:
        matchCount > 0
          ? `${matchCount} match${matchCount === 1 ? "" : "es"} retrieved`
          : running
            ? "Scanning incident memories…"
            : "No semantic matches returned",
      detail:
        matchCount > 0
          ? data!.matches
              .slice(0, 3)
              .map(
                (m) =>
                  `${m.incidentId}   ${Math.round(m.score * 100)}%`,
              )
              .join(" · ")
          : `Collection: ${MONGO_TRACE.collections.incidents}`,
    },
    actions: {
      title: "Previous actions analysed",
      detail:
        typeof data?.actionsRetrieved === "number"
          ? `${data.actionsRetrieved} action document(s) from ${MONGO_TRACE.collections.actions}`
          : `Collection: ${MONGO_TRACE.collections.actions}`,
    },
    agg: {
      title: "MongoDB Aggregation",
      detail:
        data?.aggregations && data.aggregations.length > 0
          ? `Attempts ${aggTotals.attempts} · Failed ${aggTotals.failed} · Temporary ${aggTotals.temporary} · Resolved ${aggTotals.resolved}`
          : "Outcome counts from historical actions",
    },
    evidence: {
      title: "Evidence pack assembled",
      detail:
        data?.evidenceIds && data.evidenceIds.length > 0
          ? data.evidenceIds.slice(0, 6).join(" · ")
          : "Incident + action evidence",
    },
    ai: {
      title: "Evidence brief generated",
      detail:
        data?.aiSource === "openai_grounded"
          ? "GhostShift AI · grounded on MongoDB evidence"
          : "GhostShift AI · evidence-only brief from MongoDB memory",
    },
    human: {
      title: "Human verification required",
      detail: "Engineer decides — no autonomous remediation",
    },
  };

  return (
    <section className="gs-panel gs-panel-mongo p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gs-mongo-ink">
          GhostShift Memory Trace
        </p>
        {matchSource ? <SearchEngineBadge source={matchSource} /> : null}
      </div>

      <div className="gs-trace-pipeline mt-3">
        {PIPELINE.map((step, index) => {
          const state = stageState(step.id, activeIndex, complete);
          return (
            <div key={step.id} className="flex items-center gap-1">
              <span
                className="gs-trace-step"
                data-state={state}
                data-kind={step.kind}
              >
                {step.label}
              </span>
              {index < PIPELINE.length - 1 ? (
                <span className="text-[10px] text-slate-300">→</span>
              ) : null}
            </div>
          );
        })}
      </div>

      <ol className="mt-4 space-y-2">
        {STAGE_ORDER.map((stageId, index) => {
          const done = complete || index < activeIndex;
          const current = !complete && index === activeIndex;
          const stage = labels[stageId];
          const isMongo = ["vector", "matches", "actions", "agg"].includes(
            stageId,
          );
          const isAi = stageId === "ai" || stageId === "evidence";
          return (
            <li
              key={stageId}
              className={`flex gap-3 rounded-md border px-3 py-2 transition ${
                current
                  ? isAi
                    ? "border-cyan-400/40 bg-gradient-to-r from-cyan-50 to-violet-50"
                    : isMongo
                      ? "border-emerald-400/45 bg-emerald-500/10"
                      : "border-slate-300 bg-slate-50"
                  : done
                    ? "border-gs-border bg-slate-50"
                    : "border-transparent bg-transparent opacity-45"
              }`}
            >
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
                {done ? (
                  <Check
                    className={`h-3.5 w-3.5 ${
                      isAi
                        ? "text-gs-violet"
                        : isMongo
                          ? "text-gs-mongo-ink"
                          : "text-slate-600"
                    }`}
                  />
                ) : current ? (
                  <LoaderCircle
                    className={`h-3.5 w-3.5 animate-spin ${
                      isAi
                        ? "text-gs-cyan"
                        : isMongo
                          ? "text-gs-mongo-ink"
                          : "text-slate-600"
                    }`}
                  />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                )}
              </span>
              <div className="min-w-0">
                <p
                  className={`text-sm font-medium ${
                    isAi
                      ? "text-violet-800"
                      : isMongo
                        ? "text-gs-mongo-ink"
                        : "text-slate-900"
                  }`}
                >
                  {done || current ? "✓ " : ""}
                  {stage.title}
                </p>
                <p className="gs-mono mt-0.5 truncate text-[11px] text-slate-500">
                  {stage.detail}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
