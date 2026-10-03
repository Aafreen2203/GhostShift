import { z } from "zod";

export const EvidenceSourceTypeSchema = z.enum([
  "historical_incident",
  "current_signal",
  "system_state",
  "engineer_input"
]);

export const LlmIncidentAnalysisSchema = z.object({
  summary: z.string(),
  similarIncidents: z.array(
    z.object({
      incidentId: z.string(),
      whyRelevant: z.string(),
      whatHappened: z.string(),
      whatWasAttempted: z.string(),
      whatEventuallyWorked: z.string().optional()
    })
  ),
  conflicts: z.array(
    z.object({
      description: z.string(),
      evidenceSourceIds: z.array(z.string())
    })
  ),
  suggestedInvestigation: z.object({
    suggestion: z.string(),
    reason: z.string(),
    evidenceSourceIds: z.array(z.string()),
    insufficientEvidence: z.boolean()
  }),
  confidence: z.number().min(0).max(1)
});

export const LlmFreshnessAssessmentSchema = z.object({
  status: z.enum([
    "relevant",
    "potentially_outdated",
    "conflicting",
    "insufficient_information"
  ]),
  confidence: z.number().min(0).max(1),
  explanation: z.string(),
  requiresVerification: z.boolean()
});

export const ResolutionActionInputSchema = z.object({
  action: z.string(),
  result: z.string().optional(),
  description: z.string().optional()
});

export const LlmResolutionStructureSchema = z.object({
  rootCause: z.string().optional(),
  actionsTaken: z.array(ResolutionActionInputSchema),
  finalResolution: z.string().optional(),
  outcome: z.string().optional(),
  lessonsLearned: z.array(z.string()),
  reusableKnowledge: z.array(z.string())
});

export const llmIncidentAnalysisJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "summary",
    "similarIncidents",
    "conflicts",
    "suggestedInvestigation",
    "confidence"
  ],
  properties: {
    summary: { type: "string" },
    similarIncidents: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["incidentId", "whyRelevant", "whatHappened", "whatWasAttempted"],
        properties: {
          incidentId: { type: "string" },
          whyRelevant: { type: "string" },
          whatHappened: { type: "string" },
          whatWasAttempted: { type: "string" },
          whatEventuallyWorked: { type: "string" }
        }
      }
    },
    conflicts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["description", "evidenceSourceIds"],
        properties: {
          description: { type: "string" },
          evidenceSourceIds: { type: "array", items: { type: "string" } }
        }
      }
    },
    suggestedInvestigation: {
      type: "object",
      additionalProperties: false,
      required: ["suggestion", "reason", "evidenceSourceIds", "insufficientEvidence"],
      properties: {
        suggestion: { type: "string" },
        reason: { type: "string" },
        evidenceSourceIds: { type: "array", items: { type: "string" } },
        insufficientEvidence: { type: "boolean" }
      }
    },
    confidence: { type: "number" }
  }
} as const;

export const llmFreshnessJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["status", "confidence", "explanation", "requiresVerification"],
  properties: {
    status: {
      type: "string",
      enum: ["relevant", "potentially_outdated", "conflicting", "insufficient_information"]
    },
    confidence: { type: "number" },
    explanation: { type: "string" },
    requiresVerification: { type: "boolean" }
  }
} as const;

export const llmResolutionJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["actionsTaken", "lessonsLearned", "reusableKnowledge"],
  properties: {
    rootCause: { type: "string" },
    actionsTaken: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["action"],
        properties: {
          action: { type: "string" },
          result: { type: "string" },
          description: { type: "string" }
        }
      }
    },
    finalResolution: { type: "string" },
    outcome: { type: "string" },
    lessonsLearned: { type: "array", items: { type: "string" } },
    reusableKnowledge: { type: "array", items: { type: "string" } }
  }
} as const;
