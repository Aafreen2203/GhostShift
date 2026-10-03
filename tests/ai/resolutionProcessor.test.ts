import { describe, expect, it } from "vitest";
import { GhostShiftAI } from "../../src/ai/index.js";
import type { LLMProvider } from "../../src/ai/providers/types.js";
import { paymentTimeoutIncident } from "./fixtures.js";

describe("ResolutionProcessor", () => {
  it("converts engineer resolution input into a structured record", async () => {
    const provider: LLMProvider = {
      async generateStructuredOutput() {
        return {
          rootCause: "Database connection pool exhaustion",
          actionsTaken: [
            { action: "Increased connection pool size" },
            { action: "Cleared stale connections" }
          ],
          finalResolution: "Increased pool capacity and cleared stale connections",
          outcome: "Payment API recovered",
          lessonsLearned: [
            "Near-limit connection counts can look like application timeouts.",
            "Restarting the container did not address pool exhaustion."
          ],
          reusableKnowledge: [
            "When payment-api latency rises with connections near the limit, inspect pool health before restarting."
          ]
        };
      }
    };

    const ai = new GhostShiftAI(provider);
    const record = await ai.processResolution(paymentTimeoutIncident, {
      rootCause: "Database connection pool exhaustion",
      actions: ["Increased connection pool size", "Cleared stale connections"],
      outcome: "Payment API recovered"
    });

    expect(record.incidentId).toBe("INC-CURRENT");
    expect(record.service).toBe("payment-api");
    expect(record.rootCause).toBe("Database connection pool exhaustion");
    expect(record.actionsTaken.map((item) => item.action)).toEqual([
      "Increased connection pool size",
      "Cleared stale connections"
    ]);
    expect(record.outcome).toBe("Payment API recovered");
    expect(record.evidence[0]?.sourceType).toBe("engineer_input");
    expect(record.lessonsLearned.length).toBeGreaterThan(0);
    expect(record.reusableKnowledge.length).toBeGreaterThan(0);
    expect(record.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
