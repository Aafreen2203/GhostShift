import Link from "next/link";
import type { Incident, IncidentSeverity, IncidentStatus } from "@/types/incident";

const severityStyles: Record<IncidentSeverity, string> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-amber-100 text-amber-900",
  high: "bg-orange-100 text-orange-900",
  critical: "bg-red-100 text-red-800",
};

const statusStyles: Record<IncidentStatus, string> = {
  active: "bg-red-100 text-red-800",
  resolved: "bg-emerald-100 text-emerald-800",
};

export function IncidentCard({
  incident,
  serviceName,
}: {
  incident: Incident;
  serviceName?: string;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${severityStyles[incident.severity]}`}
        >
          {incident.severity}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[incident.status]}`}
        >
          {incident.status}
        </span>
      </div>
      <h2 className="mt-3 text-base font-semibold">
        <Link href={`/incidents/${incident._id}`} className="hover:underline">
          {incident.title}
        </Link>
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        {serviceName ?? incident.serviceId}
      </p>
      <p className="mt-2 text-sm text-slate-700">{incident.summary}</p>
    </article>
  );
}
