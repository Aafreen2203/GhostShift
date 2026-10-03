/**
 * WORKSTREAM 2 — AI / Retrieval
 *
 * TODO: Generate an embedding for incident text (title, summary, symptoms,
 * root cause, and resolution). Persist the vector on `incident.embedding`.
 * Do not call a model from this stub, and do not invent vectors.
 */
export async function embedText(text: string): Promise<number[]> {
  void text;
  throw new Error("Embeddings are not implemented yet.");
}
