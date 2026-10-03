"use client";

import { useEffect, useState } from "react";
import { IncidentCard } from "@/components/IncidentCard";
import type { Incident } from "@/types/incident";
import type { Service } from "@/types/service";

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [serviceNames, setServiceNames] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [incidentsResponse, servicesResponse] = await Promise.all([
          fetch("/api/incidents"),
          fetch("/api/services"),
        ]);
        const incidentsBody = (await incidentsResponse.json()) as
          | Incident[]
          | { error?: string };
        const servicesBody = (await servicesResponse.json()) as
          | Service[]
          | { error?: string };

        if (!incidentsResponse.ok || !Array.isArray(incidentsBody)) {
          throw new Error(
            !Array.isArray(incidentsBody) && incidentsBody.error
              ? incidentsBody.error
              : "Failed to load incidents",
          );
        }
        if (!servicesResponse.ok || !Array.isArray(servicesBody)) {
          throw new Error(
            !Array.isArray(servicesBody) && servicesBody.error
              ? servicesBody.error
              : "Failed to load services",
          );
        }

        if (!cancelled) {
          setIncidents(incidentsBody);
          setServiceNames(
            Object.fromEntries(
              servicesBody.map((service) => [service._id, service.name]),
            ),
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load incidents",
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

  return (
    <main className="space-y-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gs-muted">
          Memory archive
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Incidents</h1>
        <p className="mt-1 text-sm text-gs-muted">
          Historical incident memory stored in MongoDB.
        </p>
      </div>
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="gs-panel h-28 animate-pulse bg-white/5" />
          ))}
        </div>
      ) : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {!loading && !error && incidents.length === 0 ? (
        <p className="text-sm text-gs-muted">No incidents yet. Run npm run seed.</p>
      ) : null}
      <div className="space-y-3">
        {incidents.map((incident) => (
          <IncidentCard
            key={incident._id}
            incident={incident}
            serviceName={serviceNames[incident.serviceId]}
          />
        ))}
      </div>
    </main>
  );
}
