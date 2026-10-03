"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
          setError(err instanceof Error ? err.message : "Failed to analyse incident");
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

  if (!incidentId) {
    return (
      <section className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Evidence brief
        </h2>
        <p className="mt-2 text-sm text-slate-700">Select an incident to analyse.</p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Evidence-grounded incident brief
      </h2>
      {loading ? (
        <p className="mt-2 text-sm text-slate-600">
          Building brief from MongoDB memory...
        </p>
      ) : null}
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
      {brief ? (
        <div className="mt-3 space-y-4">
          <p className="text-sm text-slate-800">{brief.summary}</p>
          <p className="text-xs text-slate-500">
            Source:{" "}
            {brief.aiSource === "openai_grounded"
              ? "MongoDB evidence + OpenAI grounded summary"
              : "MongoDB evidence only"}
          </p>

          {brief.uncertaintyNote ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm">
              {brief.uncertaintyNote}
            </p>
          ) : null}

          {brief.similar.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold">Similar historical incidents</h3>
              <ul className="mt-2 space-y-2">
                {brief.similar.map((item) => (
                  <li key={item.incidentId} className="text-sm">
                    <Link
                      href={`/incidents/${item.incidentId}`}
                      className="font-medium hover:underline"
                    >
                      {item.title}
                    </Link>
                    <span className="text-slate-500">
                      {" "}
                      · score {item.score.toFixed(3)} · {item.source}
                    </span>
                    {item.historicalRootCause ? (
                      <p className="text-slate-600">
                        Historical root cause: {item.historicalRootCause}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {brief.triedAlreadyStats && brief.triedAlreadyStats.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold">We&apos;ve tried that already</h3>
              <p className="mt-1 text-xs text-slate-500">
                Counts come from MongoDB action records, not the language model.
              </p>
              <ul className="mt-2 space-y-2">
                {brief.triedAlreadyStats.map((stat) => (
                  <li
                    key={stat.action}
                    className="rounded border border-slate-200 bg-slate-50 p-3 text-sm"
                  >
                    <p className="font-medium">{stat.action}</p>
                    <p className="text-slate-600">
                      Attempts: {stat.totalAttempts} · Temporary: {stat.temporary} ·
                      Permanent resolutions: {stat.successful} · Failed: {stat.failed}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div>
            <h3 className="text-sm font-semibold">Previous troubleshooting evidence</h3>
            {brief.triedAlready.length === 0 ? (
              <p className="mt-1 text-sm text-slate-600">No prior actions recorded.</p>
            ) : (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {brief.triedAlready.slice(0, 12).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            )}
          </div>

          {brief.recommendedNext.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold">Historical resolutions</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {brief.recommendedNext.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {brief.freshnessOutdated ? (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm">
              <p className="font-medium">Knowledge freshness</p>
              <p className="mt-1">
                Historical infrastructure differs from the current environment. Verify
                before applying previous fixes.
              </p>
              <ul className="mt-1 list-disc pl-5">
                {brief.freshnessNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <p className="text-xs text-slate-500">
            Evidence IDs: {brief.evidenceIds.join(", ")}
          </p>
        </div>
      ) : null}
    </section>
  );
}
