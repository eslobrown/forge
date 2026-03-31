import OpenAI from "openai";

const MODEL = "text-embedding-3-small"; // 1536 dimensions

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    client = new OpenAI({ apiKey });
  }
  return client;
}

/**
 * Embed a single text string. Returns a 1536-dimension float array.
 */
export async function embedText(text: string): Promise<number[]> {
  const response = await getClient().embeddings.create({
    model: MODEL,
    input: text,
  });
  return response.data[0].embedding;
}

/**
 * Embed multiple texts in a single API call. Returns an array of embeddings
 * in the same order as the input texts.
 * OpenAI supports up to 2048 inputs per batch call.
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  // OpenAI batch limit is 2048, but keep batches reasonable
  const BATCH_SIZE = 100;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const response = await getClient().embeddings.create({
      model: MODEL,
      input: batch,
    });
    // Sort by index to maintain order
    const sorted = response.data.sort((a, b) => a.index - b.index);
    allEmbeddings.push(...sorted.map((d) => d.embedding));
  }

  return allEmbeddings;
}
