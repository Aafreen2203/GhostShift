"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SystemEvent } from "@/types/event";

type Preset = {
  label: string;
  event: Omit<SystemEvent, "_id" | "timestamp">;
};

type PostedEvent = SystemEvent & {
  openedIncidentId?: string | null;
  detectionReason?: string;
};

type StreamMessage =
  | { type: "ready"; message: string }
  | {
      type: "event";
      event: SystemEvent;
      openedIncidentId: string | null;
      reason: string;
    }
  | { type: "error"; message: string };

/** Mirrors data/demo-events.json for the live demo sequence. */
const presets: Preset[] = [
  {
    label: "DB connections 75%",
    event: {
      serviceId: "payment-api",
      type: "metric",
      metric: "db_connections_pct",
      value: 75,
      max: 100,
      message: "Database connection usage reached 75%.",
      severity: "info",
    },
  },
  {
    label: "DB connections 87%",
    event: {
      serviceId: "payment-api",
      type: "metric",
      metric: "db_connections_pct",
      value: 87,
      max: 100,
      message: "Database connection usage reached 87%.",
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
      message: "Database connection usage reached 96%.",
      severity: "critical",
    },
  },
  {
    label: "Payment latency increasing",
    event: {
      serviceId: "payment-api",
      type: "warning",
      metric: "payment_latency_ms",
      value: 2400,
      message: "Payment latency is increasing across checkout requests.",
      severity: "warning",
    },
  },
  {
    label: "Payment timeout rate increasing",
    event: {
      serviceId: "payment-api",
      type: "error",
      metric: "payment_timeout_rate",
      value: 18,
      max: 100,
      message: "Intermittent payment timeout rate is increasing.",
      severity: "critical",
    },
  },
];

export function EventSimulator() {
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [posted, setPosted] = useState<PostedEvent[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [live, setLive] = useState<string[]>([]);
  const [openedIncidentId, setOpenedIncidentId] = useState<string | null>(null);

  useEffect(() => {
    const source = new EventSource("/api/stream");

    source.onmessage = (message) => {
      try {
        const data = JSON.parse(message.data) as StreamMessage;
        if (data.type === "ready") {
          setLive((current) => [`ready: ${data.message}`, ...current].slice(0, 8));
        } else if (data.type === "event") {
          setLive((current) =>
            [`event: ${data.event.message} · ${data.reason}`, ...current].slice(
              0,
              8,
            ),
          );
          if (data.openedIncidentId) {
            setOpenedIncidentId(data.openedIncidentId);
          }
        } else if (data.type === "error") {
          setLive((current) => [`error: ${data.message}`, ...current].slice(0, 8));
        }
      } catch {
        // ignore malformed SSE payloads
      }
    };

    source.onerror = () => {
      setLive((current) =>
        ["stream disconnected; retrying...", ...current].slice(0, 8),
      );
    };

    return () => {
      source.close();
    };
  }, []);

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
      const body = (await response.json()) as PostedEvent & { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Failed to store event");
      }
      setPosted((current) => [body, ...current].slice(0, 6));
      if (body.openedIncidentId) {
        setOpenedIncidentId(body.openedIncidentId);
        setNote(body.detectionReason ?? "Incident opened from event.");
      } else {
        setNote(body.detectionReason ?? null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to store event");
    } finally {
      setPendingLabel(null);
    }
  }

  async function resetDemo() {
    setError(null);
    try {
      const response = await fetch("/api/demo/reset", { method: "POST" });
      const body = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Failed to reset demo");
      }
      setPosted([]);
      setOpenedIncidentId(null);
      setNote(body.message ?? "Demo reset.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset demo");
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
          onClick={() => void resetDemo()}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          Reset demo
        </button>
      </div>

      <p className="text-sm text-slate-600">
        Demo sequence: raise DB pressure, then latency/timeouts. Critical DB pressure
        (96%) or timeout-after-pressure opens an active Payment API incident. Live
        updates use MongoDB Change Streams via <code>/api/stream</code>.
      </p>

      {openedIncidentId ? (
        <p className="text-sm">
          Active incident:{" "}
          <Link
            href={`/incidents/${openedIncidentId}`}
            className="font-medium underline"
          >
            {openedIncidentId}
          </Link>
          {" · "}
          <Link
            href={`/search?q=${encodeURIComponent(
              "Payment API intermittently timing out and database connections near capacity",
            )}`}
            className="font-medium underline"
          >
            Investigate with GhostShift
          </Link>
        </p>
      ) : null}

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {note ? <p className="text-sm text-slate-700">{note}</p> : null}

      {posted.length > 0 ? (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">CURRENT signals (stored events)</h2>
          <ul className="space-y-2">
            {posted.map((event) => (
              <li
                key={event._id}
                className="rounded-lg border border-slate-200 bg-white p-3 text-sm"
              >
                <p className="font-medium">{event.message}</p>
                <p className="text-slate-600">
                  {event.serviceId} · {event.type} · {event.severity}
                  {typeof event.value === "number" && event.max
                    ? ` · ${event.value}/${event.max}`
                    : ""}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Live Change Stream</h2>
        {live.length === 0 ? (
          <p className="text-sm text-slate-600">Waiting for stream messages...</p>
        ) : (
          <ul className="space-y-1 text-sm text-slate-700">
            {live.map((line, index) => (
              <li
                key={`${line}-${index}`}
                className="rounded border border-slate-200 bg-white px-3 py-2"
              >
                {line}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
