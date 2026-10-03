import type { SystemEvent } from "@/types/event";
import type { Service, ServiceStatus } from "@/types/service";

export type ServiceHealth = {
  statusLabel: "HEALTHY" | "WARNING" | "INCIDENT" | "CRITICAL";
  latencyMs: number;
  connectionsUsed: number | null;
  connectionsMax: number | null;
  connectionsLabel: string;
  timeoutMs: number | null;
  timeoutRate: number | null;
  recentErrorCount: number;
  lastEventAt: string | null;
  pressurePct: number;
  databaseLabel: string | null;
  risingLatency: boolean;
  risingTimeout: boolean;
};

type Baseline = {
  latencyMs: number;
  connectionsUsed: number | null;
  connectionsMaxKey?: string;
  fallbackMax?: number;
  timeoutMs: number | null;
};

const BASELINES: Record<string, Baseline> = {
  "payment-api": {
    latencyMs: 142,
    connectionsUsed: 42,
    connectionsMaxKey: "connectionPoolMax",
    fallbackMax: 100,
    timeoutMs: 3000,
  },
  "auth-service": {
    latencyMs: 68,
    connectionsUsed: 12,
    connectionsMaxKey: "redisPoolMax",
    fallbackMax: 50,
    timeoutMs: null,
  },
  "notification-service": {
    latencyMs: 95,
    connectionsUsed: 3,
    connectionsMaxKey: "workerConcurrency",
    fallbackMax: 8,
    timeoutMs: null,
  },
};

function num(config: Record<string, unknown>, key: string): number | null {
  const value = config[key];
  return typeof value === "number" ? value : null;
}

function latestMetric(
  events: SystemEvent[],
  metrics: Set<string>,
): SystemEvent | undefined {
  return events.find(
    (event) => event.metric && metrics.has(event.metric) && typeof event.value === "number",
  );
}

export function deriveServiceHealth(
  service: Service,
  events: SystemEvent[],
): ServiceHealth {
  const serviceEvents = events.filter((event) => event.serviceId === service._id);
  const baseline = BASELINES[service._id] ?? {
    latencyMs: 110,
    connectionsUsed: null,
    timeoutMs:
      typeof service.currentConfig.timeoutMs === "number"
        ? service.currentConfig.timeoutMs
        : null,
  };

  const maxFromConfig = baseline.connectionsMaxKey
    ? num(service.currentConfig, baseline.connectionsMaxKey)
    : null;
  const connectionsMax = maxFromConfig ?? baseline.fallbackMax ?? null;

  const dbEvent = latestMetric(
    serviceEvents,
    new Set(["db_connections_pct", "database_connections"]),
  );
  const latencyEvent = latestMetric(
    serviceEvents,
    new Set(["latency_ms", "payment_latency_ms"]),
  );
  const timeoutEvent = latestMetric(
    serviceEvents,
    new Set(["payment_timeout_rate", "timeout_rate"]),
  );

  let connectionsUsed = baseline.connectionsUsed;
  let pressurePct = 18;

  if (dbEvent && typeof dbEvent.value === "number") {
    if (dbEvent.metric === "db_connections_pct" && connectionsMax !== null) {
      connectionsUsed = Math.round((dbEvent.value / 100) * connectionsMax);
      pressurePct = dbEvent.value;
    } else {
      connectionsUsed = Math.round(dbEvent.value);
      pressurePct =
        connectionsMax && connectionsMax > 0
          ? Math.round((dbEvent.value / connectionsMax) * 100)
          : Math.min(100, Math.round(dbEvent.value));
    }
  } else if (connectionsUsed !== null && connectionsMax) {
    pressurePct = Math.round((connectionsUsed / connectionsMax) * 100);
  }

  const latencyMs =
    latencyEvent && typeof latencyEvent.value === "number"
      ? Math.round(latencyEvent.value)
      : baseline.latencyMs;

  const timeoutMs =
    typeof service.currentConfig.timeoutMs === "number"
      ? service.currentConfig.timeoutMs
      : baseline.timeoutMs;

  const timeoutRate =
    timeoutEvent && typeof timeoutEvent.value === "number"
      ? timeoutEvent.value
      : service.status === "incident"
        ? 12.4
        : null;

  const recentErrorCount = serviceEvents.filter(
    (event) => event.severity === "critical" || event.type === "error",
  ).length;

  const lastEventAt = serviceEvents[0]?.timestamp ?? null;

  const statusLabel = statusToLabel(service.status, pressurePct, latencyMs);
  const risingLatency = latencyMs >= 800;
  const risingTimeout = typeof timeoutRate === "number" && timeoutRate >= 5;

  // When in incident with no live metrics yet, show the dramatic demo snapshot.
  if (service.status === "incident" && !dbEvent && !latencyEvent) {
    const poolMax = connectionsMax ?? 100;
    return {
      statusLabel: "CRITICAL",
      latencyMs: 842,
      connectionsUsed: Math.round(poolMax * 0.96),
      connectionsMax: poolMax,
      connectionsLabel: `${Math.round(poolMax * 0.96)} / ${poolMax}`,
      timeoutMs,
      timeoutRate: 12.4,
      recentErrorCount: Math.max(recentErrorCount, 1),
      lastEventAt,
      pressurePct: 96,
      databaseLabel:
        typeof service.currentConfig.database === "string"
          ? service.currentConfig.database
          : null,
      risingLatency: true,
      risingTimeout: true,
    };
  }

  const connectionsLabel =
    connectionsUsed !== null && connectionsMax !== null
      ? `${connectionsUsed} / ${connectionsMax}`
      : connectionsUsed !== null
        ? String(connectionsUsed)
        : "—";

  return {
    statusLabel,
    latencyMs,
    connectionsUsed,
    connectionsMax,
    connectionsLabel,
    timeoutMs,
    timeoutRate,
    recentErrorCount,
    lastEventAt,
    pressurePct: Math.max(0, Math.min(100, pressurePct)),
    databaseLabel:
      typeof service.currentConfig.database === "string"
        ? service.currentConfig.database
        : typeof service.currentConfig.sessionStore === "string"
          ? service.currentConfig.sessionStore
          : typeof service.currentConfig.queue === "string"
            ? service.currentConfig.queue
            : null,
    risingLatency,
    risingTimeout,
  };
}

function statusToLabel(
  status: ServiceStatus,
  pressurePct: number,
  latencyMs: number,
): ServiceHealth["statusLabel"] {
  if (status === "incident") return "CRITICAL";
  if (status === "warning" || pressurePct >= 85 || latencyMs >= 1500) {
    return "WARNING";
  }
  return "HEALTHY";
}
