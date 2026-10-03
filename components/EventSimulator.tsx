"use client";

import { useState } from "react";
import type { SystemEvent } from "@/types/event";

type Preset = {
  label: string;
  event: Omit<SystemEvent, "_id" | "timestamp">;
};

const presets: Preset[] = [
  {
    label: "DB connections 75%",
    event: {
      serviceId: "payment-api",
      type: "metric",
      metric: "db_connections_pct",
      value: 75,
      max: 100,
      message: "Database connections at 75%",
      severity: "info",
    },
  },
  {
    label: "DB connections 90%",
    event: {
      serviceId: "payment-api",
      type: "metric",
      metric: "db_connections_pct",
      value: 90,
      max: 100,
      message: "Database connections at 90%",
      severity: "warning",
    },
  },
  {
    label: "DB connections 96%",
    event: {
      serviceId: "payment-api",
      type: "metric",
      metric: "db_connections_pct",
      value: 96,
      max: 100,
      message: "Database connections at 96%",
      severity: "critical",
    },
  },
  {
    label: "Trigger payment timeout",
    event: {
      serviceId: "payment-api",
      type: "error",
      message: "Intermittent payment timeout",
      severity: "critical",
    },
  },
  {
    label: "Trigger latency spike",
    event: {
      serviceId: "payment-api",
      type: "warning",
      metric: "latency_ms",
      value: 2400,
      message: "Payment latency spike",
      severity: "warning",
    },
  },
];

export function EventSimulator() {
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [posted, setPosted] = useState<SystemEvent[]>([]);
  const [note, setNote] = useState<string | null>(null);

  async function postEvent(preset: Preset) {
    setPendingLabel(preset.label);
    setError(null);
    setNote(null);

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...preset.event,
          timestamp: new Date().toISOString(),
        }),
      });
      const body = (await response.json()) as SystemEvent & { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Failed to store event");
      }
      setPosted((current) => [body, ...current].slice(0, 6));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to store event");
    } finally {
      setPendingLabel(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => void postEvent(preset)}
            disabled={pendingLabel !== null}
            className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-60"
          >
            {pendingLabel === preset.label ? "Sending..." : preset.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setPosted([]);
            setError(null);
            setNote(
              "Simulator panel cleared. Stored events are unchanged. Run npm run seed to restore the demo collections.",
            );
          }}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          Reset demo
        </button>
      </div>

      <p className="text-sm text-slate-600">
        These buttons only store a system event. Automatic incident detection is not implemented.
      </p>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {note ? <p className="text-sm text-slate-700">{note}</p> : null}

      {posted.length > 0 ? (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">Stored events</h2>
          <ul className="space-y-2">
            {posted.map((event) => (
              <li key={event._id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
                <p className="font-medium">{event.message}</p>
                <p className="text-slate-600">
                  {event.serviceId} · {event.type} · {event.severity}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
