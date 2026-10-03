export type SearchSource = "atlas_vector_search" | "cosine_fallback" | string;

/** Judge-facing labels — never claim Atlas Vector Search when fallback ran. */
export function searchEngineLabel(source?: SearchSource): string {
  if (source === "atlas_vector_search") {
    return "MongoDB Atlas Vector Search";
  }
  if (source === "cosine_fallback") {
    return "Local cosine fallback";
  }
  return "Similarity search";
}

export function searchEngineDetail(source?: SearchSource): string {
  if (source === "atlas_vector_search") {
    return "Retrieved via MongoDB Atlas Vector Search over incident embeddings.";
  }
  if (source === "cosine_fallback") {
    return "Atlas Vector Search unavailable or empty — ranked with local cosine over stored 384-d embeddings.";
  }
  return "Semantic ranking over stored incident embeddings.";
}

export function isAtlasVectorSearch(source?: SearchSource): boolean {
  return source === "atlas_vector_search";
}
