/** Mirrors backend contracts for judge-facing labels only. */
export const MONGO_TRACE = {
  database: "ghostshift",
  collections: {
    incidents: "incidents",
    actions: "actions",
    events: "events",
    services: "services",
  },
  vectorIndex: "incident_embedding_index",
  /** Must match Atlas Vector Search index numDimensions and embedText output. */
  embeddingDimensions: 384,
  embeddingPath: "embedding",
  embeddingSimilarity: "cosine",
  embeddingLabel: "Semantic Memory — 384-dimensional incident embeddings",
} as const;

export type MongoSearchSource = "atlas_vector_search" | "cosine_fallback" | string;
