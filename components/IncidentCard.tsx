import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { MongoBadge } from "@/components/mongo/MongoBadge";
import type { Incident, IncidentSeverity, IncidentStatus } from "@/types/incident";

const severityStyles: Record<IncidentSeverity, string> = {
  low: "border-slate-500/40 bg-slate-500/10 text-slate-600",
  medium: "border-amber-500/40 bg-amber-500/10 text-amber-800",
  high: "border-orange-500/40 bg-orange-500/10 text-orange-200",
  critical: "border-red-500/40 bg-red-500/10 text-red-700",
};

const statusStyles: Record<IncidentStatus, string> = {
  active: "border-red-500/40 bg-red-500/10 text-red-700",
  resolved: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700",
};

export function IncidentCard({
  incident,
  serviceName,
}: {
  incident: Incident;
  serviceName?: string;
}) {
  return (
    <article
      className={`gs-panel p-4 transition hover:border-cyan-400/30 ${
        incident.status === "active"
          ? "shadow-[inset_3px_0_0_0_rgba(239,68,68,0.75)]"
          : ""
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <MongoBadge kind="document" />
        <span className="gs-mono text-[11px] text-gs-cyan">{incident._id}</span>
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${severityStyles[incident.severity]}`}
        >
          {incident.severity}
        </span>
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${statusStyles[incident.status]}`}
        >
          {incident.status}
        </span>
      </div>
      <h2 className="mt-3 flex items-start gap-2 text-base font-semibold">
        {incident.status === "active" ? (
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gs-critical" />
        ) : null}
        <Link
          href={`/incidents/${incident._id}`}
          className="hover:text-gs-cyan"
        >
          {incident.title}
        </Link>
      </h2>
      <p className="mt-1 gs-mono text-xs text-gs-muted">
        {serviceName ?? incident.serviceId}
      </p>
      <p className="mt-2 text-sm text-slate-600">{incident.summary}</p>
      <div className="mt-3">
        <Link
          href={`/incidents/${incident._id}`}
          className="text-xs font-medium text-gs-cyan hover:underline"
        >
          Open memory →
        </Link>
      </div>
    </article>
  );
}
