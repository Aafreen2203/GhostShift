import Link from "next/link";
import { MongoBadge, MongoCaption } from "@/components/mongo/MongoBadge";
import type { Incident } from "@/types/incident";

export function SimilarIncidentCard({
  incident,
  score,
  source,
}: {
  incident: Incident;
  score?: number;
  source?: string;
}) {
  const pct =
    score === undefined
      ? null
      : Math.max(0, Math.min(100, Math.round(score * 100)));

  return (
    <article className="gs-panel p-4 transition hover:border-cyan-400/35">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <MongoBadge kind="vector" />
        <MongoBadge kind="document" />
      </div>
      <MongoCaption>
        Retrieved via MongoDB{" "}
        {source === "atlas_vector_search"
          ? "Atlas Vector Search"
          : source === "cosine_fallback"
            ? "embedding similarity"
            : "Vector Search"}
      </MongoCaption>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="gs-mono text-[11px] text-gs-cyan">{incident._id}</p>
          <h3 className="mt-1 text-base font-semibold">
            <Link
              href={`/incidents/${incident._id}`}
              className="hover:text-gs-cyan"
            >
              {incident.title}
            </Link>
          </h3>
        </div>
        {pct !== null ? (
          <div className="text-right">
            <p className="gs-mono text-lg font-semibold text-gs-cyan">{pct}%</p>
            <p className="text-[10px] uppercase tracking-wider text-gs-muted">
              Semantic match
            </p>
          </div>
        ) : null}
      </div>
      {pct !== null ? (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-gs-cyan to-gs-violet"
            style={{ width: `${pct}%` }}
          />
        </div>
      ) : null}
      <p className="mt-3 text-sm text-slate-600">{incident.summary}</p>
      {incident.rootCause ? (
        <p className="mt-3 text-xs">
          <span className="font-semibold uppercase tracking-wider text-gs-muted">
            Historical root cause:{" "}
          </span>
          <span className="text-slate-700">{incident.rootCause}</span>
        </p>
      ) : null}
      {incident.resolution ? (
        <p className="mt-2 text-xs">
          <span className="font-semibold uppercase tracking-wider text-gs-muted">
            Previous resolution:{" "}
          </span>
          <span className="text-slate-700">{incident.resolution}</span>
        </p>
      ) : null}
      <Link
        href={`/incidents/${incident._id}`}
        className="mt-4 inline-flex rounded-md border border-gs-border-strong px-3 py-1.5 text-xs text-gs-cyan hover:border-cyan-400/40"
      >
        Open Memory
      </Link>
    </article>
  );
}
