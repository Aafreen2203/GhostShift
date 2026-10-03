"use client";

import { useEffect, useState } from "react";

type FreshnessReport = {
  incidentId: string;
  serviceId: string;
  outdated: boolean;
  notes: string[];
};

export function KnowledgeFreshness({ incidentId }: { incidentId: string }) {
  const [report, setReport] = useState<FreshnessReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(`/api/incidents/${incidentId}/freshness`);
        const body = (await response.json()) as FreshnessReport & { error?: string };
        if (!response.ok) {
          throw new Error(body.error ?? "Failed to load freshness");
        }
        if (!cancelled) setReport(body);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load freshness");
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [incidentId]);

  if (error) {
    return <p className="text-sm text-red-700">{error}</p>;
  }
  if (!report) {
    return <p className="text-sm text-slate-600">Checking knowledge freshness...</p>;
  }

  return (
    <section
      className={`rounded-lg border p-4 ${
        report.outdated
          ? "border-amber-300 bg-amber-50"
          : "border-emerald-200 bg-emerald-50"
      }`}
    >
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
        Knowledge freshness
      </h2>
      <p className="mt-2 text-sm font-medium">
        {report.outdated
          ? "Historical infrastructure differs from the current environment. Verify before applying previous fixes."
          : "Historical knowledge matches current config."}
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
        {report.notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </section>
  );
}
