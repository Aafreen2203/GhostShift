import type { CurrentIncident, HistoricalIncident } from "../../src/ai/types/incident.js";

export const paymentTimeoutIncident: CurrentIncident = {
  id: "INC-CURRENT",
  title: "Payment API intermittently timing out",
  description: "Payment API requests are intermittently timing out for checkout traffic.",
  service: "payment-api",
  severity: "high",
  detectedAt: "2026-10-03T12:00:00.000Z",
  errorMessages: ["timeout", "payment api intermittent timeout"],
  systemState: {
    apiLatencyMs: 2400,
    errorRate: 0.18,
    databaseConnectionCount: 97,
    databaseConnectionLimit: 100,
    serviceVersion: "payments-2.4.1"
  },
  signals: [
    { name: "latency_ms", value: 2400 },
    { name: "error_rate", value: 0.18 }
  ]
};

export const historicalPoolExhaustion: HistoricalIncident = {
  id: "INC-017",
  title: "Payment API intermittent timeout",
  description: "Payment API intermittent timeout under checkout load.",
  service: "payment-api",
  occurredAt: "2026-03-01T09:00:00.000Z",
  symptoms: ["timeout", "payment api intermittent timeout"],
  systemState: {
    databaseConnectionCount: 95,
    databaseConnectionLimit: 100,
    apiLatencyMs: 2100,
    errorRate: 0.15,
    serviceVersion: "payments-2.4.1"
  },
  attemptedActions: [
    {
      action: "Restarted payment container",
      result: "temporary",
      description: "API recovered for approximately 20 minutes",
      outcome: "did_not_resolve_root_cause"
    },
    {
      action: "Increase timeout",
      result: "failed",
      description: "Timeouts continued"
    }
  ],
  rootCause: "Database connection pool exhaustion",
  finalResolution: "Increased pool capacity and cleared stale connections",
  outcome: "resolved",
  tags: ["database", "connection-pool"]
};

export const historicalRestartOnly: HistoricalIncident = {
  id: "INC-018",
  title: "Payment API timeouts after deploy",
  description: "Intermittent payment timeouts",
  service: "payment-api",
  occurredAt: "2026-04-12T11:00:00.000Z",
  symptoms: ["timeout"],
  systemState: {
    databaseConnectionCount: 96,
    databaseConnectionLimit: 100
  },
  attemptedActions: [
    {
      action: "Restart container",
      result: "temporary",
      description: "Brief recovery"
    }
  ]
};

export const historicalRestartFailed: HistoricalIncident = {
  id: "INC-019",
  title: "Checkout timeouts",
  service: "payment-api",
  occurredAt: "2026-05-02T08:00:00.000Z",
  symptoms: ["timeout"],
  systemState: {
    databaseConnectionCount: 94,
    databaseConnectionLimit: 100
  },
  attemptedActions: [
    {
      action: "Restart container",
      result: "failed"
    }
  ]
};

export const historicalRestartTemporaryAgain: HistoricalIncident = {
  id: "INC-020",
  title: "Payment latency spike",
  service: "payment-api",
  occurredAt: "2026-06-18T08:00:00.000Z",
  symptoms: ["timeout"],
  systemState: {
    databaseConnectionCount: 98,
    databaseConnectionLimit: 100
  },
  attemptedActions: [
    {
      action: "Restart container",
      result: "temporary"
    }
  ]
};

export const historicalSuccessfulPoolFix: HistoricalIncident = {
  ...historicalPoolExhaustion,
  id: "INC-021",
  attemptedActions: [
    ...(historicalPoolExhaustion.attemptedActions ?? []),
    {
      action: "Increased pool capacity and cleared stale connections",
      result: "successful",
      description: "Payment API recovered"
    }
  ]
};

export const currentWithLargerPool: CurrentIncident = {
  ...paymentTimeoutIncident,
  id: "INC-CURRENT-LARGE-POOL",
  systemState: {
    ...paymentTimeoutIncident.systemState,
    databaseConnectionCount: 497,
    databaseConnectionLimit: 500,
    deploymentVersion: "2026.09.12"
  }
};

export const historicalSmallPool: HistoricalIncident = {
  ...historicalPoolExhaustion,
  id: "INC-022",
  systemState: {
    databaseConnectionCount: 95,
    databaseConnectionLimit: 100,
    deploymentVersion: "2025.11.02"
  }
};
