/**
 * WORKSTREAM 2 — AI / Retrieval
 *
 * TODO: Build an evidence-grounded incident brief from retrieved incidents
 * and their actions. The brief should be able to say "we tried that already"
 * by citing failed, temporary, and resolved actions.
 * Wire this into POST /api/agent/analyse and components/AgentBrief.tsx.
 * Do not call an LLM from this stub, and do not invent a brief.
 */

export type IncidentBrief = {
  incidentId: string;
  summary: string;
  triedAlready: string[];
  evidenceIds: string[];
};

export async function analyseIncident(incidentId: string): Promise<IncidentBrief> {
  void incidentId;
  throw new Error("Incident analysis is not implemented yet.");
}
