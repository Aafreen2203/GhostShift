"use client";

import { X } from "lucide-react";
import { searchEngineLabel } from "@/lib/search-labels";
import { SearchEngineBadge } from "./SearchEngineBadge";
import { MONGO_TRACE } from "./constants";
import type { MongoTraceData } from "./types";

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
      <aside className="flex h-full w-full max-w-md flex-col border-l border-emerald-500/30 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-emerald-500/20 px-4 py-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gs-mongo-ink">
              GhostShift Memory Trace
            </p>
            <p className="mt-1 text-xs text-slate-600">
              How GhostShift found this evidence
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gs-border p-2 text-slate-500 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 text-sm">
          <div className="flex flex-wrap gap-2">
            <SearchEngineBadge source={source} />
          </div>

          <TraceBlock title="✓ Query embedded">
            <p className="gs-mono text-xs text-gs-mongo-ink">
              {MONGO_TRACE.embeddingLabel}
            </p>
            <p className="gs-mono text-[11px] text-slate-500">
              path: {MONGO_TRACE.embeddingPath} · similarity:{" "}
              {MONGO_TRACE.embeddingSimilarity}
            </p>
          </TraceBlock>

          <TraceBlock title="✓ Historical memory searched">
            <p className="gs-mono text-xs text-gs-mongo-ink">
              {searchEngineLabel(source)}
            </p>
            <p className="gs-mono text-[11px] text-slate-500">
              DB: {MONGO_TRACE.database}
            </p>
            <p className="gs-mono text-[11px] text-slate-500">
              Collection: {MONGO_TRACE.collections.incidents}
            </p>
            <p className="gs-mono text-[11px] text-slate-500">
              Index: {MONGO_TRACE.vectorIndex} · {MONGO_TRACE.embeddingDimensions}
              -d · {MONGO_TRACE.embeddingSimilarity}
            </p>
            {source === "cosine_fallback" ? (
              <p className="mt-2 text-[11px] text-amber-800">
                Atlas Vector Search was unavailable or empty. Showing honest
                local cosine ranking over the same stored embeddings.
              </p>
            ) : null}
          </TraceBlock>

          <TraceBlock title="✓ Matches retrieved">
            {data.matches.length === 0 ? (
              <p className="text-xs text-slate-600">No matches returned.</p>
            ) : (
              <ul className="space-y-1">
                {data.matches.map((match) => (
                  <li
                    key={match.incidentId}
                    className="flex items-center justify-between gap-2 gs-mono text-xs"
                  >
                    <span className="text-gs-mongo-ink">
                      {match.incidentId}
                      {match.title ? (
                        <span className="ml-2 font-sans text-[11px] text-slate-500">
                          {match.title}
                        </span>
                      ) : null}
                    </span>
                    <span className="text-cyan-700">
                      {Math.round(match.score * 100)}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </TraceBlock>

          <TraceBlock title="✓ Previous actions analysed">
            <p className="gs-mono text-xs text-gs-mongo-ink">
              Collection: {MONGO_TRACE.collections.actions}
            </p>
            {typeof data.actionsRetrieved === "number" ? (
              <p className="gs-mono text-[11px] text-slate-500">
                Documents used: {data.actionsRetrieved}
              </p>
            ) : (
              <p className="text-[11px] text-slate-500">
                Actions loaded for matched incident IDs.
              </p>
            )}
          </TraceBlock>

          <TraceBlock title="✓ MongoDB Aggregation">
            {data.aggregations && data.aggregations.length > 0 ? (
              <ul className="space-y-2">
                {data.aggregations.map((row) => (
                  <li
                    key={row.action}
                    className="rounded border border-emerald-500/15 bg-slate-50 p-2"
                  >
                    <p className="text-xs font-medium text-slate-900">
                      {row.action}
                    </p>
                    <p className="gs-mono mt-1 text-[11px] text-slate-500">
                      Attempts {row.totalAttempts} · Temporary {row.temporary} ·
                      Resolved {row.successful} · Failed {row.failed}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-600">
                No aggregation rows for this evidence set.
              </p>
            )}
          </TraceBlock>

          <TraceBlock title="✓ Evidence brief generated">
            <p className="gs-mono text-xs text-violet-800">
              {(data.evidenceIds ?? data.matches.map((m) => m.incidentId)).join(
                " · ",
              ) || "—"}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              {data.aiSource === "openai_grounded"
                ? "GhostShift AI · grounded model wording over MongoDB evidence"
                : "GhostShift AI · evidence-only brief (MongoDB memory)"}
            </p>
          </TraceBlock>

          <TraceBlock title="✓ Human verification required">
            <p className="text-xs text-slate-700">
              Engineer decides. No autonomous remediation.
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
    <section className="rounded-lg border border-emerald-500/20 bg-emerald-50/80 p-3">
      <h3 className="text-xs font-semibold text-gs-mongo-ink">{title}</h3>
      <div className="mt-2 space-y-1">{children}</div>
    </section>
  );
}
