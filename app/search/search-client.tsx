"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { SimilarIncidentCard } from "@/components/SimilarIncidentCard";
import { MongoBadge, MongoCaption } from "@/components/mongo/MongoBadge";
import { MongoMemoryEngine } from "@/components/mongo/MongoMemoryEngine";
import { MongoTracePanel } from "@/components/mongo/MongoTracePanel";
import { SearchEngineBadge } from "@/components/mongo/SearchEngineBadge";
import type { MongoTraceData } from "@/components/mongo/types";
import { searchEngineDetail } from "@/lib/search-labels";
import type { Incident } from "@/types/incident";

type SearchMatch = {
  incident: Incident;
  score: number;
  source: string;
};

type TriedAlreadyStat = {
  action: string;
  totalAttempts: number;
  temporary: number;
  successful: number;
  failed: number;
};

type SearchBrief = {
  summary: string;
  triedAlready: string[];
  triedAlreadyStats?: TriedAlreadyStat[];
  recommendedNext: string[];
  recommendations?: Array<{
    text: string;
    confidence: number;
    evidenceIncidentId?: string;
  }>;
  confidence?: number;
  uncertaintyNote?: string;
  evidenceIds?: string[];
  aiSource?: "evidence_only" | "openai_grounded";
  similar?: Array<{
    incidentId: string;
    title: string;
    score: number;
    source: string;
  }>;
};

/** Demo prompts that exercise different confidence / conflict paths. */
const SCENARIO_QUERIES = [
  {
    label: "High confidence · pool saturation",
    query:
      "Payment API intermittently timing out and database connections near capacity at 96/100.",
  },
  {
    label: "Conflict · similar symptoms",
    query:
      "Payment timeouts and elevated latency, but unclear if pool, provider, DNS, or missing index.",
  },
  {
    label: "Low confidence · sparse match",
    query:
      "EU VAT calculation timeout; tax microservice unreachable; payment provider never called.",
  },
  {
    label: "Outdated knowledge",
    query:
      "Legacy payments-primary connection pool exhaustion with only 5 max connections.",
  },
  {
    label: "Tried restart already",
    query:
      "Intermittent payment timeouts under load. Restarting pods only helped temporarily.",
  },
] as const;

export function SearchClient() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(
    "Payment API is intermittently timing out and database connections are near capacity.",
  );
  const [matches, setMatches] = useState<SearchMatch[]>([]);
  const [brief, setBrief] = useState<SearchBrief | null>(null);
  const [sourceNote, setSourceNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [traceOpen, setTraceOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  async function runSearch(nextQuery = query) {
    setLoading(true);
    setHasSearched(true);
    setError(null);
    setBrief(null);
    setMatches([]);
    setSourceNote(null);

    try {
      const response = await fetch("/api/incidents/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: nextQuery, includeBrief: true }),
      });
      const body = (await response.json()) as {
        matches?: SearchMatch[];
        brief?: SearchBrief;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(body.error ?? "Search failed");
      }

      const nextMatches = body.matches ?? [];
      setMatches(nextMatches);
      setBrief(body.brief ?? null);
      setSourceNote(searchEngineDetail(nextMatches[0]?.source));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const fromUrl = searchParams.get("q");
    if (fromUrl && fromUrl.trim()) {
      setQuery(fromUrl);
      void runSearch(fromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const traceData: MongoTraceData | null = useMemo(() => {
    if (!hasSearched || (matches.length === 0 && !brief && !loading)) {
      return loading
        ? {
            queryLabel: query,
            matches: [],
          }
        : null;
    }
    return {
      queryLabel: query,
      searchSource: matches[0]?.source,
      matches: matches.map((match) => ({
        incidentId: match.incident._id,
        title: match.incident.title,
        score: match.score,
        source: match.source,
      })),
      aggregations: brief?.triedAlreadyStats?.map((stat) => ({
        action: stat.action,
        totalAttempts: stat.totalAttempts,
        temporary: stat.temporary,
        successful: stat.successful,
        failed: stat.failed,
      })),
      actionsRetrieved: brief?.triedAlready?.length,
      evidenceIds:
        brief?.evidenceIds ?? matches.map((match) => match.incident._id),
      aiSource: brief?.aiSource,
    };
  }, [brief, hasSearched, loading, matches, query]);

  return (
    <main className="mx-auto max-w-3xl space-y-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gs-muted">
          Organizational memory
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Search organizational memory
        </h1>
        <p className="mt-1 text-sm text-gs-muted">
          Describe the current failure. GhostShift retrieves similar historical
          incidents and prior actions from MongoDB.
        </p>
      </div>

      <form
        className="gs-panel gs-panel-ai space-y-4 p-5"
        onSubmit={(event) => {
          event.preventDefault();
          void runSearch();
        }}
      >
        <label htmlFor="issue" className="block text-sm font-medium">
          Describe the current failure…
        </label>
        <textarea
          id="issue"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          rows={4}
          placeholder="Payment requests intermittently time out when traffic increases."
          className="gs-input"
        />
        <div className="flex flex-wrap gap-2">
          {SCENARIO_QUERIES.map((scenario) => (
            <button
              key={scenario.label}
              type="button"
              onClick={() => {
                setQuery(scenario.query);
                void runSearch(scenario.query);
              }}
              className="rounded-full border border-gs-border bg-slate-50 px-2.5 py-1 text-[11px] text-slate-700 transition hover:border-cyan-400/40 hover:bg-cyan-50"
            >
              {scenario.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] text-gs-muted">
            Searching:{" "}
            <span className="gs-mono text-slate-600">
              incidents · actions · resolutions
            </span>
          </p>
          <button
            type="submit"
            disabled={loading}
            className="gs-btn-primary inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium disabled:opacity-60"
          >
            <Search className="h-4 w-4" />
            {loading ? "Searching…" : "Search Memory"}
          </button>
        </div>
      </form>

      {hasSearched ? (
        <MongoMemoryEngine running={loading} data={traceData} />
      ) : null}

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {hasSearched && !loading ? (
        <div className="flex flex-wrap items-center gap-2">
          <SearchEngineBadge source={matches[0]?.source} />
          {sourceNote ? <MongoCaption>{sourceNote}</MongoCaption> : null}
          {matches.length > 0 ? (
            <button
              type="button"
              onClick={() => setTraceOpen(true)}
              className="gs-btn-mongo rounded-md px-3 py-1.5 text-[11px] font-medium"
            >
              View Memory Trace
            </button>
          ) : null}
        </div>
      ) : null}

      {brief ? (
        <section className="gs-panel gs-panel-ai space-y-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide">
              Evidence Brief
            </h2>
            <MongoBadge kind="aggregation" />
          </div>
          <p className="text-sm leading-6 text-slate-700">{brief.summary}</p>
          {brief.uncertaintyNote ? (
            <p className="rounded-md border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-900">
              {brief.uncertaintyNote}
            </p>
          ) : null}
          {brief.triedAlreadyStats && brief.triedAlreadyStats.length > 0 ? (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gs-muted">
                We&apos;ve tried that already
              </h3>
              <MongoCaption>Calculated with MongoDB Aggregation</MongoCaption>
              <ul className="mt-2 space-y-2">
                {brief.triedAlreadyStats.map((stat) => (
                  <li
                    key={stat.action}
                    className="rounded-lg border border-gs-border bg-slate-50 p-3 text-sm"
                  >
                    <p className="font-medium">{stat.action}</p>
                    <p className="gs-mono mt-1 text-xs text-gs-muted">
                      Attempts {stat.totalAttempts} · Temporary {stat.temporary} ·
                      Permanent resolutions {stat.successful}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-gs-muted">
          Similar Historical Incidents
        </h2>
        {!loading && hasSearched && matches.length === 0 && !error ? (
          <p className="text-sm text-gs-muted">
            No sufficiently similar incident found in organizational memory.
          </p>
        ) : null}
        {matches.map((match) => (
          <SimilarIncidentCard
            key={match.incident._id}
            incident={match.incident}
            score={match.score}
            source={match.source}
          />
        ))}
      </section>

      <MongoTracePanel
        open={traceOpen}
        onClose={() => setTraceOpen(false)}
        data={traceData}
      />
    </main>
  );
}
