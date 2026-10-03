"use client";

import { useEffect, useState } from "react";
import { Check, LoaderCircle } from "lucide-react";
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

function searchLabel(source?: string): string {
  if (source === "atlas_vector_search") return "MongoDB Atlas Vector Search";
  if (source === "cosine_fallback") {
    return "Cosine ranking over stored MongoDB embeddings";
  }
  return "MongoDB similarity search";
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
    }, 180);
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
      title: "Current failure",
      detail: data?.queryLabel ?? "Incident context ready",
    },
    embed: {
      title: "Generate query embedding",
      detail: `${MONGO_TRACE.embeddingDimensions}-d vector · path ${MONGO_TRACE.embeddingPath}`,
    },
    vector: {
      title: searchLabel(matchSource),
      detail: `Collection: ${MONGO_TRACE.collections.incidents} · Index: ${MONGO_TRACE.vectorIndex}`,
    },
    matches: {
      title:
        matchCount > 0
          ? `${matchCount} semantic match${matchCount === 1 ? "" : "es"}`
          : running
            ? "Scanning incident memories…"
            : "No semantic matches returned",
      detail:
        matchCount > 0
          ? data!.matches
              .slice(0, 3)
              .map(
                (m) =>
                  `${m.incidentId} ${Math.round(m.score * 100)}%`,
              )
              .join(" · ")
          : `Querying ${MONGO_TRACE.collections.incidents}`,
    },
    actions: {
      title: "Historical actions retrieved",
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
      title: "GhostShift AI brief",
      detail:
        data?.aiSource === "openai_grounded"
          ? "Evidence + grounded model wording"
          : "Evidence-only brief from MongoDB memory",
    },
    human: {
      title: "Human engineer decides",
      detail: "No autonomous remediation",
    },
  };

  return (
    <section className="gs-panel border-emerald-500/25 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
          👻 GhostShift Memory Engine
        </p>
        <p className="text-[10px] uppercase tracking-wider text-gs-muted">
          MongoDB retrieves evidence · AI assists
        </p>
      </div>

      <ol className="mt-4 space-y-2">
        {STAGE_ORDER.map((stageId, index) => {
          const done = complete || index < activeIndex;
          const current = !complete && index === activeIndex;
          const stage = labels[stageId];
          const isMongo = ["vector", "matches", "actions", "agg"].includes(
            stageId,
          );
          return (
            <li
              key={stageId}
              className={`flex gap-3 rounded-md border px-3 py-2 transition ${
                current
                  ? "border-emerald-400/40 bg-emerald-500/10"
                  : done
                    ? "border-gs-border bg-slate-50"
                    : "border-transparent bg-transparent opacity-45"
              }`}
            >
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
                {done ? (
                  <Check className="h-3.5 w-3.5 text-emerald-700" />
                ) : current ? (
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin text-emerald-700" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-gs-muted" />
                )}
              </span>
              <div className="min-w-0">
                <p
                  className={`text-sm font-medium ${
                    isMongo ? "text-emerald-800" : "text-slate-900"
                  }`}
                >
                  {stage.title}
                </p>
                <p className="gs-mono mt-0.5 truncate text-[11px] text-gs-muted">
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
