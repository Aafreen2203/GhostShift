"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, Ghost } from "lucide-react";
import { IncidentCard } from "@/components/IncidentCard";
import { SystemStatus } from "@/components/SystemStatus";
import type { Incident } from "@/types/incident";
import type { Service } from "@/types/service";

export default function DashboardPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [servicesResponse, incidentsResponse] = await Promise.all([
          fetch("/api/services"),
          fetch("/api/incidents?status=active"),
        ]);
        const servicesBody = (await servicesResponse.json()) as
          | Service[]
          | { error?: string };
        const incidentsBody = (await incidentsResponse.json()) as
          | Incident[]
          | { error?: string };

        if (!servicesResponse.ok || !Array.isArray(servicesBody)) {
          throw new Error(
            !Array.isArray(servicesBody) && servicesBody.error
              ? servicesBody.error
              : "Failed to load services",
          );
        }
        if (!incidentsResponse.ok || !Array.isArray(incidentsBody)) {
          throw new Error(
            !Array.isArray(incidentsBody) && incidentsBody.error
              ? incidentsBody.error
              : "Failed to load incidents",
          );
        }

        if (!cancelled) {
          setServices(servicesBody);
          setIncidents(incidentsBody);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load dashboard data",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const active = incidents[0];
  const activeService = active
    ? services.find((service) => service._id === active.serviceId)
    : undefined;
  const poolMax =
    typeof activeService?.currentConfig.connectionPoolMax === "number"
      ? activeService.currentConfig.connectionPoolMax
      : null;

  return (
    <main className="space-y-8">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gs-muted">
          System Overview
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Engineering command center
        </h1>
        <p className="mt-1 text-sm text-gs-muted">
          Live service status and active incidents from MongoDB Atlas.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="gs-panel h-36 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {!loading && !error && services.length === 0 ? (
        <p className="text-sm text-gs-muted">No services yet. Run npm run seed.</p>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <SystemStatus key={service._id} service={service} />
        ))}
      </section>

      {active ? (
        <section className="gs-panel gs-panel-ai p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-gs-critical">
              <AlertTriangle className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                Active Incident
              </p>
            </div>
            <span className="rounded-full border border-red-500/40 bg-red-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase text-red-700">
              {active.severity}
            </span>
          </div>
          <p className="gs-mono mt-3 text-xs text-gs-cyan">{active._id}</p>
          <h2 className="mt-1 text-xl font-semibold uppercase tracking-wide">
            {activeService?.name ?? active.serviceId}
          </h2>
          <p className="mt-2 text-sm text-slate-600">{active.summary}</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-gs-border bg-slate-50 p-3">
              <p className="text-[10px] uppercase tracking-wider text-gs-muted">
                Status
              </p>
              <p className="mt-1 text-sm font-semibold uppercase text-red-700">
                {active.status}
              </p>
            </div>
            <div className="rounded-lg border border-gs-border bg-slate-50 p-3">
              <p className="text-[10px] uppercase tracking-wider text-gs-muted">
                Started
              </p>
              <p className="gs-mono mt-1 text-sm">
                {new Date(active.createdAt).toLocaleTimeString()}
              </p>
            </div>
            <div className="rounded-lg border border-gs-border bg-slate-50 p-3">
              <p className="text-[10px] uppercase tracking-wider text-gs-muted">
                Pool config
              </p>
              <p className="gs-mono mt-1 text-sm">
                {poolMax !== null ? `max ${poolMax}` : "n/a"}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href={`/incidents/${active._id}`}
              className="gs-btn-primary inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium"
            >
              Investigate with GhostShift
            </Link>
            <span className="inline-flex items-center gap-2 text-xs text-gs-muted">
              <Ghost className="gs-pulse h-3.5 w-3.5 text-gs-cyan" />
              Memory agent ready
            </span>
          </div>
        </section>
      ) : !loading && !error ? (
        <section className="gs-panel border-dashed p-5">
          <p className="text-sm font-medium text-slate-700">No active incidents</p>
          <p className="mt-1 text-sm text-gs-muted">
            All systems operating normally. Use the simulator to open a demo
            incident.
          </p>
          <Link
            href="/simulator"
            className="gs-btn-ghost mt-4 inline-flex rounded-md px-3 py-2 text-sm"
          >
            Open Simulator
          </Link>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-gs-muted">
          Active Incidents
        </h2>
        <div className="space-y-3">
          {incidents.map((incident) => (
            <IncidentCard key={incident._id} incident={incident} />
          ))}
        </div>
      </section>
    </main>
  );
}
