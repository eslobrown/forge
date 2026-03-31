# RAG Document Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add document upload, chunking, vector search, and retrieval-augmented generation to FORGE so analyses are grounded in real uploaded documents.

**Architecture:** Upload-time processing pipeline. Files uploaded via the UI are extracted, chunked, embedded (OpenAI text-embedding-3-small), and stored in Upstash Vector. At analysis time, the scenario is embedded and top-k similar chunks are retrieved and injected into the Claude prompt alongside Perplexity research.

**Tech Stack:** Next.js 15.5, Upstash Vector, OpenAI embeddings, Vercel Blob, pdf-parse, Tailwind CSS 4

**Spec:** `docs/superpowers/specs/2026-03-31-rag-document-layer-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/chunker.ts` | Create | Text chunking — split extracted text into ~500 token chunks with overlap |
| `src/lib/embeddings.ts` | Create | OpenAI embedding wrapper — embed text, embed batch |
| `src/lib/vector-store.ts` | Create | Upstash Vector wrapper — upsert chunks, query similar, delete by document |
| `src/lib/pdf-extract.ts` | Create | PDF + plain text extraction — file buffer to string |
| `src/app/api/documents/route.ts` | Create | POST (upload + process) and GET (list) endpoints |
| `src/app/api/documents/[id]/route.ts` | Create | DELETE endpoint — remove document + vectors |
| `src/app/api/forge/route.ts` | Modify | Add RAG retrieval step before Claude call |
| `src/app/page.tsx` | Modify | Add collapsible documents section + document-grounded badge |
| `package.json` | Modify | Add new dependencies |

---

## Task 0: Install Dependencies and Configure Environment

**Files:**
- Modify: `package.json`
- Create: `.env.local` (gitignored, local dev only)

- [ ] **Step 1: Install new packages**

```bash
cd /Users/nunoandrade/git-repos/forge
npm install @upstash/vector openai @vercel/blob pdf-parse
npm install -D @types/pdf-parse
```

- [ ] **Step 2: Create .env.local for local development**

Create `.env.local` with the three new env vars (values to be filled in from Upstash console and OpenAI dashboard):

```bash
# .env.local (already gitignored by Next.js)
UPSTASH_VECTOR_REST_URL=https://your-index.upstash.io
UPSTASH_VECTOR_REST_TOKEN=your-token-here
OPENAI_API_KEY=sk-your-key-here
```

- [ ] **Step 3: Verify .env.local is gitignored**

```bash
cd /Users/nunoandrade/git-repos/forge
grep ".env.local" .gitignore
```

Expected: `.env.local` is listed (Next.js default `.gitignore` includes it).

- [ ] **Step 4: Verify packages installed**

```bash
cd /Users/nunoandrade/git-repos/forge
node -e "require('@upstash/vector'); require('openai'); require('@vercel/blob'); require('pdf-parse'); console.log('All packages OK')"
```

Expected: `All packages OK`

- [ ] **Step 5: Commit**

```bash
cd /Users/nunoandrade/git-repos/forge
git add package.json package-lock.json
git commit -m "chore: add RAG dependencies (upstash vector, openai, vercel blob, pdf-parse)"
```

---

## Task 1: Text Chunker

**Files:**
- Create: `src/lib/chunker.ts`

- [ ] **Step 1: Create the chunker module**

Create `src/lib/chunker.ts`:

```typescript
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
```

- [ ] **Step 2: Verify it compiles**

```bash
cd /Users/nunoandrade/git-repos/forge
npx tsc --noEmit src/lib/chunker.ts 2>&1 || echo "Check errors above"
```

Expected: no errors (or only unrelated Next.js type issues).

- [ ] **Step 3: Quick smoke test**

```bash
cd /Users/nunoandrade/git-repos/forge
node -e "
const { chunkText } = require('./src/lib/chunker');
// This won't work directly with TS, so just verify the file parses
console.log('chunker module structure OK');
" 2>/dev/null || echo "TS module — will verify via build"
npx tsx -e "
import { chunkText } from './src/lib/chunker';
const chunks = chunkText('Hello world.\n\nThis is paragraph two.\n\nAnd a third one.');
console.log('Chunks:', chunks.length);
console.log(JSON.stringify(chunks, null, 2));
"
```

Expected: 1 chunk (text is very short), containing all three paragraphs.

- [ ] **Step 4: Commit**

```bash
cd /Users/nunoandrade/git-repos/forge
git add src/lib/chunker.ts
git commit -m "feat: add text chunker for RAG document processing"
```

---

## Task 2: PDF and Text Extraction

**Files:**
- Create: `src/lib/pdf-extract.ts`

- [ ] **Step 1: Create the extraction module**

Create `src/lib/pdf-extract.ts`:

```typescript
import pdfParse from "pdf-parse";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_EXTENSIONS = [".pdf", ".txt", ".md"];

export interface ExtractionResult {
  text: string;
  pageCount: number | null;
}

/**
 * Extract text content from a file buffer.
 * Supports PDF (via pdf-parse) and plain text (.txt, .md).
 */
export async function extractText(
  buffer: Buffer,
  filename: string
): Promise<ExtractionResult> {
  const ext = getExtension(filename);

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(
      `Unsupported file type: ${ext}. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`
    );
  }

  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error(
      `File too large: ${(buffer.length / 1024 / 1024).toFixed(1)}MB. Maximum: 10MB`
    );
  }

  if (ext === ".pdf") {
    return extractPdf(buffer);
  }

  // Plain text
  return {
    text: buffer.toString("utf-8"),
    pageCount: null,
  };
}

async function extractPdf(buffer: Buffer): Promise<ExtractionResult> {
  const data = await pdfParse(buffer);
  return {
    text: data.text,
    pageCount: data.numpages,
  };
}

function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1) return "";
  return filename.slice(lastDot).toLowerCase();
}
```

- [ ] **Step 2: Smoke test with a text string**

```bash
cd /Users/nunoandrade/git-repos/forge
npx tsx -e "
import { extractText } from './src/lib/pdf-extract';
const buf = Buffer.from('Hello, this is a test document.\n\nWith two paragraphs.');
const result = await extractText(buf, 'test.txt');
console.log('Text length:', result.text.length);
console.log('Page count:', result.pageCount);
console.log('Content:', result.text);
"
```

Expected: text length ~52, page count null, content matches input.

- [ ] **Step 3: Commit**

```bash
cd /Users/nunoandrade/git-repos/forge
git add src/lib/pdf-extract.ts
git commit -m "feat: add PDF and text extraction for document upload"
```

---

## Task 3: OpenAI Embedding Wrapper

**Files:**
- Create: `src/lib/embeddings.ts`

- [ ] **Step 1: Create the embeddings module**

Create `src/lib/embeddings.ts`:

```typescript
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
```

- [ ] **Step 2: Verify it compiles**

```bash
cd /Users/nunoandrade/git-repos/forge
npx tsc --noEmit src/lib/embeddings.ts 2>&1 | head -5
```

Expected: no errors (env var check is at runtime, not compile time).

- [ ] **Step 3: Commit**

```bash
cd /Users/nunoandrade/git-repos/forge
git add src/lib/embeddings.ts
git commit -m "feat: add OpenAI embedding wrapper for RAG"
```

---

## Task 4: Upstash Vector Store Wrapper

**Files:**
- Create: `src/lib/vector-store.ts`

- [ ] **Step 1: Create the vector store module**

Create `src/lib/vector-store.ts`:

```typescript
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
```

- [ ] **Step 2: Verify it compiles**

```bash
cd /Users/nunoandrade/git-repos/forge
npx tsc --noEmit src/lib/vector-store.ts 2>&1 | head -5
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/nunoandrade/git-repos/forge
git add src/lib/vector-store.ts
git commit -m "feat: add Upstash Vector store wrapper for RAG"
```

---

## Task 5: Document Upload and List API Route

**Files:**
- Create: `src/app/api/documents/route.ts`

- [ ] **Step 1: Create the documents API route**

Create `src/app/api/documents/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { put, list } from "@vercel/blob";
import { extractText } from "@/lib/pdf-extract";
import { chunkText } from "@/lib/chunker";
import { embedBatch } from "@/lib/embeddings";
import { upsertChunks } from "@/lib/vector-store";
import { randomBytes } from "crypto";

/**
 * POST /api/documents — Upload a document, extract text, chunk, embed, store.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Generate document ID
    const documentId = `doc_${randomBytes(8).toString("hex")}`;
    const documentName = file.name;

    // Extract text from file
    const buffer = Buffer.from(await file.arrayBuffer());
    const { text, pageCount } = await extractText(buffer, file.name);

    if (!text.trim()) {
      return NextResponse.json(
        { error: "No text content could be extracted from the file" },
        { status: 400 }
      );
    }

    // Chunk the text
    const chunks = chunkText(text);

    if (chunks.length === 0) {
      return NextResponse.json(
        { error: "File produced no usable text chunks" },
        { status: 400 }
      );
    }

    // Embed all chunks
    const embeddings = await embedBatch(chunks.map((c) => c.text));

    // Store in Upstash Vector
    await upsertChunks(documentId, documentName, chunks, embeddings);

    // Store document manifest in Vercel Blob
    const manifest = {
      id: documentId,
      name: documentName,
      size: file.size,
      chunkCount: chunks.length,
      pageCount,
      uploadedAt: new Date().toISOString(),
    };

    await put(`documents/${documentId}.json`, JSON.stringify(manifest), {
      access: "public",
      contentType: "application/json",
    });

    return NextResponse.json(manifest);
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Upload failed";
    console.error("Document upload error:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * GET /api/documents — List all uploaded documents.
 */
export async function GET() {
  try {
    const { blobs } = await list({ prefix: "documents/" });

    const documents = await Promise.all(
      blobs.map(async (blob) => {
        try {
          const res = await fetch(blob.url);
          const manifest = await res.json();
          return manifest;
        } catch {
          return null;
        }
      })
    );

    return NextResponse.json({
      documents: documents.filter(Boolean),
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to list documents";
    console.error("Document list error:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd /Users/nunoandrade/git-repos/forge
npx tsc --noEmit src/app/api/documents/route.ts 2>&1 | head -10
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/nunoandrade/git-repos/forge
git add src/app/api/documents/route.ts
git commit -m "feat: add document upload and list API routes"
```

---

## Task 6: Document Delete API Route

**Files:**
- Create: `src/app/api/documents/[id]/route.ts`

- [ ] **Step 1: Create the delete API route**

Create `src/app/api/documents/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { del, list } from "@vercel/blob";
import { deleteDocumentChunks } from "@/lib/vector-store";

/**
 * DELETE /api/documents/[id] — Remove document manifest and all vector chunks.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Find the document manifest in Vercel Blob
    const { blobs } = await list({ prefix: `documents/${id}.json` });
    const blob = blobs[0];

    if (!blob) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Read manifest to get chunk count
    const res = await fetch(blob.url);
    const manifest = await res.json();

    // Delete vectors from Upstash
    await deleteDocumentChunks(id, manifest.chunkCount);

    // Delete manifest from Vercel Blob
    await del(blob.url);

    return NextResponse.json({ deleted: true });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Delete failed";
    console.error("Document delete error:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd /Users/nunoandrade/git-repos/forge
npx tsc --noEmit src/app/api/documents/\\[id\\]/route.ts 2>&1 | head -10
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/nunoandrade/git-repos/forge
git add "src/app/api/documents/[id]/route.ts"
git commit -m "feat: add document delete API route"
```

---

## Task 7: Integrate RAG Retrieval into FORGE Analysis

**Files:**
- Modify: `src/app/api/forge/route.ts`

This task modifies the existing forge API route to:
1. Add document context retrieval before the Claude call
2. Inject retrieved chunks into the prompt
3. Update BASE_SYSTEM with document grounding instruction
4. Return document grounding info in the response

- [ ] **Step 1: Add imports at top of route.ts**

At the top of `src/app/api/forge/route.ts`, after the existing imports, add:

```typescript
import { embedText } from "@/lib/embeddings";
import { querySimilar } from "@/lib/vector-store";
```

- [ ] **Step 2: Add document grounding instruction to BASE_SYSTEM**

In `src/app/api/forge/route.ts`, append to the `BASE_SYSTEM` string, before the closing backtick:

```
- When document context is provided, treat it as the primary source of truth. Reference specific documents and sections in your analysis. Document context takes precedence over research context when they conflict.
```

The full rule to add goes after the existing `- Be specific to the context given. Generic advice is worthless.` line and before `- When research context is provided, USE IT.`.

- [ ] **Step 3: Add document retrieval function**

In `src/app/api/forge/route.ts`, add this function after the `researchContext` function and before the `BASE_SYSTEM` constant:

```typescript
/* ── Document RAG retrieval step ── */
async function retrieveDocumentContext(
  scenario: string
): Promise<{ context: string; chunkCount: number; docCount: number } | null> {
  try {
    // Check if vector store is configured
    if (
      !process.env.UPSTASH_VECTOR_REST_URL ||
      !process.env.UPSTASH_VECTOR_REST_TOKEN ||
      !process.env.OPENAI_API_KEY
    ) {
      return null;
    }

    const queryEmbedding = await embedText(scenario);
    const chunks = await querySimilar(queryEmbedding, 10, 0.3);

    if (chunks.length === 0) return null;

    // Count unique documents
    const uniqueDocs = new Set(chunks.map((c) => c.documentName));

    // Format chunks with source attribution
    const formattedChunks = chunks
      .map((c) => `[From: ${c.documentName}]\n${c.text}`)
      .join("\n\n");

    const context = `--- DOCUMENT CONTEXT (uploaded reference documents) ---\n\n${formattedChunks}\n\n--- END DOCUMENT CONTEXT ---`;

    return {
      context,
      chunkCount: chunks.length,
      docCount: uniqueDocs.size,
    };
  } catch (e) {
    console.error("Document retrieval failed:", e);
    return null;
  }
}
```

- [ ] **Step 4: Modify the POST handler to use document retrieval**

In the `POST` function of `src/app/api/forge/route.ts`, add the document retrieval call after the Perplexity research step and modify the user message construction and response.

After this existing block:
```typescript
    // Step 1: Research context via Perplexity (if enabled)
    let researchData: string | null = null;
    if (research) {
      researchData = await researchContext(scenario.trim());
    }
```

Add:
```typescript
    // Step 1.5: Retrieve relevant document chunks via RAG
    const documentData = await retrieveDocumentContext(scenario.trim());
```

Then modify the user message construction. After `let userMessage = ...scenario.trim()...`, add the document context BEFORE the research context:

```typescript
    if (documentData) {
      userMessage += `\n\n${documentData.context}\n\nUse the document context above as the primary source of truth. Reference specific documents and sections in your analysis.`;
    }
```

This must come BEFORE the existing `if (researchData)` block so documents appear first in the prompt.

Finally, update the success response to include document grounding info. Change the return statement from:

```typescript
    return NextResponse.json({
      analysis: parsed,
      mode: selectedMode,
      research_enriched: !!researchData,
      usage: {
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens,
      },
    });
```

To:

```typescript
    return NextResponse.json({
      analysis: parsed,
      mode: selectedMode,
      research_enriched: !!researchData,
      document_grounded: !!documentData,
      document_chunks_used: documentData
        ? { chunks: documentData.chunkCount, documents: documentData.docCount }
        : null,
      usage: {
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens,
      },
    });
```

- [ ] **Step 5: Verify it compiles**

```bash
cd /Users/nunoandrade/git-repos/forge
npx tsc --noEmit src/app/api/forge/route.ts 2>&1 | head -10
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
cd /Users/nunoandrade/git-repos/forge
git add src/app/api/forge/route.ts
git commit -m "feat: integrate RAG document retrieval into FORGE analysis"
```

---

## Task 8: Frontend — Collapsible Document Section + Badge

**Files:**
- Modify: `src/app/page.tsx`

This is the largest task. It adds:
1. State management for documents (list, upload, delete)
2. Collapsible documents section UI
3. Document-grounded badge in results

- [ ] **Step 1: Add document state variables**

In `src/app/page.tsx`, inside the `Home` component, after the existing state declarations (after `const [lang, setLang] = useState<"en" | "pt">("en");`), add:

```typescript
  // Document state
  const [documents, setDocuments] = useState<
    { id: string; name: string; size: number; chunkCount: number; uploadedAt: string }[]
  >([]);
  const [docsExpanded, setDocsExpanded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [documentGrounded, setDocumentGrounded] = useState(false);
  const [documentChunksUsed, setDocumentChunksUsed] = useState<{
    chunks: number;
    documents: number;
  } | null>(null);
```

- [ ] **Step 2: Add document fetch on mount**

After the existing `useEffect` that loads cached featured analysis, add:

```typescript
  // Fetch documents on mount
  useEffect(() => {
    fetch("/api/documents")
      .then((res) => res.json())
      .then((data) => {
        if (data.documents) setDocuments(data.documents);
      })
      .catch(() => {});
  }, []);
```

- [ ] **Step 3: Add upload and delete handler functions**

After the `forge` async function, add:

```typescript
  const uploadDocument = async (file: File) => {
    setUploading(true);
    setUploadStatus("Uploading...");
    try {
      const formData = new FormData();
      formData.append("file", file);

      setUploadStatus("Extracting text...");
      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.error) {
        setUploadStatus(`Error: ${data.error}`);
        setTimeout(() => setUploadStatus(""), 3000);
        return;
      }

      setDocuments((prev) => [...prev, data]);
      setUploadStatus(`${data.name} — ${data.chunkCount} chunks indexed`);
      setTimeout(() => setUploadStatus(""), 3000);
    } catch {
      setUploadStatus("Upload failed");
      setTimeout(() => setUploadStatus(""), 3000);
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      await fetch(`/api/documents/${id}`, { method: "DELETE" });
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch {
      // Silently fail — document may already be removed
    }
  };
```

- [ ] **Step 4: Update the forge function to capture document grounding state**

In the `forge` function, after `setResearchEnriched(data.research_enriched || false);`, add:

```typescript
      setDocumentGrounded(data.document_grounded || false);
      setDocumentChunksUsed(data.document_chunks_used || null);
```

Also reset them at the start of the `forge` function, after `setResearchEnriched(false);` add:

```typescript
      setDocumentGrounded(false);
      setDocumentChunksUsed(null);
```

- [ ] **Step 5: Add the collapsible documents section to the JSX**

In the JSX, between the example scenarios section (the `<div className="mb-6">` block containing `EXAMPLE_SCENARIOS`) and the scenario textarea section (the `<div className="mb-5">` block containing `<textarea`), add:

```tsx
        {/* Documents section (collapsible) */}
        <div className="mb-5">
          <button
            onClick={() => setDocsExpanded(!docsExpanded)}
            className="flex items-center gap-2 font-mono text-[10px] text-white/40 uppercase tracking-[0.15em] mb-3 cursor-pointer hover:text-white/60 transition-colors"
          >
            <span
              className="transition-transform"
              style={{ transform: docsExpanded ? "rotate(90deg)" : "none" }}
            >
              &#x25B8;
            </span>
            Documents
            {documents.length > 0 && (
              <span
                className="font-mono text-[10px] px-1.5 py-0.5 rounded-full"
                style={{
                  background: "rgba(0,245,200,0.15)",
                  color: "#00f5c8",
                  fontSize: 9,
                }}
              >
                {documents.length}
              </span>
            )}
          </button>

          {docsExpanded && (
            <div
              className="rounded-lg border px-4 py-4"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.02)",
              }}
            >
              {/* Drop zone */}
              <div
                className="rounded-lg border-2 border-dashed px-4 py-6 text-center cursor-pointer mb-3 transition-colors"
                style={{
                  borderColor: "rgba(0,245,200,0.2)",
                  background: "rgba(0,245,200,0.02)",
                }}
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = ".pdf,.txt,.md";
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) uploadDocument(file);
                  };
                  input.click();
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = "rgba(0,245,200,0.5)";
                  e.currentTarget.style.background = "rgba(0,245,200,0.06)";
                }}
                onDragLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(0,245,200,0.2)";
                  e.currentTarget.style.background = "rgba(0,245,200,0.02)";
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = "rgba(0,245,200,0.2)";
                  e.currentTarget.style.background = "rgba(0,245,200,0.02)";
                  const file = e.dataTransfer.files[0];
                  if (file) uploadDocument(file);
                }}
              >
                <div className="font-mono text-xs text-white/30">
                  {uploading ? uploadStatus : "Drop PDF or text files here, or click to browse"}
                </div>
                <div className="font-mono text-[10px] text-white/15 mt-1">
                  Max 10MB per file
                </div>
              </div>

              {/* Upload status */}
              {uploadStatus && !uploading && (
                <div className="font-mono text-[10px] text-[#00f5c8]/70 mb-3">
                  {uploadStatus}
                </div>
              )}

              {/* Document list */}
              {documents.length > 0 && (
                <div className="space-y-1">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded px-3 py-2"
                      style={{ background: "rgba(255,255,255,0.03)" }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-white/20 text-xs shrink-0">
                          &#x1F4C4;
                        </span>
                        <span className="font-mono text-xs text-white/50 truncate">
                          {doc.name}
                        </span>
                        <span className="font-mono text-[9px] text-white/20 shrink-0">
                          {doc.chunkCount} chunks
                        </span>
                      </div>
                      <button
                        onClick={() => deleteDocument(doc.id)}
                        className="text-white/20 hover:text-red-400 text-xs ml-2 cursor-pointer transition-colors shrink-0"
                      >
                        &#x2715;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
```

- [ ] **Step 6: Add the document-grounded badge to the results header**

In the results section, inside the badge container (the `<div className="flex items-center gap-2">` that contains the `researchEnriched` badge), add after the research-enriched badge:

```tsx
                {documentGrounded && documentChunksUsed && (
                  <span
                    className="font-mono text-[10px] uppercase px-2 py-0.5 rounded"
                    style={{
                      background: "rgba(167,139,250,0.12)",
                      color: "#a78bfa",
                      border: "1px solid rgba(167,139,250,0.3)",
                    }}
                  >
                    &#x1F4D1; Document-Grounded &middot; {documentChunksUsed.chunks} chunks from{" "}
                    {documentChunksUsed.documents} doc{documentChunksUsed.documents !== 1 ? "s" : ""}
                  </span>
                )}
```

- [ ] **Step 7: Verify the app builds**

```bash
cd /Users/nunoandrade/git-repos/forge
npm run build 2>&1 | tail -20
```

Expected: build succeeds with no errors.

- [ ] **Step 8: Commit**

```bash
cd /Users/nunoandrade/git-repos/forge
git add src/app/page.tsx
git commit -m "feat: add document upload UI and document-grounded badge"
```

---

## Task 9: End-to-End Verification

**Files:** None (testing only)

- [ ] **Step 1: Start the dev server**

```bash
cd /Users/nunoandrade/git-repos/forge
npm run dev
```

- [ ] **Step 2: Verify document list endpoint**

```bash
curl -s http://localhost:3000/api/documents | python3 -m json.tool
```

Expected: `{ "documents": [] }` (empty list).

- [ ] **Step 3: Test document upload with a text file**

```bash
echo "This is a test regulation document about mobile money in Cabo Verde. The central bank requires all providers to maintain settlement reserves." > /tmp/test-doc.txt
curl -s -X POST http://localhost:3000/api/documents \
  -F "file=@/tmp/test-doc.txt" | python3 -m json.tool
```

Expected: JSON response with `id`, `name: "test-doc.txt"`, `chunkCount: 1`, `uploadedAt`.

- [ ] **Step 4: Verify document appears in list**

```bash
curl -s http://localhost:3000/api/documents | python3 -m json.tool
```

Expected: `documents` array contains the uploaded document.

- [ ] **Step 5: Test FORGE analysis with document context**

```bash
curl -s -X POST http://localhost:3000/api/forge \
  -H "Content-Type: application/json" \
  -d '{"scenario": "Mobile money interoperability in Cabo Verde", "mode": "stress", "research": false}' | python3 -m json.tool | head -20
```

Expected: response includes `"document_grounded": true` and `"document_chunks_used": { "chunks": 1, "documents": 1 }`.

- [ ] **Step 6: Test document deletion**

Use the document ID from step 3:

```bash
curl -s -X DELETE http://localhost:3000/api/documents/DOC_ID_HERE | python3 -m json.tool
```

Expected: `{ "deleted": true }`.

- [ ] **Step 7: Verify deletion**

```bash
curl -s http://localhost:3000/api/documents | python3 -m json.tool
```

Expected: `{ "documents": [] }`.

- [ ] **Step 8: Test the UI in browser**

Open `http://localhost:3000`:
1. Click "Documents" label to expand the section
2. Upload a PDF or text file via drag-and-drop or click-to-browse
3. Verify document appears in the list with chunk count
4. Run a FORGE analysis — verify "Document-Grounded" badge appears in results
5. Delete the document via the X button
6. Run another analysis — verify badge does NOT appear

- [ ] **Step 9: Commit any fixes discovered during testing**

```bash
cd /Users/nunoandrade/git-repos/forge
git add -A
git commit -m "fix: address issues found during end-to-end RAG testing"
```

Only run this step if fixes were needed. Skip if everything worked.

---

## Task 10: Configure Vercel Environment Variables

**Files:** None (Vercel dashboard only)

- [ ] **Step 1: Add environment variables in Vercel**

In the Vercel project settings (Settings > Environment Variables), add:

| Variable | Value | Environments |
|----------|-------|-------------|
| `UPSTASH_VECTOR_REST_URL` | From Upstash console | Production, Preview |
| `UPSTASH_VECTOR_REST_TOKEN` | From Upstash console | Production, Preview |
| `OPENAI_API_KEY` | OpenAI API key | Production, Preview |

- [ ] **Step 2: Add BLOB_READ_WRITE_TOKEN if not already set**

Vercel Blob requires a `BLOB_READ_WRITE_TOKEN` environment variable. If using Vercel's Blob storage integration, this is auto-provisioned when you add the Blob store to the project via the Vercel dashboard (Storage > Create > Blob).

- [ ] **Step 3: Push to deploy**

```bash
cd /Users/nunoandrade/git-repos/forge
git push origin main
```

Wait for Vercel auto-deploy to complete. Verify the deployed site loads and the document upload section works.
