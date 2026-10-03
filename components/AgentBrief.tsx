"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Ghost, Sparkles, Zap } from "lucide-react";
import { MongoBadge, MongoCaption } from "@/components/mongo/MongoBadge";
import { MongoMemoryEngine } from "@/components/mongo/MongoMemoryEngine";
import { MongoTracePanel } from "@/components/mongo/MongoTracePanel";
import { SearchEngineBadge } from "@/components/mongo/SearchEngineBadge";
import type { MongoTraceData } from "@/components/mongo/types";
import { searchEngineLabel } from "@/lib/search-labels";

type TriedAlreadyStat = {
  action: string;
  totalAttempts: number;
  failed: number;
  temporary: number;
  successful: number;
  summary: string;
};

type Brief = {
  incidentId: string;
  summary: string;
  triedAlready: string[];
  triedAlreadyStats?: TriedAlreadyStat[];
  recommendedNext: string[];
  evidenceIds: string[];
  freshnessOutdated: boolean;
  freshnessNotes: string[];
  similar: Array<{
    incidentId: string;
    title: string;
    score: number;
    source: string;
    historicalRootCause?: string;
  }>;
  aiSource?: "evidence_only" | "openai_grounded";
  uncertaintyNote?: string;
};

export function AgentBrief({ incidentId }: { incidentId?: string }) {
  const [brief, setBrief] = useState<Brief | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(incidentId));
  const [traceOpen, setTraceOpen] = useState(false);

  useEffect(() => {
    if (!incidentId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/agent/analyse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ incidentId }),
        });
        const body = (await response.json()) as {
          brief?: Brief;
          error?: string;
        };
        if (!response.ok || !body.brief) {
          throw new Error(body.error ?? "Failed to analyse incident");
        }
        if (!cancelled) setBrief(body.brief);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to analyse incident",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [incidentId]);

  const traceData: MongoTraceData | null = useMemo(() => {
    if (!brief) return null;
    return {
      queryLabel: `Incident ${brief.incidentId}`,
      searchSource: brief.similar[0]?.source,
      matches: brief.similar.map((item) => ({
        incidentId: item.incidentId,
        title: item.title,
        score: item.score,
        source: item.source,
      })),
      aggregations: brief.triedAlreadyStats?.map((stat) => ({
        action: stat.action,
        totalAttempts: stat.totalAttempts,
        temporary: stat.temporary,
        successful: stat.successful,
        failed: stat.failed,
      })),
      actionsRetrieved: brief.triedAlready.length,
      evidenceIds: brief.evidenceIds,
      aiSource: brief.aiSource,
    };
  }, [brief]);

  if (!incidentId) {
    return (
      <section className="gs-panel border-dashed p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gs-muted">
          GhostShift Analysis
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Select an incident to analyse.
        </p>
      </section>
    );
  }

  const topMatch = brief?.similar[0];
  const otherMatches = brief?.similar.slice(1) ?? [];

  return (
    <div className="space-y-4">
      {(loading || brief) && (
        <MongoMemoryEngine running={loading} data={traceData} />
      )}

      {error ? (
        <section className="gs-panel border-amber-400/40 p-5">
          <p className="text-sm text-amber-800">
            Historical evidence is available, but AI analysis is temporarily
            unavailable.
          </p>
          <p className="mt-2 text-xs text-gs-muted">{error}</p>
        </section>
      ) : null}

      {brief && topMatch ? (
        <section className="gs-panel gs-panel-ai p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Ghost className="h-4 w-4 text-gs-cyan" />
              <h2 className="text-sm font-semibold tracking-wide uppercase">
                GhostShift Memory
              </h2>
            </div>
            <SearchEngineBadge source={topMatch.source} />
          </div>
          <MongoCaption>
            Retrieved via {searchEngineLabel(topMatch.source)}
          </MongoCaption>
          <p className="mt-2 text-sm text-slate-600">
            Similar historical incident detected
          </p>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="gs-mono text-[11px] text-gs-cyan">
                {topMatch.incidentId}
              </p>
              <Link
                href={`/incidents/${topMatch.incidentId}`}
                className="mt-1 block text-lg font-semibold hover:text-gs-cyan"
              >
                {topMatch.title}
              </Link>
            </div>
            <div className="text-right">
              <p className="gs-mono text-3xl font-semibold text-gs-cyan">
                {Math.round(topMatch.score * 100)}%
              </p>
              <p className="text-[10px] uppercase tracking-wider text-gs-muted">
                Semantic match
              </p>
            </div>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-gs-cyan to-gs-violet"
              style={{
                width: `${Math.max(0, Math.min(100, Math.round(topMatch.score * 100)))}%`,
              }}
            />
          </div>
          {topMatch.historicalRootCause ? (
            <div className="mt-4 rounded-lg border border-gs-border bg-slate-50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gs-warning">
                Historical root cause
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {topMatch.historicalRootCause}
              </p>
              <p className="mt-2 text-xs text-gs-muted">
                Evidence from past memory — not a confirmed current cause.
              </p>
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => setTraceOpen(true)}
            className="mt-4 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-800 hover:border-emerald-400/60"
          >
            View MongoDB Trace
          </button>
        </section>
      ) : null}

      {brief ? (
        <section className="gs-panel gs-panel-ai p-5">
          <div className="flex items-center gap-2">
            <span className="gs-pulse inline-flex h-2 w-2 rounded-full bg-gs-cyan" />
            <h2 className="text-sm font-semibold tracking-wide uppercase">
              GhostShift Analysis
            </h2>
            <Sparkles className="h-3.5 w-3.5 text-gs-cyan" />
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            {brief.summary}
          </p>
          <p className="mt-2 text-xs text-gs-muted">
            {brief.aiSource === "openai_grounded"
              ? "Generated from retrieved historical evidence + grounded model wording."
              : "Generated from retrieved historical evidence."}
          </p>

          {brief.uncertaintyNote ? (
            <p className="mt-4 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-900">
              {brief.uncertaintyNote}
            </p>
          ) : null}

          {brief.recommendedNext.length > 0 ? (
            <div className="mt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gs-muted">
                Suggested investigation
              </h3>
              <ol className="mt-3 space-y-2">
                {brief.recommendedNext.map((line, index) => (
                  <li
                    key={line}
                    className="flex gap-3 rounded-lg border border-gs-border bg-slate-50 px-3 py-2 text-sm"
                  >
                    <span className="gs-mono text-gs-cyan">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-slate-700">{line}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            {brief.evidenceIds.map((id) => (
              <Link
                key={id}
                href={id.startsWith("INC") ? `/incidents/${id}` : "#"}
                className="gs-mono rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-[11px] text-cyan-800 hover:border-cyan-300/50"
              >
                {id}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {brief?.triedAlreadyStats && brief.triedAlreadyStats.length > 0 ? (
        <section className="gs-panel border-violet-400/30 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-gs-violet" />
              <h2 className="text-sm font-semibold tracking-wide uppercase">
                We&apos;ve Tried That Already
              </h2>
            </div>
            <MongoBadge kind="aggregation" />
          </div>
          <MongoCaption>Calculated with MongoDB Aggregation</MongoCaption>
          <div className="mt-4 space-y-3">
            {brief.triedAlreadyStats.map((stat) => (
              <div
                key={stat.action}
                className="rounded-lg border border-gs-border bg-slate-50 p-4"
              >
                <p className="text-sm font-semibold text-slate-900">{stat.action}</p>
                <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-md bg-slate-100 p-2">
                    <dt className="text-gs-muted">Attempts</dt>
                    <dd className="gs-mono mt-1 text-base text-slate-900">
                      {stat.totalAttempts}
                    </dd>
                  </div>
                  <div className="rounded-md bg-slate-100 p-2">
                    <dt className="text-gs-muted">Temporary</dt>
                    <dd className="gs-mono mt-1 text-base text-gs-warning">
                      {stat.temporary}
                    </dd>
                  </div>
                  <div className="rounded-md bg-slate-100 p-2">
                    <dt className="text-gs-muted">Resolved</dt>
                    <dd className="gs-mono mt-1 text-base text-gs-success">
                      {stat.successful}
                    </dd>
                  </div>
                </dl>
                {stat.summary ? (
                  <p className="mt-3 text-sm text-slate-600">{stat.summary}</p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {otherMatches.length > 0 ? (
        <section className="gs-panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold tracking-wide uppercase text-gs-muted">
              Other Possible Historical Matches
            </h2>
            <MongoBadge kind="vector" />
          </div>
          <ul className="mt-3 space-y-2">
            {otherMatches.map((item) => (
              <li
                key={item.incidentId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gs-border bg-slate-50 px-3 py-2"
              >
                <div>
                  <p className="gs-mono text-[11px] text-gs-cyan">
                    {item.incidentId}
                  </p>
                  <Link
                    href={`/incidents/${item.incidentId}`}
                    className="text-sm hover:text-gs-cyan"
                  >
                    {item.title}
                  </Link>
                  {item.historicalRootCause ? (
                    <p className="mt-1 text-xs text-gs-muted">
                      Historical: {item.historicalRootCause}
                    </p>
                  ) : null}
                </div>
                <p className="gs-mono text-sm text-gs-violet">
                  {Math.round(item.score * 100)}% match
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <MongoTracePanel
        open={traceOpen}
        onClose={() => setTraceOpen(false)}
        data={traceData}
      />
    </div>
  );
}
