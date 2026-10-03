import {
  cosineSimilarity,
  embedText,
  EMBEDDING_DIMENSIONS,
} from "@/lib/embeddings";
import { COLLECTIONS, getCollection } from "@/lib/mongodb";
import type { Incident } from "@/types/incident";

export const VECTOR_INDEX_NAME = "incident_embedding_index";

export type SimilarIncident = {
  incident: Incident;
  score: number;
  source: "atlas_vector_search" | "cosine_fallback";
};

/**
 * Search historical incidents by meaning.
 * Prefers MongoDB Atlas Vector Search when the index exists.
 * Falls back to cosine similarity over stored embeddings otherwise.
 */
export async function searchSimilarIncidents(
  query: string,
  limit = 5,
): Promise<SimilarIncident[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const queryEmbedding = await embedText(trimmed);
  const atlasHits = await tryAtlasVectorSearch(queryEmbedding, limit);
  // Atlas can return [] while a new index is still building. Fall back so demos work.
  if (atlasHits && atlasHits.length > 0) return atlasHits;

  return cosineFallbackSearch(queryEmbedding, limit);
}

async function tryAtlasVectorSearch(
  queryEmbedding: number[],
  limit: number,
): Promise<SimilarIncident[] | null> {
  try {
    const collection = await getCollection<Incident>(COLLECTIONS.incidents);
    const rows = await collection
      .aggregate<{
        _id: string;
        serviceId: string;
        title: string;
        summary: string;
        symptoms: string[];
        rootCause?: string;
        resolution?: string;
        status: Incident["status"];
        severity: Incident["severity"];
        historicalConfig?: Record<string, unknown>;
        embedding?: number[];
        createdAt: string;
        resolvedAt?: string;
        score: number;
      }>([
        {
          $vectorSearch: {
            index: VECTOR_INDEX_NAME,
            path: "embedding",
            queryVector: queryEmbedding,
            numCandidates: Math.max(limit * 20, 40),
            limit,
          },
        },
        {
          $project: {
            _id: 1,
            serviceId: 1,
            title: 1,
            summary: 1,
            symptoms: 1,
            rootCause: 1,
            resolution: 1,
            status: 1,
            severity: 1,
            historicalConfig: 1,
            embedding: 1,
            createdAt: 1,
            resolvedAt: 1,
            score: { $meta: "vectorSearchScore" },
          },
        },
      ])
      .toArray();

    return rows.map((row) => {
      const { score, ...incident } = row;
      return {
        incident,
        score,
        source: "atlas_vector_search" as const,
      };
    });
  } catch {
    // Index may not exist yet on this Atlas project. Cosine fallback still ranks real embeddings.
    return null;
  }
}

async function cosineFallbackSearch(
  queryEmbedding: number[],
  limit: number,
): Promise<SimilarIncident[]> {
  const collection = await getCollection<Incident>(COLLECTIONS.incidents);
  const incidents = await collection
    .find({ embedding: { $exists: true, $type: "array" } })
    .toArray();

  return incidents
    .map((incident) => ({
      incident,
      score: cosineSimilarity(queryEmbedding, incident.embedding ?? []),
      source: "cosine_fallback" as const,
    }))
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** Best-effort Atlas Vector Search index creation for local demos. */
export async function ensureVectorSearchIndex(): Promise<string> {
  const collection = await getCollection(COLLECTIONS.incidents);

  try {
    const existing = await collection.listSearchIndexes(VECTOR_INDEX_NAME).toArray();
    if (existing.length > 0) {
      return `Vector Search index already exists: ${VECTOR_INDEX_NAME}`;
    }
  } catch {
    // listSearchIndexes can fail on some tiers; try create anyway.
  }

  try {
    await collection.createSearchIndex({
      name: VECTOR_INDEX_NAME,
      type: "vectorSearch",
      definition: {
        fields: [
          {
            type: "vector",
            path: "embedding",
            numDimensions: EMBEDDING_DIMENSIONS,
            similarity: "cosine",
          },
        ],
      },
    });
    return `Created Vector Search index: ${VECTOR_INDEX_NAME}`;
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return `Vector Search index not created (${message}). Cosine fallback will be used until you create "${VECTOR_INDEX_NAME}" in Atlas.`;
  }
}
