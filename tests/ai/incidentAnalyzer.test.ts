import { describe, expect, it } from "vitest";
import { GhostShiftAI } from "../../src/ai/index.js";
import type { LLMProvider } from "../../src/ai/providers/types.js";
import type { LlmIncidentAnalysis, LlmFreshnessAssessment } from "../../src/ai/types/analysis.js";
import {
  historicalPoolExhaustion,
  historicalRestartFailed,
  historicalRestartOnly,
  historicalRestartTemporaryAgain,
  historicalSuccessfulPoolFix,
  paymentTimeoutIncident
} from "./fixtures.js";

function mockProvider(analysis: LlmIncidentAnalysis, freshness?: LlmFreshnessAssessment): LLMProvider {
  return {
    async generateStructuredOutput<T>(prompt: string): Promise<T> {
      if (prompt.includes("assessing whether historical incident knowledge")) {
        return {
          status: "relevant",
          confidence: 0.8,
          explanation: "Comparable metrics are close; verify before reuse.",
          requiresVerification: true,
          ...freshness
        } as T;
      }
      return analysis as T;
    }
  };
}

const groundedAnalysis: LlmIncidentAnalysis = {
  summary:
    "Payment API is intermittently timing out with high latency and database connections near the configured limit.",
  similarIncidents: [
    {
      incidentId: "INC-017",
      whyRelevant:
        "The current incident resembles INC-017 because both show intermittent Payment API timeouts and near-limit database connections.",
      whatHappened: "INC-017 had Payment API timeouts while connections were 95/100.",
      whatWasAttempted: "Restart container was temporary; increasing timeout failed.",
      whatEventuallyWorked: "Increased pool capacity and cleared stale connections."
    }
  ],
  conflicts: [],
  suggestedInvestigation: {
    suggestion:
      "Check the current database connection pool usage and identify whether stale connections are exhausting the pool.",
    reason:
      "The current incident shows 97/100 active connections, while similar historical incidents were caused by connection-pool exhaustion.",
    evidenceSourceIds: ["INC-017", "INC-CURRENT"],
    insufficientEvidence: false
  },
  confidence: 0.86
};

describe("IncidentAnalyzer", () => {
  it("identifies a similar historical incident as relevant evidence", async () => {
    const ai = new GhostShiftAI(mockProvider(groundedAnalysis));
    const result = await ai.analyzeIncident(paymentTimeoutIncident, [historicalPoolExhaustion]);

    expect(result.similarIncidents[0]?.incidentId).toBe("INC-017");
    expect(result.similarIncidents[0]?.similarityScore ?? 0).toBeGreaterThan(0.6);
    expect(result.historicalEvidence.some((item) => item.sourceId === "INC-017")).toBe(true);
    expect(result.suggestedInvestigation.suggestion.toLowerCase()).not.toBe("increase the connection pool.");
    expect(result.suggestedInvestigation.evidence.some((item) => item.sourceId === "INC-017")).toBe(true);
    expect(result.suggestedInvestigation.insufficientEvidence).toBe(false);
  });

  it("identifies a historical failed action as failed", async () => {
    const ai = new GhostShiftAI(mockProvider(groundedAnalysis));
    const result = await ai.analyzeIncident(paymentTimeoutIncident, [historicalPoolExhaustion]);
    const timeoutAttempt = result.previousAttempts.find((item) => item.action.includes("increase timeout"));

    expect(timeoutAttempt?.failed).toBe(1);
    expect(timeoutAttempt?.successful).toBe(0);
    expect(timeoutAttempt?.summary).toContain("No effect / failed: 1");
  });

  it("identifies a temporary action as temporary", async () => {
    const ai = new GhostShiftAI(mockProvider(groundedAnalysis));
    const result = await ai.analyzeIncident(paymentTimeoutIncident, [
      historicalPoolExhaustion,
      historicalRestartOnly,
      historicalRestartFailed,
      historicalRestartTemporaryAgain
    ]);
    const restart = result.previousAttempts.find((item) => item.action.includes("restart"));

    expect(restart?.totalAttempts).toBe(4);
    expect(restart?.temporary).toBe(3);
    expect(restart?.failed).toBe(1);
    expect(restart?.successful).toBe(0);
    expect(restart?.summary).toContain("Temporary recovery: 3");
    expect(restart?.summary).toContain("Permanent resolution: 0");
  });

  it("identifies a successful historical resolution", async () => {
    const ai = new GhostShiftAI(mockProvider(groundedAnalysis));
    const result = await ai.analyzeIncident(paymentTimeoutIncident, [historicalSuccessfulPoolFix]);

    expect(result.successfulResolutions[0]?.incidentId).toBe("INC-021");
    expect(result.successfulResolutions[0]?.rootCause).toBe("Database connection pool exhaustion");
    expect(result.successfulResolutions[0]?.finalResolution).toContain("pool capacity");
    expect(result.successfulResolutions[0]?.evidence[0]?.sourceId).toBe("INC-021");
  });

  it("does not invent a resolution when evidence is insufficient", async () => {
    const inventing: LlmIncidentAnalysis = {
      summary: "Something is wrong with payments.",
      similarIncidents: [
        {
          incidentId: "INC-FAKE",
          whyRelevant: "Invented",
          whatHappened: "Invented outage",
          whatWasAttempted: "Invented restart",
          whatEventuallyWorked: "Invented pool increase"
        }
      ],
      conflicts: [],
      suggestedInvestigation: {
        suggestion: "Increase the connection pool immediately.",
        reason: "Because I assume that is the cause.",
        evidenceSourceIds: ["INC-FAKE"],
        insufficientEvidence: false
      },
      confidence: 0.99
    };

    const ai = new GhostShiftAI(mockProvider(inventing));
    const result = await ai.analyzeIncident(paymentTimeoutIncident, []);

    expect(result.similarIncidents).toHaveLength(0);
    expect(result.successfulResolutions).toHaveLength(0);
    expect(result.historicalEvidence).toHaveLength(0);
    expect(result.suggestedInvestigation.insufficientEvidence).toBe(true);
    expect(result.suggestedInvestigation.suggestion).toMatch(/insufficient historical evidence/i);
    expect(result.confidence).toBe(0);
  });
});
