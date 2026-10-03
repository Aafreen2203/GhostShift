/**
 * Deterministic local embeddings for the hackathon demo.
 * Same text always produces the same vector. No external AI API required.
 * Seeded incidents and live queries use this same function so cosine ranking
 * is meaningful across the synthetic dataset.
 */

export const EMBEDDING_DIMENSIONS = 384;

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "to",
  "was",
  "were",
  "with",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function hashToken(token: string): number {
  let hash = 2166136261;
  for (let i = 0; i < token.length; i += 1) {
    hash ^= token.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function normalize(vector: number[]): number[] {
  let sumSquares = 0;
  for (const value of vector) sumSquares += value * value;
  const norm = Math.sqrt(sumSquares);
  if (norm === 0) return vector;
  return vector.map((value) => value / norm);
}

/** Build the text blob we embed for an incident document. */
export function incidentEmbeddingText(input: {
  title: string;
  summary: string;
  symptoms: string[];
  rootCause?: string;
  resolution?: string;
}): string {
  return [
    input.title,
    input.summary,
    ...input.symptoms,
    input.rootCause ?? "",
    input.resolution ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Feature-hash embedding with L2 normalization.
 * Suitable for cosine similarity and Atlas Vector Search (cosine).
 */
export async function embedText(text: string): Promise<number[]> {
  const tokens = tokenize(text);
  const vector = new Array<number>(EMBEDDING_DIMENSIONS).fill(0);

  if (tokens.length === 0) {
    return vector;
  }

  for (const token of tokens) {
    const hash = hashToken(token);
    const index = hash % EMBEDDING_DIMENSIONS;
    const sign = hash & 1 ? 1 : -1;
    vector[index] += sign;
  }

  return normalize(vector);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const length = Math.min(a.length, b.length);
  let dot = 0;
  for (let i = 0; i < length; i += 1) {
    dot += a[i]! * b[i]!;
  }
  return dot;
}
