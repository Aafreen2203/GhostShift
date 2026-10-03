import Link from "next/link";
import type { Incident } from "@/types/incident";

/**
 * WORKSTREAM 2 / 3
 * Render one Vector Search hit. Do not pass a made-up score.
 */
export function SimilarIncidentCard({
  incident,
  score,
}: {
  incident: Incident;
  score?: number;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold">
          <Link href={`/incidents/${incident._id}`} className="hover:underline">
            {incident.title}
          </Link>
        </h3>
        {score !== undefined ? (
          <span className="text-xs text-slate-500">Score {score.toFixed(2)}</span>
        ) : null}
      </div>
      <p className="mt-2 text-sm text-slate-700">{incident.summary}</p>
    </article>
  );
}
