import { compareKnowledgeFreshness, summarizeActions } from "@/lib/aggregation";
import {
  buildTriedAlreadySummaries,
  toCurrentIncident,
  toHistoricalIncident,
} from "@/lib/ai-adapters";
import { COLLECTIONS, getCollection } from "@/lib/mongodb";
import { searchSimilarIncidents } from "@/lib/vector-search";
import type { IncidentAction } from "@/types/action";
import type { Incident } from "@/types/incident";
import type { Service } from "@/types/service";

export type TriedAlreadyStat = {
  action: string;
  totalAttempts: number;
  failed: number;
  temporary: number;
  successful: number;
  summary: string;
  incidentIds: string[];
};

export type Recommendation = {
  text: string;
  /** 0–1 evidence-grounded confidence for this suggestion */
  confidence: number;
  evidenceIncidentId?: string;
  basis: "historical_resolution" | "ai_investigation";
};

export type IncidentBrief = {
  incidentId: string;
  summary: string;
  triedAlready: string[];
  triedAlreadyStats: TriedAlreadyStat[];
  /** @deprecated Prefer recommendations — kept for older clients as plain strings */
  recommendedNext: string[];
  recommendations: Recommendation[];
  /** 0–1 overall confidence in the investigation brief */
  confidence: number;
  evidenceIds: string[];
  freshnessOutdated: boolean;
  freshnessNotes: string[];
  similar: Array<{
    incidentId: string;
    title: string;
    score: number;
    source: string;
    historicalRootCause?: string;
  }>;
  aiSource: "evidence_only" | "openai_grounded";
  uncertaintyNote?: string;
};

function mapActionsToLines(actions: IncidentAction[]): string[] {
  return actions.map((action) => {
    const tag =
      action.outcome === "failed"
        ? "FAILED"
        : action.outcome === "temporary"
          ? "TEMPORARY"
          : "RESOLVED";
    return `[${tag}] ${action.action} → ${action.result} (incident ${action.incidentId})`;
  });
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/** Normalize similarity scores (cosine 0–1, or percent-like values). */
function normalizeScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  if (score > 1 && score <= 100) return clamp01(score / 100);
  return clamp01(score);
}

function roundConfidence(value: number): number {
  return Math.round(clamp01(value) * 100) / 100;
}

function deriveBriefConfidence(args: {
  similar: Array<{ score: number }>;
  freshnessOutdated?: boolean;
  distinctRootCauses: number;
  aiConfidence?: number;
}): number {
  if (typeof args.aiConfidence === "number") {
    return roundConfidence(args.aiConfidence);
  }
  if (args.similar.length === 0) return 0.12;

  const top = normalizeScore(args.similar[0]!.score);
  const support = Math.min(args.similar.length, 4) * 0.05;
  let confidence = top * 0.72 + support + 0.12;
  if (args.freshnessOutdated) confidence *= 0.78;
  if (args.distinctRootCauses > 1) confidence *= 0.82;
  return roundConfidence(confidence);
}

function buildResolutionRecommendations(
  actions: IncidentAction[],
  scoreByIncident: Map<string, number>,
  fallbackScore: number,
): Recommendation[] {
  return actions
    .filter((action) => action.outcome === "resolved")
    .map((action) => {
      const matchScore = scoreByIncident.get(action.incidentId);
      const confidence = roundConfidence(
        normalizeScore(matchScore ?? fallbackScore) * 0.92 + 0.05,
      );
      return {
        text: `Historical resolution on ${action.incidentId}: ${action.action}`,
        confidence,
        evidenceIncidentId: action.incidentId,
        basis: "historical_resolution" as const,
      };
    })
    .sort((a, b) => b.confidence - a.confidence);
}

async function maybeEnrichWithOpenAI(args: {
  incident: Incident;
  service: Service | null;
  historical: ReturnType<typeof toHistoricalIncident>[];
  baseSummary: string;
}): Promise<{
  summary: string;
  aiSource: IncidentBrief["aiSource"];
  uncertaintyNote?: string;
  confidence?: number;
  aiSuggestion?: Recommendation;
}> {
  if (!process.env.OPENAI_API_KEY) {
    return {
      summary: args.baseSummary,
      aiSource: "evidence_only",
      uncertaintyNote:
        args.historical.length > 1
          ? "Several historical incidents show similar symptoms but may have different root causes. Treat historical root causes as evidence, not confirmation."
          : undefined,
    };
  }

  try {
    const { createGhostShiftAI } = await import("@/src/ai");
    const ai = createGhostShiftAI();
    const analysis = await ai.analyzeIncident(
      toCurrentIncident(args.incident, args.service),
      args.historical,
    );

    const suggestion = analysis.suggestedInvestigation?.suggestion;
    const conflict = analysis.conflicts?.[0]?.description;
    const confidence = roundConfidence(analysis.confidence);

    const summary = [
      analysis.summary,
      suggestion ? `Suggested investigation: ${suggestion}` : "",
      "GhostShift does not claim a definite current root cause. Review historical evidence before acting.",
    ]
      .filter(Boolean)
      .join(" ");

    return {
      summary,
      aiSource: "openai_grounded",
      uncertaintyNote: conflict,
      confidence,
      aiSuggestion: suggestion
        ? {
            text: suggestion,
            confidence,
            basis: "ai_investigation",
            evidenceIncidentId:
              analysis.suggestedInvestigation.evidence?.[0]?.sourceId,
          }
        : undefined,
    };
  } catch (error) {
    console.error(
      "[agent] OpenAI enrichment failed; using evidence-only brief:",
      error instanceof Error ? error.message : error,
    );
    return {
      summary: args.baseSummary,
      aiSource: "evidence_only",
      uncertaintyNote:
        "AI enrichment unavailable. Showing MongoDB evidence only.",
    };
  }
}

/**
 * Evidence-grounded brief assembled from MongoDB memory.
 * Optional OpenAI enrichment uses only retrieved evidence; numbers always come from MongoDB.
 */
export async function analyseIncident(incidentId: string): Promise<IncidentBrief> {
  const incidents = await getCollection<Incident>(COLLECTIONS.incidents);
  const actions = await getCollection<IncidentAction>(COLLECTIONS.actions);
  const services = await getCollection<Service>(COLLECTIONS.services);

  const incident = await incidents.findOne({ _id: incidentId });
  if (!incident) {
    throw new Error("Incident not found");
  }

  const service = await services.findOne({ _id: incident.serviceId });
  const query = [
    incident.title,
    incident.summary,
    ...incident.symptoms,
    incident.rootCause ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  const similar = (await searchSimilarIncidents(query, 5)).filter(
    (hit) => hit.incident._id !== incidentId,
  );

  const evidenceIds = [incidentId, ...similar.map((hit) => hit.incident._id)];
  const relatedActions = await actions
    .find({ incidentId: { $in: evidenceIds } })
    .sort({ timestamp: 1 })
    .toArray();

  const actionsByIncident = new Map<string, IncidentAction[]>();
  for (const action of relatedActions) {
    const list = actionsByIncident.get(action.incidentId) ?? [];
    list.push(action);
    actionsByIncident.set(action.incidentId, list);
  }

  const historicalForAi = similar.map((hit) =>
    toHistoricalIncident(
      hit.incident,
      actionsByIncident.get(hit.incident._id) ?? [],
      hit.score,
    ),
  );
  if (incident.status === "resolved") {
    historicalForAi.unshift(
      toHistoricalIncident(incident, actionsByIncident.get(incident._id) ?? []),
    );
  }

  const triedAlreadyStats = buildTriedAlreadySummaries(historicalForAi).map(
    (stat) => ({
      action: stat.action,
      totalAttempts: stat.totalAttempts,
      failed: stat.failed,
      temporary: stat.temporary,
      successful: stat.successful,
      summary: stat.summary,
      incidentIds: stat.incidentIds,
    }),
  );

  const triedAlready = [
    ...triedAlreadyStats.map(
      (stat) =>
        `WE TRIED THAT ALREADY: "${stat.action}" — attempts ${stat.totalAttempts}, temporary ${stat.temporary}, permanent resolutions ${stat.successful}.`,
    ),
    ...mapActionsToLines(relatedActions),
  ];

  const scoreByIncident = new Map(
    similar.map((hit) => [hit.incident._id, hit.score]),
  );
  const topScore = similar[0] ? normalizeScore(similar[0].score) : 0.35;
  const resolvedActions = relatedActions.filter(
    (action) => action.outcome === "resolved",
  );
  let recommendations = buildResolutionRecommendations(
    resolvedActions,
    scoreByIncident,
    topScore,
  );

  const actionSummary = await summarizeActions(incidentId);
  const distinctRootCauses = new Set(
    similar
      .map((hit) => hit.incident.rootCause)
      .filter((value): value is string => Boolean(value)),
  );

  const summaryBits = [
    `Incident "${incident.title}" on ${incident.serviceId}.`,
    similar.length > 0
      ? `Found ${similar.length} similar historical incident(s) in GhostShift memory.`
      : "No strongly similar historical incidents were found yet.",
    distinctRootCauses.size > 1
      ? "Similar symptoms appear across historical incidents with different root causes. Current evidence is not sufficient to confirm which historical pattern applies."
      : "",
    `Local action outcomes: ${actionSummary.failed} failed, ${actionSummary.temporary} temporary, ${actionSummary.resolved} resolved.`,
  ].filter(Boolean);

  let freshnessOutdated = false;
  let freshnessNotes: string[] = [];
  try {
    const freshnessTarget =
      similar[0]?.incident._id && incident.status === "active"
        ? similar[0].incident._id
        : incidentId;
    const freshness = await compareKnowledgeFreshness(freshnessTarget);
    freshnessOutdated = freshness.outdated;
    freshnessNotes = freshness.notes.map((note) =>
      note.includes("outdated")
        ? "Historical infrastructure differs from the current environment. Verify before applying previous fixes."
        : note,
    );
    if (freshness.outdated) {
      summaryBits.push(
        "Historical infrastructure differs from the current environment. Verify before applying previous fixes.",
      );
    }
  } catch {
    freshnessNotes = ["Freshness comparison unavailable."];
  }

  const enriched = await maybeEnrichWithOpenAI({
    incident,
    service,
    historical: historicalForAi,
    baseSummary: summaryBits.join(" "),
  });

  if (enriched.aiSuggestion) {
    recommendations = [enriched.aiSuggestion, ...recommendations];
  }

  const confidence = deriveBriefConfidence({
    similar,
    freshnessOutdated,
    distinctRootCauses: distinctRootCauses.size,
    aiConfidence: enriched.confidence,
  });

  return {
    incidentId,
    summary: enriched.summary,
    triedAlready,
    triedAlreadyStats,
    recommendedNext: recommendations.map((item) => item.text),
    recommendations,
    confidence,
    evidenceIds,
    freshnessOutdated,
    freshnessNotes,
    similar: similar.map((hit) => ({
      incidentId: hit.incident._id,
      title: hit.incident.title,
      score: hit.score,
      source: hit.source,
      historicalRootCause: hit.incident.rootCause,
    })),
    aiSource: enriched.aiSource,
    uncertaintyNote: enriched.uncertaintyNote,
  };
}

export async function analyseQuery(query: string): Promise<{
  query: string;
  summary: string;
  triedAlready: string[];
  triedAlreadyStats: TriedAlreadyStat[];
  recommendedNext: string[];
  recommendations: Recommendation[];
  confidence: number;
  evidenceIds: string[];
  similar: IncidentBrief["similar"];
  aiSource: IncidentBrief["aiSource"];
  uncertaintyNote?: string;
}> {
  const similar = await searchSimilarIncidents(query, 5);
  const evidenceIds = similar.map((hit) => hit.incident._id);
  const actions = await getCollection<IncidentAction>(COLLECTIONS.actions);
  const relatedActions = evidenceIds.length
    ? await actions
        .find({ incidentId: { $in: evidenceIds } })
        .sort({ timestamp: 1 })
        .toArray()
    : [];

  const actionsByIncident = new Map<string, IncidentAction[]>();
  for (const action of relatedActions) {
    const list = actionsByIncident.get(action.incidentId) ?? [];
    list.push(action);
    actionsByIncident.set(action.incidentId, list);
  }

  const historicalForAi = similar.map((hit) =>
    toHistoricalIncident(
      hit.incident,
      actionsByIncident.get(hit.incident._id) ?? [],
      hit.score,
    ),
  );

  const triedAlreadyStats = buildTriedAlreadySummaries(historicalForAi).map(
    (stat) => ({
      action: stat.action,
      totalAttempts: stat.totalAttempts,
      failed: stat.failed,
      temporary: stat.temporary,
      successful: stat.successful,
      summary: stat.summary,
      incidentIds: stat.incidentIds,
    }),
  );

  const triedAlready = [
    ...triedAlreadyStats.map(
      (stat) =>
        `WE TRIED THAT ALREADY: "${stat.action}" — attempts ${stat.totalAttempts}, temporary ${stat.temporary}, permanent resolutions ${stat.successful}.`,
    ),
    ...mapActionsToLines(relatedActions),
  ];

  const scoreByIncident = new Map(
    similar.map((hit) => [hit.incident._id, hit.score]),
  );
  const topScore = similar[0] ? normalizeScore(similar[0].score) : 0.35;
  const recommendations = buildResolutionRecommendations(
    relatedActions,
    scoreByIncident,
    topScore,
  );

  const distinctRootCauses = new Set(
    similar
      .map((hit) => hit.incident.rootCause)
      .filter((value): value is string => Boolean(value)),
  );

  const summary =
    similar.length === 0
      ? "No similar historical incidents matched this description."
      : distinctRootCauses.size > 1
        ? `Matched ${similar.length} historical incident(s) with different root causes. Review evidence before assuming the current cause.`
        : `Matched ${similar.length} historical incident(s). Review failed/temporary actions before repeating them.`;

  const confidence = deriveBriefConfidence({
    similar,
    distinctRootCauses: distinctRootCauses.size,
  });

  return {
    query,
    summary,
    triedAlready,
    triedAlreadyStats,
    recommendedNext: recommendations.map((item) => item.text),
    recommendations,
    confidence,
    evidenceIds,
    similar: similar.map((hit) => ({
      incidentId: hit.incident._id,
      title: hit.incident.title,
      score: hit.score,
      source: hit.source,
      historicalRootCause: hit.incident.rootCause,
    })),
    aiSource: "evidence_only",
    uncertaintyNote:
      distinctRootCauses.size > 1
        ? "Similar symptoms, different historical causes. GhostShift retrieves evidence; it does not declare a definite current root cause."
        : undefined,
  };
}
