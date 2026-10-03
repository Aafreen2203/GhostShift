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

export type IncidentBrief = {
  incidentId: string;
  summary: string;
  triedAlready: string[];
  triedAlreadyStats: TriedAlreadyStat[];
  recommendedNext: string[];
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

async function maybeEnrichWithOpenAI(args: {
  incident: Incident;
  service: Service | null;
  historical: ReturnType<typeof toHistoricalIncident>[];
  baseSummary: string;
}): Promise<{ summary: string; aiSource: IncidentBrief["aiSource"]; uncertaintyNote?: string }> {
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
  // Include the incident itself when analysing a historical case.
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

  const resolvedActions = relatedActions.filter(
    (action) => action.outcome === "resolved",
  );
  const recommendedNext = resolvedActions.map(
    (action) =>
      `Historical resolution on ${action.incidentId}: ${action.action}`,
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

  return {
    incidentId,
    summary: enriched.summary,
    triedAlready,
    triedAlreadyStats,
    recommendedNext,
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

  const recommendedNext = relatedActions
    .filter((action) => action.outcome === "resolved")
    .map(
      (action) =>
        `Historical resolution on ${action.incidentId}: ${action.action}`,
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

  return {
    query,
    summary,
    triedAlready,
    triedAlreadyStats,
    recommendedNext,
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
