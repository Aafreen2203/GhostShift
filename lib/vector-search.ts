import type { Incident } from "@/types/incident";

export type SimilarIncident = {
  incident: Incident;
  score: number;
};

/**
 * WORKSTREAM 2 — AI / Retrieval
 *
 * TODO: Embed `query` with lib/embeddings.ts and run MongoDB Atlas Vector
 * Search against the incidents collection.
 * Wire this into POST /api/incidents/search.
 * Do not return fake similarity scores.
 *
 * The seed set includes three different Payment API incidents so a later
 * search has more than one historical case to rank.
 */
export async function searchSimilarIncidents(
  query: string,
  limit = 5,
): Promise<SimilarIncident[]> {
  void query;
  void limit;
  throw new Error("MongoDB Vector Search is not implemented yet.");
}
