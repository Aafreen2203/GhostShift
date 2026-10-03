"use client";

import { useEffect, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { MongoBadge, MongoCaption } from "@/components/mongo/MongoBadge";

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
        const body = (await response.json()) as FreshnessReport & {
          error?: string;
        };
        if (!response.ok) {
          throw new Error(body.error ?? "Failed to load freshness");
        }
        if (!cancelled) setReport(body);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load freshness",
          );
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
    return (
      <div className="gs-panel p-4 text-sm text-gs-muted">
        Checking knowledge freshness against MongoDB config…
      </div>
    );
  }

  return (
    <section
      className={`gs-panel p-5 ${
        report.outdated ? "border-amber-400/40" : "border-emerald-400/30"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TriangleAlert
            className={`h-4 w-4 ${
              report.outdated ? "text-gs-warning" : "text-gs-success"
            }`}
          />
          <h2 className="text-sm font-semibold tracking-wide uppercase">
            Knowledge Freshness
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MongoBadge kind="freshness" />
          <span
            className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
              report.outdated
                ? "border-amber-400/40 bg-amber-400/10 text-amber-800"
                : "border-emerald-400/40 bg-emerald-400/10 text-emerald-700"
            }`}
          >
            {report.outdated ? "VERIFY BEFORE REUSE" : "CONFIG ALIGNED"}
          </span>
        </div>
      </div>

      <MongoCaption>
        Compared from MongoDB incident + service documents
      </MongoCaption>

      <p className="mt-3 text-sm text-slate-600">
        {report.outdated
          ? "Historical infrastructure differs from the current environment."
          : "Historical knowledge matches current service configuration."}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <div className="rounded-lg border border-gs-border bg-slate-50 p-3">
          <p className="text-[10px] uppercase tracking-wider text-gs-muted">
            Historical notes
          </p>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            {report.notes.length > 0 ? (
              report.notes.map((note) => (
                <li key={note} className="gs-mono text-xs leading-5">
                  {note}
                </li>
              ))
            ) : (
              <li className="text-xs text-gs-muted">No config drift detected.</li>
            )}
          </ul>
        </div>
        <div className="hidden items-center justify-center text-gs-muted sm:flex">
          →
        </div>
        <div className="rounded-lg border border-gs-border bg-slate-50 p-3">
          <p className="text-[10px] uppercase tracking-wider text-gs-muted">
            Current service
          </p>
          <p className="gs-mono mt-2 text-sm text-gs-cyan">{report.serviceId}</p>
          <p className="mt-3 text-xs text-gs-muted">
            historicalConfig vs currentConfig in MongoDB
          </p>
        </div>
      </div>
    </section>
  );
}
