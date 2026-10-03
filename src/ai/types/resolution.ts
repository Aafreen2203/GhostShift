import type { Evidence } from "./evidence";

export interface ResolutionActionInput {
  action: string;
  result?: string;
  description?: string;
}

export interface ResolutionInput {
  rootCause?: string;
  actions?: Array<string | ResolutionActionInput>;
  outcome?: string;
  finalResolution?: string;
  notes?: string;
}

export interface ResolutionRecord {
  incidentId?: string;
  service?: string;
  rootCause?: string;
  actionsTaken: ResolutionActionInput[];
  finalResolution?: string;
  outcome?: string;
  evidence: Evidence[];
  lessonsLearned: string[];
  reusableKnowledge: string[];
  timestamp: string;
}

export interface LlmResolutionStructure {
  rootCause?: string;
  actionsTaken: ResolutionActionInput[];
  finalResolution?: string;
  outcome?: string;
  lessonsLearned: string[];
  reusableKnowledge: string[];
}
