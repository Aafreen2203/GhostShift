import { Server } from "lucide-react";
import { deriveServiceHealth } from "@/lib/service-health";
import type { SystemEvent } from "@/types/event";
import type { Service, ServiceStatus } from "@/types/service";

const statusStyles: Record<
  "HEALTHY" | "WARNING" | "INCIDENT" | "CRITICAL",
  string
> = {
  HEALTHY: "border-emerald-500/35 bg-emerald-500/10 text-emerald-700",
  WARNING: "border-amber-500/40 bg-amber-500/10 text-amber-800",
  INCIDENT: "border-red-500/45 bg-red-500/10 text-red-700",
  CRITICAL: "border-red-500/45 bg-red-500/10 text-red-700",
};

const edgeStyles: Record<ServiceStatus, string> = {
  healthy: "border-gs-border",
  warning: "border-amber-500/45",
  incident: "gs-panel-incident",
};

function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  const delta = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(delta)) return "—";
  const seconds = Math.max(0, Math.round(delta / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SystemStatus({
  service,
  events = [],
}: {
  service: Service;
  events?: SystemEvent[];
}) {
  const health = deriveServiceHealth(service, events);
  const inIncident = service.status === "incident";

  return (
    <article className={`gs-panel p-4 ${edgeStyles[service.status]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Server
            className={`h-4 w-4 ${inIncident ? "text-gs-critical" : "text-slate-500"}`}
          />
          <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-900">
            {service.name}
          </h2>
        </div>
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusStyles[health.statusLabel]}`}
        >
          {health.statusLabel}
        </span>
      </div>

      <p className="mt-2 text-xs text-slate-600">
        {inIncident
          ? "Intermittent payment failures detected"
          : `${service.ownerTeam} Team`}
      </p>

      {inIncident ? (
        <>
          <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
            <div>
              <dt className="font-medium text-slate-600">DB Connections</dt>
              <dd className="gs-mono mt-1 text-sm font-semibold text-slate-900">
                {health.connectionsLabel}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-slate-600">Latency</dt>
              <dd className="gs-mono mt-1 text-sm font-semibold text-gs-critical">
                {health.latencyMs} ms
                {health.risingLatency ? " ↑" : ""}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-slate-600">Timeout Rate</dt>
              <dd className="gs-mono mt-1 text-sm font-semibold text-gs-critical">
                {health.timeoutRate !== null
                  ? `${health.timeoutRate.toFixed(1)}%`
                  : "—"}
                {health.risingTimeout ? " ↑" : ""}
              </dd>
            </div>
          </dl>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-gs-critical"
              style={{ width: `${health.pressurePct}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-slate-600">
            Last event: {formatRelative(health.lastEventAt)}
          </p>
        </>
      ) : (
        <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <div>
            <dt className="font-medium text-slate-600">Latency</dt>
            <dd className="gs-mono mt-1 text-sm font-semibold text-slate-900">
              {health.latencyMs} ms
            </dd>
          </div>
          <div>
            <dt className="font-medium text-slate-600">DB Connections</dt>
            <dd className="gs-mono mt-1 text-sm font-semibold text-slate-900">
              {health.connectionsLabel}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-slate-600">Timeout</dt>
            <dd className="gs-mono mt-1 text-sm font-semibold text-slate-900">
              {health.timeoutMs !== null ? `${health.timeoutMs} ms` : "—"}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-slate-600">Recent Events</dt>
            <dd className="gs-mono mt-1 text-sm font-semibold text-slate-900">
              {health.recentErrorCount === 0
                ? "0 errors"
                : `${health.recentErrorCount} errors`}
            </dd>
          </div>
        </dl>
      )}

      <div className="mt-4 flex items-center gap-2 border-t border-gs-border pt-3 text-[11px]">
        <span className="gs-pulse inline-block h-1.5 w-1.5 rounded-full bg-gs-mongo" />
        <span className="font-medium text-gs-mongo-ink">MongoDB Atlas</span>
        <span className="text-slate-400">·</span>
        <span className="gs-mono text-slate-600">
          {health.databaseLabel ?? service._id}
        </span>
      </div>
    </article>
  );
}
