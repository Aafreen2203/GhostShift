"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Activity, Ghost, Radio, RotateCcw } from "lucide-react";
import { ChangeStreamToast } from "@/components/mongo/ChangeStreamToast";
import { MongoBadge, MongoCaption } from "@/components/mongo/MongoBadge";
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

const presets: Preset[] = [
  {
    label: "Set DB Load 75%",
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
    label: "Set DB Load 87%",
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
    label: "Set DB Load 96%",
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
    label: "Trigger Latency Spike",
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
    label: "Trigger Payment Timeout",
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
  const [newEventFlash, setNewEventFlash] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [pipelinePulse, setPipelinePulse] = useState(false);
  const [openedIncidentId, setOpenedIncidentId] = useState<string | null>(null);

  useEffect(() => {
    const source = new EventSource("/api/stream");

    source.onmessage = (message) => {
      try {
        const data = JSON.parse(message.data) as StreamMessage;
        if (data.type === "ready") {
          setLive((current) => [`ready: ${data.message}`, ...current].slice(0, 10));
        } else if (data.type === "event") {
          setNewEventFlash(true);
          setToastVisible(true);
          setPipelinePulse(true);
          window.setTimeout(() => setNewEventFlash(false), 1200);
          window.setTimeout(() => setToastVisible(false), 2800);
          window.setTimeout(() => setPipelinePulse(false), 1600);
          setLive((current) =>
            [
              `> ${data.event._id ?? "EVT"} ${data.event.message}`,
              ...current,
            ].slice(0, 10),
          );
          if (data.openedIncidentId) {
            setOpenedIncidentId(data.openedIncidentId);
          }
        } else if (data.type === "error") {
          setLive((current) => [`error: ${data.message}`, ...current].slice(0, 10));
        }
      } catch {
        // ignore malformed SSE payloads
      }
    };

    source.onerror = () => {
      setLive((current) =>
        ["stream disconnected; retrying...", ...current].slice(0, 10),
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
      setPosted((current) => [body, ...current].slice(0, 8));
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
      const body = (await response.json()) as {
        message?: string;
        error?: string;
      };
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
      <div className="gs-panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gs-muted">
              Control console
            </p>
            <h2 className="mt-1 text-lg font-semibold">Incident Simulator</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <MongoBadge kind="changestream" />
            <span className="rounded-full border border-gs-border bg-gs-soft px-2.5 py-1 text-[10px] uppercase tracking-wider text-gs-cyan">
              Synthetic Monitoring Data
            </span>
          </div>
        </div>
        <p className="mt-2 gs-mono text-xs text-gs-muted">Service: payment-api</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => void postEvent(preset)}
              disabled={pendingLabel !== null}
              className="gs-btn-ghost min-h-12 rounded-md px-3 py-3 text-left text-sm disabled:opacity-50"
            >
              <Activity className="mb-1 h-3.5 w-3.5 text-gs-cyan" />
              {pendingLabel === preset.label ? "Sending..." : preset.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => void resetDemo()}
            className="gs-btn-ghost min-h-12 rounded-md px-3 py-3 text-left text-sm"
          >
            <RotateCcw className="mb-1 h-3.5 w-3.5 text-gs-warning" />
            Reset Demo
          </button>
        </div>
        <p className="mt-4 text-xs text-gs-muted">
          Demo sequence: raise DB pressure, then latency/timeouts. Critical DB
          pressure (96%) opens an active Payment API incident. Live updates stream
          from MongoDB Change Streams.
        </p>
      </div>

      {openedIncidentId ? (
        <div className="gs-panel gs-panel-ai p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Ghost className="h-4 w-4 text-gs-cyan" />
            <p className="text-sm font-medium">Active incident opened</p>
          </div>
          <p className="gs-mono mt-2 text-xs text-gs-cyan">{openedIncidentId}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/incidents/${openedIncidentId}`}
              className="gs-btn-primary rounded-md px-3 py-2 text-sm"
            >
              Investigate with GhostShift
            </Link>
            <Link
              href={`/search?q=${encodeURIComponent(
                "Payment API intermittently timing out and database connections near capacity",
              )}`}
              className="gs-btn-ghost rounded-md px-3 py-2 text-sm"
            >
              Search Memory
            </Link>
          </div>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {note ? <p className="text-sm text-slate-600">{note}</p> : null}

      <section
        className={`gs-panel border-emerald-500/25 p-4 ${
          pipelinePulse ? "gs-new-event" : ""
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            MongoDB live path
          </h3>
          <MongoBadge kind="changestream" />
        </div>
        <MongoCaption>Monitoring event → events collection → Change Stream → UI</MongoCaption>
        <ol className="mt-3 grid gap-2 sm:grid-cols-4">
          {[
            "Monitoring event",
            "events.insertOne()",
            "Change Stream",
            "GhostShift UI",
          ].map((step, index) => (
            <li
              key={step}
              className={`rounded-md border px-2 py-2 text-center text-[11px] ${
                pipelinePulse
                  ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-800"
                  : "border-gs-border bg-slate-50 text-gs-muted"
              }`}
            >
              <span className="gs-mono text-emerald-700/80">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="mt-1">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="gs-panel p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide">
              Current Signals
            </h3>
            {newEventFlash ? (
              <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2 py-0.5 text-[10px] text-emerald-800">
                NEW EVENT
              </span>
            ) : null}
          </div>
          {posted.length === 0 ? (
            <p className="mt-3 text-sm text-gs-muted">
              Fire a control to store synthetic events in MongoDB.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {posted.map((event) => (
                <li
                  key={event._id}
                  className="gs-new-event rounded-md border border-gs-border bg-slate-50 px-3 py-2"
                >
                  <p className="gs-mono text-[11px] text-gs-cyan">
                    {event._id} · {event.metric ?? event.type}
                    {typeof event.value === "number"
                      ? ` = ${event.value}${event.max ? ` / ${event.max}` : ""}`
                      : ""}
                  </p>
                  <p className="mt-1 text-sm text-slate-700">{event.message}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="gs-panel p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-emerald-700" />
              <h3 className="text-sm font-semibold uppercase tracking-wide">
                Live Event Console
              </h3>
            </div>
            <MongoBadge kind="changestream" />
          </div>
          <MongoCaption>Streaming from MongoDB Change Streams</MongoCaption>
          <div className="mt-3 min-h-48 rounded-md border border-gs-border bg-slate-50 p-3">
            {live.length === 0 ? (
              <p className="gs-mono text-xs text-gs-muted">
                waiting for change stream…
              </p>
            ) : (
              <ul className="space-y-1">
                {live.map((line, index) => (
                  <li
                    key={`${line}-${index}`}
                    className="gs-mono gs-new-event text-xs leading-5 text-emerald-700/90"
                  >
                    {line}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <ChangeStreamToast visible={toastVisible} />
    </div>
  );
}
