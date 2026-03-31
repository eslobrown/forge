import { Index } from "@upstash/vector";

export interface ChunkMetadata {
  documentId: string;
  documentName: string;
  chunkIndex: number;
  text: string;
}

export interface RetrievedChunk {
  documentName: string;
  text: string;
  score: number;
}

let index: Index | null = null;

function getIndex(): Index {
  if (!index) {
    const url = process.env.UPSTASH_VECTOR_REST_URL;
    const token = process.env.UPSTASH_VECTOR_REST_TOKEN;
    if (!url || !token) {
      throw new Error(
        "UPSTASH_VECTOR_REST_URL and UPSTASH_VECTOR_REST_TOKEN must be set"
      );
    }
    index = new Index({ url, token });
  }
  return index;
}

/**
 * Upsert document chunks with their embeddings into Upstash Vector.
 * Each vector ID is "{documentId}_{chunkIndex}" for easy deletion later.
 */
export async function upsertChunks(
  documentId: string,
  documentName: string,
  chunks: { text: string; index: number }[],
  embeddings: number[][]
): Promise<void> {
  const vectors = chunks.map((chunk, i) => ({
    id: `${documentId}_${chunk.index}`,
    vector: embeddings[i],
    metadata: {
      documentId,
      documentName,
      chunkIndex: chunk.index,
      text: chunk.text,
    } satisfies ChunkMetadata,
  }));

  // Upstash supports batches of up to 1000
  const BATCH_SIZE = 100;
  for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
    const batch = vectors.slice(i, i + BATCH_SIZE);
    await getIndex().upsert(batch);
  }
}

/**
 * Query for the most similar chunks to a given embedding.
 * Returns top-k chunks above the similarity threshold.
 */
export async function querySimilar(
  queryEmbedding: number[],
  topK: number = 10,
  scoreThreshold: number = 0.3
): Promise<RetrievedChunk[]> {
  const results = await getIndex().query({
    vector: queryEmbedding,
    topK,
    includeMetadata: true,
  });

  return results
    .filter((r) => r.score >= scoreThreshold)
    .map((r) => {
      const meta = r.metadata as unknown as ChunkMetadata;
      return {
        documentName: meta.documentName,
        text: meta.text,
        score: r.score,
      };
    });
}

/**
 * Delete all vectors belonging to a specific document.
 * Uses the "{documentId}_{chunkIndex}" ID pattern.
 */
export async function deleteDocumentChunks(
  documentId: string,
  chunkCount: number
): Promise<void> {
  const ids = Array.from({ length: chunkCount }, (_, i) => `${documentId}_${i}`);

  // Upstash delete supports batches
  const BATCH_SIZE = 100;
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);
    await getIndex().delete(batch);
  }
}
