export interface Chunk {
  text: string;
  index: number;
}

const AVG_CHARS_PER_TOKEN = 4;
const TARGET_CHUNK_TOKENS = 500;
const OVERLAP_TOKENS = 50;
const TARGET_CHUNK_CHARS = TARGET_CHUNK_TOKENS * AVG_CHARS_PER_TOKEN;
const OVERLAP_CHARS = OVERLAP_TOKENS * AVG_CHARS_PER_TOKEN;

/**
 * Split text into chunks of ~500 tokens with ~50 token overlap.
 * Splits on paragraph boundaries first, then sentence boundaries for long paragraphs.
 */
export function chunkText(text: string): Chunk[] {
  const cleaned = text.replace(/\r\n/g, "\n").trim();
  if (!cleaned) return [];

  // Split into paragraphs on double newline
  const paragraphs = cleaned.split(/\n\s*\n/).filter((p) => p.trim());

  const chunks: Chunk[] = [];
  let currentChunk = "";
  let chunkIndex = 0;

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();

    // If this single paragraph is too long, split it by sentences
    if (trimmed.length > TARGET_CHUNK_CHARS) {
      // Flush current chunk first
      if (currentChunk.trim()) {
        chunks.push({ text: currentChunk.trim(), index: chunkIndex++ });
        // Keep overlap from end of current chunk
        currentChunk = getOverlapSuffix(currentChunk);
      }
      // Split long paragraph into sentence-based chunks
      const sentenceChunks = splitBySentences(trimmed, chunkIndex);
      for (const sc of sentenceChunks) {
        chunks.push(sc);
        chunkIndex = sc.index + 1;
      }
      currentChunk = getOverlapSuffix(chunks[chunks.length - 1]?.text || "");
      continue;
    }

    // Would adding this paragraph exceed target?
    if (
      currentChunk &&
      currentChunk.length + trimmed.length + 2 > TARGET_CHUNK_CHARS
    ) {
      chunks.push({ text: currentChunk.trim(), index: chunkIndex++ });
      // Start next chunk with overlap from end of previous
      currentChunk = getOverlapSuffix(currentChunk) + "\n\n" + trimmed;
    } else {
      currentChunk = currentChunk
        ? currentChunk + "\n\n" + trimmed
        : trimmed;
    }
  }

  // Flush remaining
  if (currentChunk.trim()) {
    chunks.push({ text: currentChunk.trim(), index: chunkIndex });
  }

  return chunks;
}

function splitBySentences(text: string, startIndex: number): Chunk[] {
  // Split on sentence endings followed by space or end of string
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [text];
  const chunks: Chunk[] = [];
  let current = "";
  let idx = startIndex;

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    if (current && current.length + trimmed.length + 1 > TARGET_CHUNK_CHARS) {
      chunks.push({ text: current.trim(), index: idx++ });
      current = getOverlapSuffix(current) + " " + trimmed;
    } else {
      current = current ? current + " " + trimmed : trimmed;
    }
  }

  if (current.trim()) {
    chunks.push({ text: current.trim(), index: idx });
  }

  return chunks;
}

function getOverlapSuffix(text: string): string {
  if (text.length <= OVERLAP_CHARS) return text;
  // Take the last OVERLAP_CHARS characters, breaking at a word boundary
  const suffix = text.slice(-OVERLAP_CHARS);
  const firstSpace = suffix.indexOf(" ");
  return firstSpace > 0 ? suffix.slice(firstSpace + 1) : suffix;
}
