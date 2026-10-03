import type { CurrentIncident, HistoricalIncident } from "../types/incident.js";
import { connectionRatio } from "./systemStateCompare.js";

const STOP_WORDS = new Set(["the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "with"]);

export interface RankedIncident {
  incident: HistoricalIncident;
  similarityScore: number;
}

export function rankHistoricalIncidents(
  current: CurrentIncident,
  historicalIncidents: HistoricalIncident[]
): RankedIncident[] {
  return historicalIncidents
    .map((incident) => ({
      incident,
      similarityScore: scoreSimilarity(current, incident)
    }))
    .sort((a, b) => b.similarityScore - a.similarityScore);
}

export function scoreSimilarity(current: CurrentIncident, historical: HistoricalIncident): number {
  if (historical.similarityScore !== undefined) {
    return clamp(historical.similarityScore);
  }

  let score = 0;

  if (current.service && historical.service && normalize(current.service) === normalize(historical.service)) {
    score += 0.35;
  }

  const currentTokens = tokenize([
    current.title,
    current.description,
    ...(current.errorMessages ?? []),
    ...(current.recentEvents ?? [])
  ]);
  const historicalTokens = tokenize([
    historical.title,
    historical.description,
    ...(historical.symptoms ?? []),
    ...(historical.tags ?? [])
  ]);
  score += 0.3 * jaccard(currentTokens, historicalTokens);

  const currentRatio = connectionRatio(current.systemState);
  const historicalRatio = connectionRatio(historical.systemState);
  if (currentRatio !== undefined && historicalRatio !== undefined) {
    const delta = Math.abs(currentRatio - historicalRatio);
    if (delta <= 0.1) {
      score += 0.25;
    } else if (delta <= 0.25) {
      score += 0.1;
    }
  }

  if (overlap(current.errorMessages ?? [], historical.symptoms ?? []).length > 0) {
    score += 0.1;
  }

  return clamp(score);
}

function tokenize(parts: Array<string | undefined>): Set<string> {
  const tokens = new Set<string>();
  for (const part of parts) {
    if (!part) {
      continue;
    }
    for (const token of part.toLowerCase().split(/[^a-z0-9]+/)) {
      if (token && !STOP_WORDS.has(token)) {
        tokens.add(token);
      }
    }
  }
  return tokens;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) {
    return 0;
  }
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) {
      intersection += 1;
    }
  }
  return intersection / new Set([...a, ...b]).size;
}

function overlap(left: string[], right: string[]): string[] {
  const rightNorm = new Set(right.map(normalize));
  return left.filter((item) => rightNorm.has(normalize(item)));
}

function normalize(value: string): string {
  return value.toLowerCase().trim();
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}
