import type { Service, ServiceStatus } from "@/types/service";

const statusStyles: Record<ServiceStatus, string> = {
  healthy: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-900",
  incident: "bg-red-100 text-red-800",
};

export function SystemStatus({ service }: { service: Service }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-semibold">{service.name}</h2>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[service.status]}`}
        >
          {service.status}
        </span>
      </div>
      <p className="mt-3 text-sm text-slate-600">Owner team: {service.ownerTeam}</p>
    </article>
  );
}
