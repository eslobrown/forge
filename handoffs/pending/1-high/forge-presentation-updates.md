# FORGE — Presentation Updates Handoff

**Created:** 2026-03-31
**Updated:** 2026-03-31 16:30
**Priority:** HIGH — Joseph presents to Cape Verdean government Wednesday April 2
**Repo:** github.com/eslobrown/forge
**Local path:** /Users/nunoandrade/git-repos/forge
**Deployed:** Vercel (auto-deploys from main branch)
**Vercel env vars:** ANTHROPIC_API_KEY, PERPLEXITY_API_KEY

---

## Current State

**RAG document layer plan approved.** Design spec and implementation plan saved:
- Spec: `docs/superpowers/specs/2026-03-31-rag-document-layer-design.md`
- Plan: `docs/2026-03-31-RAG-DOCUMENT-LAYER.md`

All 4 simulation modes, bilingual output, Perplexity research, PDF download, and featured analysis are working. The RAG document layer is the next feature to build.

## Next Steps — Implement RAG Document Layer

The plan has 11 tasks (Tasks 0-10). Key phases:

1. **Task 0:** Install dependencies (`@upstash/vector`, `openai`, `@vercel/blob`, `pdf-parse`) and configure env vars
2. **Tasks 1-4:** Build the processing pipeline — text chunker, PDF extraction, OpenAI embedding wrapper, Upstash Vector store wrapper
3. **Tasks 5-6:** Create API routes — `POST/GET /api/documents` and `DELETE /api/documents/[id]`
4. **Task 7:** Integrate RAG retrieval into existing `POST /api/forge` route
5. **Task 8:** Add collapsible document upload UI and "Document-Grounded" badge to page.tsx
6. **Task 9:** End-to-end verification (curl tests + browser testing)
7. **Task 10:** Configure Vercel env vars (Upstash, OpenAI, Blob token) and deploy

**Pre-requisites before starting:**
- Create an Upstash Vector index (1536 dimensions, cosine similarity) via console.upstash.com
- Have an OpenAI API key ready for text-embedding-3-small
- Add Vercel Blob store to the Vercel project (auto-provisions BLOB_READ_WRITE_TOKEN)

## What This Is

FORGE is a structural decision intelligence tool built for Joseph Andrade (pen name: Augusto Bartolomeu) to demo to Dr. Pedro Lopes, Secretary of State for the Digital Economy in Cabo Verde. It's built on Joseph's Multi-Simulation Thesis (MST) — a philosophy-of-physics framework that applies constraint-mapping logic to real-world policy analysis.

The app takes a scenario (e.g., "Cabo Verde mobile money interoperability"), runs it through one of four MST simulation modes, and produces a structured analysis identifying structural constraints, dead/live/conditional branches, early warnings, and recommendations.

## Architecture

**Stack:** Next.js 15.5 + Tailwind CSS 4 + Anthropic SDK + Perplexity API, deployed on Vercel.

**3 source files that matter (pre-RAG):**

| File | Lines | Purpose |
|------|-------|---------|
| `src/app/page.tsx` | 1349 | Entire frontend — all UI, all 4 result renderers, print CSS |
| `src/app/api/forge/route.ts` | 380 | API route — Perplexity research + Claude analysis + bilingual output |
| `src/app/featured-analysis.json` | ~800 | Pre-baked bilingual analysis that loads on page open |

**New files for RAG layer:**

| File | Purpose |
|------|---------|
| `src/lib/chunker.ts` | Text chunking (~500 tokens, paragraph/sentence split) |
| `src/lib/embeddings.ts` | OpenAI text-embedding-3-small wrapper |
| `src/lib/vector-store.ts` | Upstash Vector upsert/query/delete |
| `src/lib/pdf-extract.ts` | PDF + plain text extraction |
| `src/app/api/documents/route.ts` | POST (upload) + GET (list) |
| `src/app/api/documents/[id]/route.ts` | DELETE |

## Four Simulation Modes

| Mode | MST Concept | What It Does |
|------|-------------|-------------|
| **Ancestor Simulation** | Reality as inherited memory | Traces how the system got here — lineage, hidden forks, path dependencies, inherited assumptions |
| **Consciousness Lab** | Reality as observer experiment | Maps how different stakeholders perceive the same proposal differently — blind spots, coherence conflicts |
| **Stress Test** | Reality under overflow load | Breaks the system on purpose — constraints, dead/live/conditional branches, stress tests, early warnings |
| **Narrative Engine** | Reality as generated story | Reveals the structural story vs. the official story — narrative gaps, stakeholder stories, "the real story" |

## What's Working

- All 4 simulation modes generate and render correctly
- Perplexity Deep Research enrichment (toggle on/off)
- Bilingual output (EN/PT) in a single API call — instant toggle
- Example scenarios in both languages, switch with language toggle
- Featured analysis pre-loaded (bilingual, baked into build via featured-analysis.json)
- PDF download via print stylesheet (white background, black text, section dividers, page breaks)
- `{}` button copies analysis JSON to clipboard for updating featured-analysis.json
- localStorage caches latest analysis for page reload persistence

## Known Issues

### PDF footer (copyright + page numbers)
The `@page { @bottom-left / @bottom-right }` CSS rules for running footers work in Chrome but not all browsers. If the footer doesn't appear, Joseph should use Chrome to generate the PDF.

### page.tsx is 1349 lines
The entire frontend is one file. If continued development happens, it should be split into components.

### Token budget concern
Bilingual output requires ~2x tokens. Narrative Engine produces the longest output. With max_tokens=12000 it should fit, but if a Narrative Engine bilingual analysis truncates, the error message says "Analysis was too long."

## Key Context

- Joseph publishes under pen name **Augusto Bartolomeu**
- The pitch is to **Dr. Pedro Lopes**, Secretário de Estado para a Economia Digital, Ministério das Finanças, República de Cabo Verde
- Joseph is also approaching **Women in Tech Cabo Verde** for the technical build side
- The MST paper is published on PhilArchive/Zenodo (DOI: 10.5281/zenodo.19116008)
- The API uses **Claude Sonnet 4.6** (`claude-sonnet-4-6`)
- Budget constraint: ~$20 total for API tokens

## Joseph's Presentation Documents

All in `/Users/nunoandrade/Desktop/Joseph Andrade/`:
- `The Multi-Simulation Thesis v3.docx` — The underlying academic paper (MST)
- `Forge_PedroLopes_CV.pdf` — The pitch letter to Dr. Pedro Lopes
- `How Each Branch Works FORGE.pdf` — Explains the 4 modes + includes the original React prototype code

## Modified Files This Session

- `docs/superpowers/specs/2026-03-31-rag-document-layer-design.md` (new — design spec)
- `docs/superpowers/plans/2026-03-31-rag-document-layer.md` (new — implementation plan)
- `docs/2026-03-31-RAG-DOCUMENT-LAYER.md` (new — plan copy at standard location)
