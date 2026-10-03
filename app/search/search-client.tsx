"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SimilarIncidentCard } from "@/components/SimilarIncidentCard";
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
  uncertaintyNote?: string;
};

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

  async function runSearch(nextQuery = query) {
    setLoading(true);
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
      const sources = new Set(nextMatches.map((match) => match.source));
      setSourceNote(
        sources.has("atlas_vector_search")
          ? "Ranked with MongoDB Atlas Vector Search."
          : "Ranked with cosine similarity over stored embeddings (Atlas Vector Search index unavailable or empty).",
      );
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

  return (
    <main className="max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Search memory</h1>
        <p className="mt-1 text-sm text-slate-600">
          Describe a live failure. GhostShift retrieves similar historical incidents and
          prior actions from MongoDB.
        </p>
      </div>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          void runSearch();
        }}
      >
        <label htmlFor="issue" className="block text-sm font-medium">
          Describe the current issue...
        </label>
        <textarea
          id="issue"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          rows={4}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {loading ? "Searching..." : "Search GhostShift Memory"}
        </button>
      </form>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {sourceNote ? <p className="text-sm text-slate-600">{sourceNote}</p> : null}

      {brief ? (
        <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Evidence brief
          </h2>
          <p className="text-sm">{brief.summary}</p>
          {brief.uncertaintyNote ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm">
              {brief.uncertaintyNote}
            </p>
          ) : null}
          {brief.triedAlreadyStats && brief.triedAlreadyStats.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold">We&apos;ve tried that already</h3>
              <ul className="mt-2 space-y-2 text-sm">
                {brief.triedAlreadyStats.map((stat) => (
                  <li key={stat.action} className="rounded border border-slate-200 p-2">
                    <p className="font-medium">{stat.action}</p>
                    <p className="text-slate-600">
                      Attempts {stat.totalAttempts} · Temporary {stat.temporary} ·
                      Permanent resolutions {stat.successful}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {brief.recommendedNext.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold">Historical resolutions</h3>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {brief.recommendedNext.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Similar historical incidents
        </h2>
        {matches.map((match) => (
          <div key={match.incident._id} className="space-y-1">
            <SimilarIncidentCard incident={match.incident} score={match.score} />
            {match.incident.rootCause ? (
              <p className="px-1 text-sm text-slate-600">
                Historical root cause: {match.incident.rootCause}
              </p>
            ) : null}
          </div>
        ))}
      </section>
    </main>
  );
}
