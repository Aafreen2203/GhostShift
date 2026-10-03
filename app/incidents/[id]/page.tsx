"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ActionHistory } from "@/components/ActionHistory";
import { AgentBrief } from "@/components/AgentBrief";
import { IncidentTimeline } from "@/components/IncidentTimeline";
import { KnowledgeFreshness } from "@/components/KnowledgeFreshness";
import type { IncidentAction } from "@/types/action";
import type { Incident } from "@/types/incident";
import type { Service } from "@/types/service";

export default function IncidentDetailPage() {
  const params = useParams<{ id: string }>();
  const incidentId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [incident, setIncident] = useState<Incident | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [actions, setActions] = useState<IncidentAction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!incidentId) return;
    let cancelled = false;

    async function load() {
      try {
        const [incidentResponse, actionsResponse, servicesResponse] =
          await Promise.all([
            fetch(`/api/incidents/${incidentId}`),
            fetch(`/api/incidents/${incidentId}/actions`),
            fetch("/api/services"),
          ]);
        const incidentBody = (await incidentResponse.json()) as
          | Incident
          | { error?: string };
        const actionsBody = (await actionsResponse.json()) as
          | IncidentAction[]
          | { error?: string };
        const servicesBody = (await servicesResponse.json()) as
          | Service[]
          | { error?: string };

        if (!incidentResponse.ok) {
          const message =
            "error" in incidentBody && incidentBody.error
              ? incidentBody.error
              : "Failed to load incident";
          throw new Error(message);
        }
        if (
          !actionsResponse.ok ||
          !servicesResponse.ok ||
          !Array.isArray(actionsBody)
        ) {
          throw new Error("Failed to load incident details");
        }

        const loaded = incidentBody as Incident;
        const services = Array.isArray(servicesBody) ? servicesBody : [];
        if (!cancelled) {
          setIncident(loaded);
          setActions(actionsBody);
          setService(
            services.find((item) => item._id === loaded.serviceId) ?? null,
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load incident");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [incidentId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="gs-panel h-28 animate-pulse bg-slate-100" />
        <div className="gs-panel h-48 animate-pulse bg-slate-100" />
      </div>
    );
  }
  if (error) return <p className="text-sm text-red-700">{error}</p>;
  if (!incident) {
    return <p className="text-sm text-gs-muted">Incident not found.</p>;
  }

  const poolMax =
    typeof service?.currentConfig.connectionPoolMax === "number"
      ? service.currentConfig.connectionPoolMax
      : null;
  const database =
    typeof service?.currentConfig.database === "string"
      ? service.currentConfig.database
      : null;

  return (
    <main className="space-y-8">
      <section
        className={`gs-panel p-5 ${
          incident.status === "active" ? "gs-panel-incident" : ""
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            {service?.name ?? incident.serviceId} /{" "}
            {incident.status === "active" ? "Live Incident" : "Historical Memory"}
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-red-500/40 bg-red-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase text-red-700">
              {incident.severity}
            </span>
            <span className="rounded-full border border-gs-border bg-gs-soft px-2.5 py-1 text-[10px] font-semibold uppercase text-slate-600">
              {incident.status}
            </span>
          </div>
        </div>
        <p className="gs-mono mt-3 text-xs text-gs-cyan">{incident._id}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {incident.title}
        </h1>
        <p className="mt-2 text-sm text-slate-600">{incident.summary}</p>
        <p className="gs-mono mt-3 text-xs text-gs-muted">
          Started {new Date(incident.createdAt).toLocaleString()}
        </p>

        {incident.status === "active" ? (
          <div className="mt-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gs-warning">
              Current System State
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-gs-border bg-slate-50 p-3">
                <p className="text-[10px] uppercase tracking-wider text-gs-muted">
                  DB Pool Max
                </p>
                <p className="gs-mono mt-1 text-lg">
                  {poolMax !== null ? poolMax : "—"}
                </p>
              </div>
              <div className="rounded-lg border border-gs-border bg-slate-50 p-3">
                <p className="text-[10px] uppercase tracking-wider text-gs-muted">
                  Database
                </p>
                <p className="gs-mono mt-1 text-sm">{database ?? "—"}</p>
              </div>
              <div className="rounded-lg border border-gs-border bg-slate-50 p-3">
                <p className="text-[10px] uppercase tracking-wider text-gs-muted">
                  Symptoms
                </p>
                <p className="gs-mono mt-1 text-lg">{incident.symptoms.length}</p>
              </div>
              <div className="rounded-lg border border-gs-border bg-slate-50 p-3">
                <p className="text-[10px] uppercase tracking-wider text-gs-muted">
                  Severity
                </p>
                <p className="mt-1 text-sm font-semibold uppercase text-red-700">
                  {incident.severity}
                </p>
              </div>
            </div>
            <Link
              href={`/search?q=${encodeURIComponent(
                `${incident.title}. ${incident.symptoms.join(". ")}`,
              )}`}
              className="gs-btn-primary mt-5 inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium"
            >
              Investigate with GhostShift
            </Link>
            <p className="mt-2 text-xs text-slate-600">
              Runs embedding → MongoDB Vector Search → aggregation → AI evidence
              brief
            </p>
          </div>
        ) : null}
      </section>

      <section className="gs-panel p-5">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-gs-muted">
          Observed Symptoms
        </h2>
        <ul className="mt-3 space-y-2">
          {incident.symptoms.map((symptom) => (
            <li
              key={symptom}
              className="rounded-md border border-gs-border bg-slate-50 px-3 py-2 text-sm text-slate-700"
            >
              {symptom}
            </li>
          ))}
        </ul>
      </section>

      {incident.rootCause || incident.resolution ? (
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="gs-panel p-4">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gs-warning">
              Historical Root Cause
            </h2>
            <p className="mt-2 text-sm text-slate-700">
              {incident.rootCause ?? "Not recorded on this memory item."}
            </p>
          </div>
          <div className="gs-panel p-4">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gs-success">
              Verified Resolution
            </h2>
            <p className="mt-2 text-sm text-slate-700">
              {incident.resolution ?? "Not recorded."}
            </p>
          </div>
        </section>
      ) : (
        <p className="text-sm text-gs-muted">
          Current incident — historical root cause is retrieved from similar memory,
          not assumed.
        </p>
      )}

      <AgentBrief incidentId={incident._id} />

      <KnowledgeFreshness incidentId={incident._id} />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-gs-muted">
          What the Previous Team Tried
        </h2>
        <ActionHistory actions={actions} />
      </section>

      <section className="gs-panel p-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-gs-muted">
          Live Timeline
        </h2>
        <div className="mt-4">
          <IncidentTimeline actions={actions} />
        </div>
      </section>
    </main>
  );
}
