# Handoff: FORGE Presentation Updates

**Branch:** main
**Priority:** medium
**Created:** 2026-03-31 16:30
**Updated:** 2026-04-01 01:00

---

## Current State

**RAG document layer fully implemented and deployed.** All work from the original plan (Tasks 0-10) is complete and live on Vercel.

### What Was Built This Session

1. **RAG Document Layer (complete)**
   - Text chunker (`src/lib/chunker.ts`) — ~500 token chunks with paragraph/sentence splitting
   - PDF extractor (`src/lib/pdf-extract.ts`) — pdfjs-dist with DOMMatrix polyfill for serverless
   - OpenAI embedding wrapper (`src/lib/embeddings.ts`) — text-embedding-3-small (1536 dims)
   - Upstash Vector store wrapper (`src/lib/vector-store.ts`) — upsert/query/delete
   - Document upload + list API (`src/app/api/documents/route.ts`) — with step-specific error messages
   - Document delete API (`src/app/api/documents/[id]/route.ts`)
   - RAG retrieval integrated into forge analysis route (`src/app/api/forge/route.ts`)
   - Collapsible document upload UI with drag-drop + document-grounded badge in `page.tsx`

2. **Serverless PDF Fixes (4 iterations)**
   - pdf-parse v2 uses pdfjs-dist which needed: `serverExternalPackages` in next.config.ts, `outputFileTracingIncludes` for worker files, `DOMMatrix` polyfill, dynamic import to avoid module-level initialization
   - Final working config in `next.config.ts` and `src/lib/pdf-extract.ts`

3. **Per-Mode Featured Analyses**
   - All 4 simulation modes (stress, ancestor, consciousness, narrative) generated with Perplexity research + document grounding from 10 uploaded PDFs
   - `src/app/featured-analyses.json` — bilingual (EN/PT) featured analysis per mode
   - `scripts/generate-featured.mjs` — script to regenerate from live API
   - `page.tsx` updated to load per-mode featured analysis when switching modes

4. **UI Polish**
   - Removed Perplexity branding from research toggle
   - Simplified PDF footer copyright to "© 2026 Augusto Bartolomeu"

5. **Presentation Briefing**
   - `docs/forge-capabilities-briefing.md` — two-part doc (techspeak + layman's terms) for the call with Dr. Pedro Lopes

### External Services Configured

- **Upstash Vector** — index `forge-docs`, 1536 dims, cosine, us-east-1
- **Vercel Blob** — store `forge-documents`, public access, iad1
- **OpenAI** — API key for text-embedding-3-small
- 10 PDF documents uploaded to the RAG database

## What's Working

- All 4 simulation modes with bilingual output
- Perplexity Deep Research enrichment
- Document upload (PDF, TXT, MD) with chunking, embedding, vector storage
- Document-grounded analysis with source attribution
- Per-mode featured analyses pre-loaded on page open
- PDF download with copyright footer
- `{}` button copies analysis JSON to clipboard
- localStorage caches latest analysis

## Next Steps

1. Post-presentation: gather feedback from Dr. Lopes call and decide on next features
2. Consider splitting `page.tsx` (now ~1500 lines) into components if further development continues
3. The old `featured-analysis.json` can be removed once `featured-analyses.json` is confirmed working

## Modified Files This Session

- `next.config.ts` — serverExternalPackages, outputFileTracingIncludes
- `src/lib/chunker.ts` (new)
- `src/lib/embeddings.ts` (new)
- `src/lib/pdf-extract.ts` (new)
- `src/lib/vector-store.ts` (new)
- `src/app/api/documents/route.ts` (new)
- `src/app/api/documents/[id]/route.ts` (new)
- `src/app/api/forge/route.ts` — RAG retrieval integration
- `src/app/page.tsx` — document UI, per-mode featured analyses, branding cleanup
- `src/app/featured-analyses.json` (new)
- `scripts/generate-featured.mjs` (new)
- `docs/forge-capabilities-briefing.md` (new)
- `package.json` / `package-lock.json` — new dependencies

## Notes

- Joseph presents to Dr. Pedro Lopes (Secretario de Estado para a Economia Digital, Cabo Verde) on April 2, 2026 at 7 AM
- Nuno joining the call to discuss the technical capabilities (research grounding + document upload)
- Briefing doc at `docs/forge-capabilities-briefing.md` has both technical and layman versions
- Budget constraint: ~$20 total for API tokens
