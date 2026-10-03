import { describe, expect, it } from "vitest";
import { GhostShiftAI } from "../../src/ai/index.js";
import { determineFreshnessStatus } from "../../src/ai/services/freshnessAnalyzer.js";
import type { LLMProvider } from "../../src/ai/providers/types.js";
import { currentWithLargerPool, historicalSmallPool, paymentTimeoutIncident } from "./fixtures.js";

describe("FreshnessAnalyzer", () => {
  it("warns when historical and current system configuration differ", async () => {
    const provider: LLMProvider = {
      async generateStructuredOutput() {
        return {
          status: "relevant",
          confidence: 0.91,
          explanation:
            "The historical resolution may still be relevant, but the infrastructure configuration has changed significantly.",
          requiresVerification: false
        };
      }
    };

    const ai = new GhostShiftAI(provider);
    const result = await ai.assessKnowledgeFreshness(currentWithLargerPool, historicalSmallPool);

    expect(result.status).toBe("potentially_outdated");
    expect(result.requiresVerification).toBe(true);
    expect(result.differences.some((item) => item.includes("100") && item.includes("500"))).toBe(true);
    expect(result.historicalIncidentId).toBe("INC-022");
  });

  it("does not mark knowledge outdated solely because an incident is old when state matches", () => {
    const status = determineFreshnessStatus([], 3);
    expect(status).toBe("relevant");
  });

  it("returns insufficient_information when states cannot be compared", async () => {
    const provider: LLMProvider = {
      async generateStructuredOutput() {
        return {
          status: "relevant",
          confidence: 0.2,
          explanation: "Not enough comparable fields.",
          requiresVerification: true
        };
      }
    };

    const ai = new GhostShiftAI(provider);
    const result = await ai.assessKnowledgeFreshness(
      { ...paymentTimeoutIncident, systemState: undefined },
      { ...historicalSmallPool, systemState: undefined }
    );

    expect(result.status).toBe("insufficient_information");
    expect(result.differences).toHaveLength(0);
  });
});
