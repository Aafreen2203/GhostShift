"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Ghost,
  Radio,
} from "lucide-react";
import { IncidentCard } from "@/components/IncidentCard";
import { SystemStatus } from "@/components/SystemStatus";
import { deriveServiceHealth } from "@/lib/service-health";
import type { SystemEvent } from "@/types/event";
import type { Incident } from "@/types/incident";
import type { Service } from "@/types/service";

type StreamMessage =
  | { type: "ready"; message: string }
  | {
      type: "event";
      event: SystemEvent;
      openedIncidentId: string | null;
      reason: string;
    }
  | { type: "error"; message: string };

export default function DashboardPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [resolvedCount, setResolvedCount] = useState(0);
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [streamLive, setStreamLive] = useState(false);
  const [streamFlash, setStreamFlash] = useState(false);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    try {
      const [
        servicesResponse,
        incidentsResponse,
        resolvedResponse,
        eventsResponse,
      ] = await Promise.all([
        fetch("/api/services"),
        fetch("/api/incidents?status=active"),
        fetch("/api/incidents?status=resolved"),
        fetch("/api/events?limit=40"),
      ]);

      const servicesBody = (await servicesResponse.json()) as
        | Service[]
        | { error?: string };
      const incidentsBody = (await incidentsResponse.json()) as
        | Incident[]
        | { error?: string };
      const resolvedBody = (await resolvedResponse.json()) as
        | Incident[]
        | { error?: string };
      const eventsBody = (await eventsResponse.json()) as
        | SystemEvent[]
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

      setServices(servicesBody);
      setIncidents(incidentsBody);
      setResolvedCount(Array.isArray(resolvedBody) ? resolvedBody.length : 0);
      setEvents(Array.isArray(eventsBody) ? eventsBody : []);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load dashboard data",
      );
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, []);

  // Initial load + polling fallback (SSE is primary for demo immediacy).
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!cancelled) await load();
    })();
    const id = window.setInterval(() => {
      if (!cancelled) void load({ silent: true });
    }, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [load]);

  // MongoDB Change Stream → SSE → immediate dashboard refresh.
  useEffect(() => {
    const source = new EventSource("/api/stream");

    source.onmessage = (message) => {
      try {
        const data = JSON.parse(message.data) as StreamMessage;
        if (data.type === "ready") {
          setStreamLive(true);
        } else if (data.type === "event") {
          setStreamLive(true);
          setStreamFlash(true);
          window.setTimeout(() => setStreamFlash(false), 1400);
          setEvents((current) => {
            const next = [data.event, ...current];
            return next.slice(0, 40);
          });
          void load({ silent: true });
        } else if (data.type === "error") {
          setStreamLive(false);
        }
      } catch {
        // ignore malformed SSE payloads
      }
    };

    source.onerror = () => {
      setStreamLive(false);
    };

    return () => {
      source.close();
    };
  }, [load]);

  const active = incidents[0];
  const activeService = active
    ? services.find((service) => service._id === active.serviceId)
    : undefined;
  const activeHealth = activeService
    ? deriveServiceHealth(activeService, events)
    : null;

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            System Overview
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Engineering command center
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Live service health, MongoDB-backed incident memory, and GhostShift
            investigation.
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
            streamLive
              ? "border-emerald-500/40 bg-emerald-500/10 text-gs-mongo-ink"
              : "border-gs-border bg-slate-50 text-slate-600"
          } ${streamFlash ? "gs-new-event" : ""}`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              streamLive ? "bg-gs-mongo gs-pulse" : "bg-slate-400"
            }`}
          />
          {streamLive
            ? "MongoDB Change Stream · LIVE"
            : "Change Stream reconnecting · poll fallback"}
        </span>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="gs-panel h-44 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {!loading && !error && services.length === 0 ? (
        <p className="text-sm text-slate-600">No services yet. Run npm run seed.</p>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <SystemStatus
            key={service._id}
            service={service}
            events={events}
          />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {active && activeService && activeHealth ? (
          <article className="gs-panel gs-panel-incident p-5">
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
            <h2 className="mt-1 text-2xl font-bold uppercase tracking-wide text-slate-900">
              {activeService.name}
            </h2>
            <p className="mt-2 text-sm text-slate-700">{active.summary}</p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Metric
                label="DB Connections"
                value={activeHealth.connectionsLabel}
                danger
              />
              <Metric
                label="Latency"
                value={`${activeHealth.latencyMs} ms${activeHealth.risingLatency ? " ↑" : ""}`}
                danger
              />
              <Metric
                label="Timeout Rate"
                value={
                  activeHealth.timeoutRate !== null
                    ? `${activeHealth.timeoutRate.toFixed(1)}% ↑`
                    : "—"
                }
                danger
              />
            </div>

            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-gs-critical"
                style={{ width: `${activeHealth.pressurePct}%` }}
              />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                href={`/incidents/${active._id}`}
                className="gs-btn-primary inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium"
              >
                <Ghost className="h-4 w-4" />
                Investigate with GhostShift
              </Link>
              <span className="inline-flex items-center gap-2 text-xs text-slate-600">
                <span className="gs-pulse h-1.5 w-1.5 rounded-full bg-gs-cyan" />
                Vector search + aggregation ready
              </span>
            </div>
          </article>
        ) : !loading && !error ? (
          <article className="gs-panel flex flex-wrap items-center justify-between gap-4 px-4 py-3.5">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 text-gs-success">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  All systems healthy
                </p>
                <p className="text-xs text-slate-600">
                  No active incidents. Open the simulator to run the demo.
                </p>
              </div>
            </div>
            <Link
              href="/simulator"
              className="gs-btn-ghost inline-flex rounded-md px-3 py-2 text-sm font-medium"
            >
              Open Simulator
            </Link>
          </article>
        ) : (
          <div className="gs-panel h-28 animate-pulse bg-slate-100" />
        )}

        <article className="gs-panel p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Radio className="h-3.5 w-3.5 text-gs-mongo-ink" />
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                Recent Events
              </h2>
            </div>
            <span
              className={`gs-mono text-[10px] ${
                streamLive ? "text-gs-mongo-ink" : "text-slate-500"
              }`}
            >
              {streamLive ? "change stream · live" : "polling fallback"}
            </span>
          </div>
          <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto">
            {events.length === 0 ? (
              <li className="rounded-md border border-dashed border-gs-border px-3 py-4 text-xs text-slate-600">
                Waiting for monitoring events. Use the Simulator to inject load.
              </li>
            ) : (
              events.slice(0, 8).map((event) => (
                <li
                  key={event._id ?? `${event.serviceId}-${event.timestamp}-${event.message}`}
                  className="rounded-md border border-gs-border bg-slate-50 px-3 py-2 gs-new-event"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="gs-mono text-[10px] font-medium text-slate-700">
                      {new Date(event.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </p>
                    <SeverityChip severity={event.severity} />
                  </div>
                  <p className="mt-1 text-xs text-slate-800">{event.message}</p>
                  <p className="gs-mono mt-1 text-[10px] text-slate-500">
                    {event.serviceId}
                    {typeof event.value === "number"
                      ? ` · ${event.metric ?? "value"} ${event.value}`
                      : ""}
                  </p>
                </li>
              ))
            )}
          </ul>
        </article>
      </section>

      <section className="gs-panel gs-panel-mongo p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              GhostShift Memory
            </p>
            <p className="mt-0.5 text-sm text-slate-700">
              {resolvedCount} historical incidents indexed in MongoDB
            </p>
            <p className="mt-2 text-xs text-gs-mongo-ink">
              Semantic Memory · 384-d embeddings · Vector Search · Aggregation
            </p>
          </div>
          <Link
            href="/search"
            className="gs-btn-primary inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium"
          >
            Search Memory
          </Link>
        </div>
      </section>

      {incidents.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Active Incidents
          </h2>
          <div className="space-y-3">
            {incidents.map((incident) => (
              <IncidentCard key={incident._id} incident={incident} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

function Metric({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-lg border border-gs-border bg-slate-50 p-3">
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-600">
        {label}
      </p>
      <p
        className={`gs-mono mt-1 text-sm font-semibold ${
          danger ? "text-gs-critical" : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function SeverityChip({ severity }: { severity: SystemEvent["severity"] }) {
  const styles =
    severity === "critical"
      ? "border-red-500/35 bg-red-500/10 text-red-700"
      : severity === "warning"
        ? "border-amber-500/35 bg-amber-500/10 text-amber-800"
        : "border-slate-300 bg-slate-100 text-slate-700";
  return (
    <span
      className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase ${styles}`}
    >
      {severity}
    </span>
  );
}
