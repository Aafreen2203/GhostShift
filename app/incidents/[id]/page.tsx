"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ActionHistory } from "@/components/ActionHistory";
import { AgentBrief } from "@/components/AgentBrief";
import { IncidentTimeline } from "@/components/IncidentTimeline";
import type { IncidentAction } from "@/types/action";
import type { Incident } from "@/types/incident";
import type { Service } from "@/types/service";

export default function IncidentDetailPage() {
  const params = useParams<{ id: string }>();
  const incidentId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [incident, setIncident] = useState<Incident | null>(null);
  const [serviceName, setServiceName] = useState<string>("");
  const [actions, setActions] = useState<IncidentAction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!incidentId) return;
    let cancelled = false;

    async function load() {
      try {
        const [incidentResponse, actionsResponse, servicesResponse] = await Promise.all([
          fetch(`/api/incidents/${incidentId}`),
          fetch(`/api/incidents/${incidentId}/actions`),
          fetch("/api/services"),
        ]);
        const incidentBody = (await incidentResponse.json()) as Incident | { error?: string };
        const actionsBody = (await actionsResponse.json()) as IncidentAction[] | { error?: string };
        const servicesBody = (await servicesResponse.json()) as Service[] | { error?: string };

        if (!incidentResponse.ok) {
          const message =
            "error" in incidentBody && incidentBody.error
              ? incidentBody.error
              : "Failed to load incident";
          throw new Error(message);
        }
        if (!actionsResponse.ok || !servicesResponse.ok || !Array.isArray(actionsBody)) {
          throw new Error("Failed to load incident details");
        }

        const loaded = incidentBody as Incident;
        const services = Array.isArray(servicesBody) ? servicesBody : [];
        if (!cancelled) {
          setIncident(loaded);
          setActions(actionsBody);
          setServiceName(
            services.find((service) => service._id === loaded.serviceId)?.name ??
              loaded.serviceId,
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

  if (loading) return <p className="text-sm text-slate-600">Loading incident...</p>;
  if (error) return <p className="text-sm text-red-700">{error}</p>;
  if (!incident) return <p className="text-sm text-slate-600">Incident not found.</p>;

  return (
    <main className="space-y-8">
      <div>
        <p className="text-sm text-slate-500">{serviceName}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{incident.title}</h1>
        <p className="mt-2 text-sm text-slate-700">{incident.summary}</p>
      </div>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Symptoms</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {incident.symptoms.map((symptom) => (
            <li key={symptom}>{symptom}</li>
          ))}
        </ul>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Root cause
          </h2>
          <p className="mt-2 text-sm">{incident.rootCause ?? "Not recorded."}</p>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Resolution
          </h2>
          <p className="mt-2 text-sm">{incident.resolution ?? "Not recorded."}</p>
        </div>
      </section>

      <AgentBrief incidentId={incident._id} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Previous actions</h2>
        <ActionHistory actions={actions} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Timeline</h2>
        <IncidentTimeline actions={actions} />
      </section>
    </main>
  );
}
