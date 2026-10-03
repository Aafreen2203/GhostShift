"use client";

import { useEffect, useState } from "react";
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
        const servicesBody = (await servicesResponse.json()) as Service[] | { error?: string };
        const incidentsBody = (await incidentsResponse.json()) as Incident[] | { error?: string };

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
          setError(err instanceof Error ? err.message : "Failed to load dashboard data");
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
    <main className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">Current service status from MongoDB.</p>
      </div>

      {loading ? <p className="text-sm text-slate-600">Loading services...</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {!loading && !error && services.length === 0 ? (
        <p className="text-sm text-slate-600">No services yet. Run npm run seed.</p>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <SystemStatus key={service._id} service={service} />
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Active Incidents</h2>
        {incidents.length === 0 && !loading && !error ? (
          <p className="text-sm text-slate-600">No active incidents.</p>
        ) : null}
        <div className="space-y-3">
          {incidents.map((incident) => (
            <IncidentCard key={incident._id} incident={incident} />
          ))}
        </div>
      </section>
    </main>
  );
}
