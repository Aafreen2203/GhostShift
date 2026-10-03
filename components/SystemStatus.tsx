import { Server } from "lucide-react";
import type { Service, ServiceStatus } from "@/types/service";

const statusStyles: Record<ServiceStatus, string> = {
  healthy: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-800",
  incident: "border-red-500/40 bg-red-500/10 text-red-700",
};

const edgeStyles: Record<ServiceStatus, string> = {
  healthy: "border-gs-border",
  warning: "border-amber-500/40",
  incident: "border-red-500/50 shadow-[inset_3px_0_0_0_rgba(239,68,68,0.8)]",
};

function configValue(config: Record<string, unknown>, key: string): string {
  const value = config[key];
  if (typeof value === "number" || typeof value === "string") return String(value);
  return "—";
}

export function SystemStatus({ service }: { service: Service }) {
  const pool = configValue(service.currentConfig, "connectionPoolMax");
  const db = configValue(service.currentConfig, "database");
  const timeout = configValue(service.currentConfig, "timeoutMs");

  return (
    <article className={`gs-panel p-4 ${edgeStyles[service.status]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-gs-muted" />
          <h2 className="text-sm font-semibold tracking-wide uppercase">
            {service.name}
          </h2>
        </div>
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusStyles[service.status]}`}
        >
          {service.status === "incident" ? "INCIDENT" : service.status}
        </span>
      </div>
      <p className="mt-3 text-xs text-gs-muted">{service.ownerTeam} Team</p>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <dt className="text-gs-muted">Database</dt>
          <dd className="gs-mono mt-1 text-slate-700">{db}</dd>
        </div>
        <div>
          <dt className="text-gs-muted">Pool max</dt>
          <dd className="gs-mono mt-1 text-slate-700">{pool}</dd>
        </div>
        <div>
          <dt className="text-gs-muted">Timeout</dt>
          <dd className="gs-mono mt-1 text-slate-700">
            {timeout === "—" ? "—" : `${timeout} ms`}
          </dd>
        </div>
        <div>
          <dt className="text-gs-muted">Service ID</dt>
          <dd className="gs-mono mt-1 text-slate-700">{service._id}</dd>
        </div>
      </dl>
    </article>
  );
}
