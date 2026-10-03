import { buildIncidentAnalysisPrompt } from "../prompts/incidentAnalysis.js";
import type { LLMProvider } from "../providers/types.js";
import type {
  IncidentAnalysis,
  InvestigationSuggestion,
  KnowledgeConflict,
  LlmIncidentAnalysis,
  SimilarIncidentEvidence,
  SuccessfulResolution
} from "../types/analysis.js";
import type { Evidence } from "../types/evidence.js";
import type { CurrentIncident, HistoricalIncident } from "../types/incident.js";
import { clampConfidence, parseLlmOutput } from "../validation/parse.js";
import { LlmIncidentAnalysisSchema, llmIncidentAnalysisJsonSchema } from "../validation/schemas.js";
import { aggregatePreviousActions } from "./actionAggregator.js";
import { FreshnessAnalyzer } from "./freshnessAnalyzer.js";
import { rankHistoricalIncidents } from "./similarity.js";

const RELEVANCE_THRESHOLD = 0.35;

export class IncidentAnalyzer {
  private readonly freshnessAnalyzer: FreshnessAnalyzer;

  constructor(private readonly provider: LLMProvider) {
    this.freshnessAnalyzer = new FreshnessAnalyzer(provider);
  }

  async analyzeIncident(
    currentIncident: CurrentIncident,
    historicalIncidents: HistoricalIncident[]
  ): Promise<IncidentAnalysis> {
    const ranked = rankHistoricalIncidents(currentIncident, historicalIncidents);
    const previousAttempts = aggregatePreviousActions(historicalIncidents);
    const allowedIds = new Set(historicalIncidents.map((incident) => incident.id));
    if (currentIncident.id) {
      allowedIds.add(currentIncident.id);
    }

    const relevantRanked = ranked.filter(
      (item) => item.similarityScore >= RELEVANCE_THRESHOLD || ranked.length <= 3
    );

    const freshnessAssessment = await Promise.all(
      relevantRanked.map(({ incident }) =>
        this.freshnessAnalyzer.assessKnowledgeFreshness(currentIncident, incident)
      )
    );

    const successfulResolutions = collectSuccessfulResolutions(historicalIncidents);
    const llm = await this.provider.generateStructuredOutput<LlmIncidentAnalysis>(
      buildIncidentAnalysisPrompt({
        currentIncident,
        rankedHistoricalIncidents: relevantRanked.map(({ incident, similarityScore }) => ({
          id: incident.id,
          title: incident.title,
          description: incident.description,
          service: incident.service,
          occurredAt: incident.occurredAt,
          symptoms: incident.symptoms,
          systemState: incident.systemState,
          attemptedActions: incident.attemptedActions,
          rootCause: incident.rootCause,
          finalResolution: incident.finalResolution,
          outcome: incident.outcome,
          similarityScore
        })),
        previousAttempts,
        successfulResolutions: successfulResolutions.map((item) => ({
          incidentId: item.incidentId,
          rootCause: item.rootCause,
          finalResolution: item.finalResolution,
          outcome: item.outcome
        })),
        freshnessAssessment: freshnessAssessment.map((item) => ({
          historicalIncidentId: item.historicalIncidentId,
          status: item.status,
          differences: item.differences,
          requiresVerification: item.requiresVerification
        }))
      }),
      { name: "incident_analysis", schema: llmIncidentAnalysisJsonSchema }
    );

    const parsed = parseLlmOutput(LlmIncidentAnalysisSchema, llm, "incident analysis");
    const similarIncidents = mergeSimilarIncidents(parsed, relevantRanked, allowedIds);
    const historicalEvidence = similarIncidents.flatMap((item) => item.evidence);
    const conflicts = mergeConflicts(parsed, freshnessAssessment, allowedIds, currentIncident.id);
    const suggestedInvestigation = mergeSuggestion(
      parsed,
      currentIncident,
      historicalIncidents,
      allowedIds
    );

    return {
      summary: parsed.summary,
      similarIncidents,
      historicalEvidence,
      previousAttempts,
      successfulResolutions,
      freshnessAssessment,
      conflicts,
      suggestedInvestigation,
      confidence: historicalIncidents.length === 0 ? 0 : clampConfidence(parsed.confidence)
    };
  }
}

function collectSuccessfulResolutions(historicalIncidents: HistoricalIncident[]): SuccessfulResolution[] {
  return historicalIncidents.flatMap((incident) => {
    const hasSuccessfulAction = (incident.attemptedActions ?? []).some(
      (action) => action.result === "successful"
    );
    const hasResolution = Boolean(incident.finalResolution || incident.rootCause);
    if (!hasSuccessfulAction && !hasResolution) {
      return [];
    }
    const evidence: Evidence[] = [
      {
        sourceId: incident.id,
        sourceType: "historical_incident",
        claim: incident.finalResolution
          ? `Historical incident ${incident.id} recorded a successful resolution.`
          : `Historical incident ${incident.id} recorded a successful action or root-cause finding.`,
        supportingData: {
          rootCause: incident.rootCause,
          finalResolution: incident.finalResolution,
          outcome: incident.outcome,
          successfulActions: (incident.attemptedActions ?? []).filter((action) => action.result === "successful")
        }
      }
    ];
    return [
      {
        incidentId: incident.id,
        rootCause: incident.rootCause,
        finalResolution: incident.finalResolution,
        outcome: incident.outcome,
        evidence
      }
    ];
  });
}

function mergeSimilarIncidents(
  parsed: LlmIncidentAnalysis,
  ranked: Array<{ incident: HistoricalIncident; similarityScore: number }>,
  allowedIds: Set<string>
): SimilarIncidentEvidence[] {
  const explanations = new Map(
    parsed.similarIncidents
      .filter((item) => allowedIds.has(item.incidentId))
      .map((item) => [item.incidentId, item])
  );

  return ranked
    .filter(({ incident }) => allowedIds.has(incident.id))
    .map(({ incident, similarityScore }) => {
      const fromLlm = explanations.get(incident.id);
      const evidence: Evidence[] = [
        {
          sourceId: incident.id,
          sourceType: "historical_incident",
          claim: fromLlm?.whyRelevant ?? `Historical incident ${incident.id} was ranked as related.`,
          supportingData: {
            similarityScore,
            attemptedActions: incident.attemptedActions,
            rootCause: incident.rootCause,
            finalResolution: incident.finalResolution
          }
        }
      ];
      return {
        incidentId: incident.id,
        whyRelevant: fromLlm?.whyRelevant ?? `Shared service or symptoms with ${incident.id}.`,
        similarityScore,
        whatHappened:
          fromLlm?.whatHappened ??
          incident.description ??
          incident.title ??
          "No narrative was supplied for this historical incident.",
        whatWasAttempted:
          fromLlm?.whatWasAttempted ??
          ((incident.attemptedActions ?? [])
            .map((action) => `${action.action} (${action.result})`)
            .join("; ") ||
            "No attempted actions were recorded."),
        whatEventuallyWorked: fromLlm?.whatEventuallyWorked ?? incident.finalResolution,
        evidence
      };
    });
}

function mergeConflicts(
  parsed: LlmIncidentAnalysis,
  freshness: IncidentAnalysis["freshnessAssessment"],
  allowedIds: Set<string>,
  currentId?: string
): KnowledgeConflict[] {
  const fromFreshness: KnowledgeConflict[] = freshness
    .filter((item) => item.status === "conflicting" || item.status === "potentially_outdated")
    .map((item) => ({
      description:
        item.status === "conflicting"
          ? `Historical knowledge from ${item.historicalIncidentId} may conflict with the current system state.`
          : `Historical knowledge from ${item.historicalIncidentId} may be outdated.`,
      evidence: [
        {
          sourceId: item.historicalIncidentId,
          sourceType: "historical_incident",
          claim: item.explanation,
          supportingData: { differences: item.differences, status: item.status }
        }
      ]
    }));

  const fromLlm: KnowledgeConflict[] = parsed.conflicts.flatMap((conflict) => {
    const sourceIds = conflict.evidenceSourceIds.filter((id) => allowedIds.has(id) || id === currentId);
    if (sourceIds.length === 0) {
      return [];
    }
    return [
      {
        description: conflict.description,
        evidence: sourceIds.map((sourceId) => ({
          sourceId,
          sourceType: (sourceId === currentId ? "current_signal" : "historical_incident") as Evidence["sourceType"],
          claim: conflict.description
        }))
      }
    ];
  });

  return [...fromFreshness, ...fromLlm];
}

function mergeSuggestion(
  parsed: LlmIncidentAnalysis,
  currentIncident: CurrentIncident,
  historicalIncidents: HistoricalIncident[],
  allowedIds: Set<string>
): InvestigationSuggestion {
  const groundedIds = parsed.suggestedInvestigation.evidenceSourceIds.filter((id) => allowedIds.has(id));
  const insufficient =
    historicalIncidents.length === 0 || parsed.suggestedInvestigation.insufficientEvidence || groundedIds.length === 0;

  const evidence: Evidence[] = groundedIds.map((sourceId) => ({
    sourceId,
    sourceType: sourceId === currentIncident.id ? "current_signal" : "historical_incident",
    claim: parsed.suggestedInvestigation.reason
  }));

  if (currentIncident.systemState) {
    evidence.push({
      sourceId: currentIncident.id ?? "current-incident",
      sourceType: "system_state",
      claim: "Current system state was supplied for comparison.",
      supportingData: currentIncident.systemState
    });
  }

  if (insufficient) {
    return {
      suggestion:
        historicalIncidents.length === 0
          ? "Insufficient historical evidence. Investigate from current signals only; do not assume a historical fix applies."
          : parsed.suggestedInvestigation.suggestion,
      reason:
        historicalIncidents.length === 0
          ? "No historical incidents were supplied to the AI layer."
          : parsed.suggestedInvestigation.reason,
      evidence,
      insufficientEvidence: true
    };
  }

  return {
    suggestion: parsed.suggestedInvestigation.suggestion,
    reason: parsed.suggestedInvestigation.reason,
    evidence,
    insufficientEvidence: false
  };
}

export async function analyzeIncident(
  currentIncident: CurrentIncident,
  historicalIncidents: HistoricalIncident[],
  provider: LLMProvider
): Promise<IncidentAnalysis> {
  return new IncidentAnalyzer(provider).analyzeIncident(currentIncident, historicalIncidents);
}
