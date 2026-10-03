import type { Evidence } from "./evidence";
import type { ActionResult, SystemStateDifference } from "./incident";

export type FreshnessStatus =
  | "relevant"
  | "potentially_outdated"
  | "conflicting"
  | "insufficient_information";

export interface FreshnessAssessment {
  historicalIncidentId: string;
  status: FreshnessStatus;
  confidence: number;
  differences: string[];
  structuredDifferences: SystemStateDifference[];
  explanation: string;
  requiresVerification: boolean;
  ageDays?: number;
}

export interface SimilarIncidentEvidence {
  incidentId: string;
  whyRelevant: string;
  similarityScore?: number;
  whatHappened: string;
  whatWasAttempted: string;
  whatEventuallyWorked?: string;
  evidence: Evidence[];
}

export interface ActionAttemptSummary {
  action: string;
  totalAttempts: number;
  failed: number;
  temporary: number;
  successful: number;
  unknown: number;
  incidentIds: string[];
  summary: string;
}

export interface SuccessfulResolution {
  incidentId: string;
  rootCause?: string;
  finalResolution?: string;
  outcome?: string;
  evidence: Evidence[];
}

export interface KnowledgeConflict {
  description: string;
  evidence: Evidence[];
}

export interface InvestigationSuggestion {
  suggestion: string;
  reason: string;
  evidence: Evidence[];
  insufficientEvidence: boolean;
}

export interface IncidentAnalysis {
  summary: string;
  similarIncidents: SimilarIncidentEvidence[];
  historicalEvidence: Evidence[];
  previousAttempts: ActionAttemptSummary[];
  successfulResolutions: SuccessfulResolution[];
  freshnessAssessment: FreshnessAssessment[];
  conflicts: KnowledgeConflict[];
  suggestedInvestigation: InvestigationSuggestion;
  confidence: number;
}

export interface LlmIncidentAnalysis {
  summary: string;
  similarIncidents: Array<{
    incidentId: string;
    whyRelevant: string;
    whatHappened: string;
    whatWasAttempted: string;
    whatEventuallyWorked?: string;
  }>;
  conflicts: Array<{
    description: string;
    evidenceSourceIds: string[];
  }>;
  suggestedInvestigation: {
    suggestion: string;
    reason: string;
    evidenceSourceIds: string[];
    insufficientEvidence: boolean;
  };
  confidence: number;
}

export interface LlmFreshnessAssessment {
  status: FreshnessStatus;
  confidence: number;
  explanation: string;
  requiresVerification: boolean;
}

export type { ActionResult };
