import type { MongoSearchSource } from "./constants";

export type TraceMatch = {
  incidentId: string;
  title?: string;
  score: number;
  source?: MongoSearchSource;
};

export type TraceAggregation = {
  action: string;
  totalAttempts: number;
  temporary: number;
  successful: number;
  failed: number;
};

export type MongoTraceData = {
  queryLabel?: string;
  searchSource?: MongoSearchSource;
  matches: TraceMatch[];
  aggregations?: TraceAggregation[];
  actionsRetrieved?: number;
  evidenceIds?: string[];
  aiSource?: "evidence_only" | "openai_grounded" | string;
};
