"use client";

import { X } from "lucide-react";
import { MONGO_TRACE } from "./constants";
import type { MongoTraceData } from "./types";

function searchLabel(source?: string): string {
  if (source === "atlas_vector_search") return "Atlas Vector Search";
  if (source === "cosine_fallback") {
    return "Cosine fallback over stored embeddings";
  }
  return "Similarity search";
}

export function MongoTracePanel({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: MongoTraceData | null;
}) {
  if (!open || !data) return null;

  const source = data.searchSource ?? data.matches[0]?.source;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/55 backdrop-blur-[1px]">
      <button
        type="button"
        className="h-full flex-1 cursor-default"
        aria-label="Close MongoDB trace"
        onClick={onClose}
      />
      <aside className="flex h-full w-full max-w-md flex-col border-l border-emerald-500/30 bg-[#0a1210] shadow-2xl">
        <div className="flex items-center justify-between border-b border-emerald-500/20 px-4 py-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
              MongoDB Trace
            </p>
            <p className="mt-1 text-xs text-gs-muted">
              How GhostShift found this evidence
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gs-border p-2 text-gs-muted hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 text-sm">
          <TraceBlock title="✓ Query embedded">
            <p className="gs-mono text-xs text-emerald-100">
              {MONGO_TRACE.embeddingDimensions}-dimensional vector
            </p>
            <p className="gs-mono text-[11px] text-gs-muted">
              path: {MONGO_TRACE.embeddingPath}
            </p>
          </TraceBlock>

          <TraceBlock title="✓ Vector Search">
            <p className="gs-mono text-xs text-emerald-100">
              {searchLabel(source)}
            </p>
            <p className="gs-mono text-[11px] text-gs-muted">
              DB: {MONGO_TRACE.database}
            </p>
            <p className="gs-mono text-[11px] text-gs-muted">
              Collection: {MONGO_TRACE.collections.incidents}
            </p>
            <p className="gs-mono text-[11px] text-gs-muted">
              Index: {MONGO_TRACE.vectorIndex}
            </p>
          </TraceBlock>

          <TraceBlock title="✓ Semantic matches">
            {data.matches.length === 0 ? (
              <p className="text-xs text-gs-muted">No matches returned.</p>
            ) : (
              <ul className="space-y-1">
                {data.matches.map((match) => (
                  <li
                    key={match.incidentId}
                    className="flex items-center justify-between gap-2 gs-mono text-xs"
                  >
                    <span className="text-emerald-100">
                      {match.incidentId}
                      {match.title ? (
                        <span className="ml-2 font-sans text-[11px] text-gs-muted">
                          {match.title}
                        </span>
                      ) : null}
                    </span>
                    <span className="text-cyan-200">
                      {match.score.toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </TraceBlock>

          <TraceBlock title="✓ Historical actions retrieved">
            <p className="gs-mono text-xs text-emerald-100">
              Collection: {MONGO_TRACE.collections.actions}
            </p>
            {typeof data.actionsRetrieved === "number" ? (
              <p className="gs-mono text-[11px] text-gs-muted">
                Documents used: {data.actionsRetrieved}
              </p>
            ) : (
              <p className="text-[11px] text-gs-muted">
                Actions loaded for matched incident IDs.
              </p>
            )}
          </TraceBlock>

          <TraceBlock title="✓ Aggregation">
            {data.aggregations && data.aggregations.length > 0 ? (
              <ul className="space-y-2">
                {data.aggregations.map((row) => (
                  <li
                    key={row.action}
                    className="rounded border border-emerald-500/15 bg-black/20 p-2"
                  >
                    <p className="text-xs font-medium text-slate-100">
                      {row.action}
                    </p>
                    <p className="gs-mono mt-1 text-[11px] text-gs-muted">
                      Attempts {row.totalAttempts} · Temporary {row.temporary} ·
                      Resolved {row.successful} · Failed {row.failed}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gs-muted">
                No aggregation rows for this evidence set.
              </p>
            )}
          </TraceBlock>

          <TraceBlock title="✓ Evidence passed to GhostShift AI">
            <p className="gs-mono text-xs text-emerald-100">
              {(data.evidenceIds ?? data.matches.map((m) => m.incidentId)).join(
                " · ",
              ) || "—"}
            </p>
            <p className="mt-1 text-[11px] text-gs-muted">
              {data.aiSource === "openai_grounded"
                ? "Grounded model wording over MongoDB evidence"
                : "Evidence-only brief (MongoDB memory)"}
            </p>
          </TraceBlock>
        </div>
      </aside>
    </div>
  );
}

function TraceBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] p-3">
      <h3 className="text-xs font-semibold text-emerald-200">{title}</h3>
      <div className="mt-2 space-y-1">{children}</div>
    </section>
  );
}
