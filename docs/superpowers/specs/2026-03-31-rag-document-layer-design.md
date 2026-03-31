# RAG Document Layer — Design Spec

## Purpose

Add a document upload and retrieval-augmented generation (RAG) layer to FORGE so that analyses are grounded in real documents (regulations, policies, research papers) rather than relying solely on Claude's training data and Perplexity web research.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| File types | PDF + plain text (.txt, .md) | PDF covers government docs; plain text is free to support |
| File storage | Vercel Blob | Built-in Vercel integration, 500MB free tier, files persist across deploys |
| Vector DB | Upstash Vector | Serverless REST API, no connection pooling issues on Vercel, free tier (10k vectors) |
| Embedding model | OpenAI text-embedding-3-small | 1536 dimensions, $0.02/1M tokens, same model used by ILLIXIS Maya Brain |
| Processing timing | Upload-time | Extract, chunk, embed on upload so analyses stay fast |
| Document scope | Global pool | All uploaded documents are included in every analysis — no per-analysis selection |
| Chunking strategy | ~500 tokens with ~50 token overlap | Split on paragraph boundaries, fall back to sentence boundaries for long paragraphs |
| UI placement | Collapsible section | Between example scenarios and scenario textarea, collapsed by default with count badge |

## New Dependencies

```
@upstash/vector        — Upstash Vector SDK
openai                 — OpenAI SDK (embeddings only)
@vercel/blob           — Vercel Blob file storage
pdf-parse              — PDF text extraction
```

## New Environment Variables

```
UPSTASH_VECTOR_REST_URL    — Upstash Vector endpoint
UPSTASH_VECTOR_REST_TOKEN  — Upstash Vector auth token
OPENAI_API_KEY             — OpenAI API key (for embeddings)
```

These must be configured in Vercel project settings alongside existing `ANTHROPIC_API_KEY` and `PERPLEXITY_API_KEY`.

## New API Routes

### POST /api/documents — Upload

Receives a file via multipart form data. Validates type (PDF, .txt, .md) and size (max 10MB). Extracts text, chunks it, embeds all chunks, stores embeddings in Upstash Vector, and writes a document manifest to Vercel Blob.

**Request:** multipart/form-data with `file` field.

**Response:**
```json
{
  "id": "doc_abc123",
  "name": "Cabo Verde Telecom Regulation 2024.pdf",
  "chunkCount": 14,
  "uploadedAt": "2026-03-31T12:00:00Z"
}
```

### GET /api/documents — List

Returns all uploaded documents.

**Response:**
```json
{
  "documents": [
    {
      "id": "doc_abc123",
      "name": "Cabo Verde Telecom Regulation 2024.pdf",
      "size": 245000,
      "chunkCount": 14,
      "uploadedAt": "2026-03-31T12:00:00Z"
    }
  ]
}
```

### DELETE /api/documents/[id] — Delete

Removes document manifest from Vercel Blob and all associated chunk vectors from Upstash Vector.

**Response:** `{ "deleted": true }`

### POST /api/forge — Modified

Existing route. Before calling Claude, adds a document retrieval step:

1. Embed the scenario text with OpenAI text-embedding-3-small
2. Query Upstash Vector for top 10 chunks (cosine similarity, threshold 0.3)
3. Inject retrieved chunks as a `DOCUMENT CONTEXT` block in the Claude prompt
4. Add `document_grounded` and `document_chunks_used` fields to the response

## File Structure

```
src/app/api/
  forge/route.ts                ← existing, modified
  documents/route.ts            ← new (POST upload + GET list)
  documents/[id]/route.ts       ← new (DELETE)
```

## Document Processing Pipeline

On upload (`POST /api/documents`):

1. **Receive** — parse multipart form data, validate file type and size (max 10MB)
2. **Extract text** — PDF via `pdf-parse`, plain text as UTF-8
3. **Generate document ID** — `doc_` + random string
4. **Chunk** — split into ~500 token chunks with ~50 token overlap:
   - Split on paragraph boundaries (double newline)
   - If a paragraph exceeds 500 tokens, split on sentence boundaries
   - Each chunk gets metadata: `{ documentId, documentName, chunkIndex }`
5. **Embed** — batch-embed all chunks via OpenAI text-embedding-3-small
6. **Store vectors** — upsert each chunk into Upstash Vector with embedding + metadata
7. **Store manifest** — write document metadata (id, name, filename, chunk count, timestamp) as JSON to Vercel Blob at path `documents/{id}.json`

## Prompt Integration

The Claude prompt gains a new context block. Documents come before Perplexity research because they are the primary source of truth.

**Updated prompt structure:**

```
System: BASE_SYSTEM + MODE_PROMPT
User:   Scenario text
        + DOCUMENT CONTEXT (top 10 RAG chunks)
        + RESEARCH CONTEXT (Perplexity)
        + Output schema (bilingual JSON)
```

**Document context format:**

```
--- DOCUMENT CONTEXT (uploaded reference documents) ---

[From: Cabo Verde Telecom Regulation 2024.pdf]
Section 3.2: All licensed mobile payment providers must maintain
a minimum settlement reserve of 15% of total transaction volume...

[From: Digital Economy Strategy 2025.pdf]
Priority 4: Achieve 85% financial inclusion by 2028 through
mobile-first payment infrastructure across all 10 islands...

--- END DOCUMENT CONTEXT ---
```

The BASE_SYSTEM prompt gets additional instruction: "When document context is provided, treat it as the primary source of truth. Reference specific documents and sections in your analysis. Document context takes precedence over research context when they conflict."

## UI Changes

### Document Section (Collapsible)

Positioned between the example scenarios section and the scenario textarea. Collapsed by default.

**Collapsed state:** Shows label "Documents" with a count badge (e.g., "3") if documents are uploaded. Clicking expands the section.

**Expanded state:**
- Drag-and-drop zone with click-to-browse fallback
- File type hint: "PDF or text files, max 10MB"
- Upload progress indicator (processing... extracting... embedding...)
- List of uploaded documents, each showing:
  - Document name
  - Chunk count
  - Delete button (x)

**Styling:** Matches FORGE's existing design language — monospace labels, dark glass cards, `#00f5c8` accent color, `rgba(255,255,255,0.02)` card backgrounds.

### Results Badge

A "Document-Grounded" badge appears in the results header alongside the existing "Research-Enriched" badge when RAG chunks were included in the analysis. Shows chunk and document count (e.g., "Document-Grounded · 8 chunks from 2 docs"). Badge also renders in PDF print output.

## Upstash Vector Index Configuration

Created once via Upstash console:
- **Dimensions:** 1536
- **Similarity metric:** Cosine

Each vector is stored with metadata:
```json
{
  "documentId": "doc_abc123",
  "documentName": "Cabo Verde Telecom Regulation 2024.pdf",
  "chunkIndex": 3,
  "text": "The actual chunk text content..."
}
```

## Cost Estimate

At the scale of 2-5 documents (~100 pages total):
- **Embedding on upload:** ~50k tokens = ~$0.001
- **Embedding per analysis query:** ~200 tokens = ~$0.000004
- **Upstash Vector:** free tier (10k vectors)
- **Vercel Blob:** free tier (500MB)
- **Total marginal cost:** effectively zero on top of existing Claude + Perplexity costs

## What This Does NOT Include

- Per-analysis document selection (all docs are global pool)
- Document categories or tagging
- OCR for scanned PDFs (pdf-parse extracts embedded text only)
- Authentication or multi-user document isolation
- Chunking strategy tuning UI
