# FORGE — Presentation Updates Handoff

**Created:** 2026-03-31
**Priority:** HIGH — Joseph presents to Cape Verdean government Wednesday April 2
**Repo:** github.com/eslobrown/forge
**Local path:** /Users/nunoandrade/git-repos/forge
**Deployed:** Vercel (auto-deploys from main branch)
**Vercel env vars:** ANTHROPIC_API_KEY, PERPLEXITY_API_KEY

---

## What This Is

FORGE is a structural decision intelligence tool built for Joseph Andrade (pen name: Augusto Bartolomeu) to demo to Dr. Pedro Lopes, Secretary of State for the Digital Economy in Cabo Verde. It's built on Joseph's Multi-Simulation Thesis (MST) — a philosophy-of-physics framework that applies constraint-mapping logic to real-world policy analysis.

The app takes a scenario (e.g., "Cabo Verde mobile money interoperability"), runs it through one of four MST simulation modes, and produces a structured analysis identifying structural constraints, dead/live/conditional branches, early warnings, and recommendations.

## Architecture

**Stack:** Next.js 15.5 + Tailwind CSS 4 + Anthropic SDK + Perplexity API, deployed on Vercel.

**3 source files that matter:**

| File | Lines | Purpose |
|------|-------|---------|
| `src/app/page.tsx` | 1349 | Entire frontend — all UI, all 4 result renderers, print CSS |
| `src/app/api/forge/route.ts` | 380 | API route — Perplexity research + Claude analysis + bilingual output |
| `src/app/featured-analysis.json` | ~800 | Pre-baked bilingual analysis that loads on page open |

**Supporting files:**
- `scripts/forge_analysis.py` — CLI tool to run analyses locally (uses ANTHROPIC_API_KEY env var)
- `scripts/outputs/` — gitignored, stores local analysis JSON files

**Flow:**
1. User enters scenario + selects simulation mode (Ancestor/Consciousness/Stress/Narrative)
2. Frontend calls `/api/forge` with `{ scenario, mode, research: true }`
3. API route calls Perplexity sonar API to gather real-world context
4. API route sends scenario + research context + mode-specific prompt to Claude Sonnet 4.6
5. Claude returns bilingual JSON `{ en: {...}, pt: {...} }`
6. Frontend displays results, user toggles EN/PT instantly
7. Successful analyses cached in localStorage + can be copied via `{}` button to update featured-analysis.json

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

## What Needs Work / Known Issues

### PDF footer (copyright + page numbers)
The `@page { @bottom-left / @bottom-right }` CSS rules for running footers work in Chrome but not all browsers. If the footer doesn't appear, Joseph should use Chrome to generate the PDF. May want to verify this renders correctly on the machine Joseph will demo from.

### Featured analysis update workflow
To update the featured analysis that loads on every device:
1. Generate the analysis on the deployed site
2. Click `{}` button (copies JSON to clipboard)
3. Replace contents of `src/app/featured-analysis.json`
4. Commit, push → Vercel auto-deploys
This is manual but reliable. Could be automated with Vercel KV or Blob storage in the future.

### page.tsx is 1349 lines
The entire frontend is one file. If continued development happens, it should be split:
- `components/StressResults.tsx`, `components/AncestorResults.tsx`, etc.
- `components/Section.tsx`, `components/Badge.tsx`
- `lib/constants.ts` (scenarios, colors, loading steps)

### Potential token budget concern
Bilingual output requires ~2x tokens. Narrative Engine produces the longest output. With max_tokens=12000 it should fit, but if a Narrative Engine bilingual analysis truncates, the error message says "Analysis was too long." Stress Test is the safest mode for bilingual.

### Future features discussed but not built
- **RAG document layer** — government uploads regulations/policies, FORGE validates against them. Discussed as next phase after the presentation. Would use vector DB (Supabase pgvector free tier).
- **Perplexity Deep Research** can be slow (5-15 seconds). Could pre-fetch research for known scenarios.

## Joseph's Presentation Documents

All in `/Users/nunoandrade/Desktop/Joseph Andrade/`:
- `The Multi-Simulation Thesis v3.docx` — The underlying academic paper (MST)
- `Forge_PedroLopes_CV.pdf` — The pitch letter to Dr. Pedro Lopes
- `How Each Branch Works FORGE.pdf` — Explains the 4 modes + includes the original React prototype code

## Key Context

- Joseph publishes under pen name **Augusto Bartolomeu**
- The pitch is to **Dr. Pedro Lopes**, Secretário de Estado para a Economia Digital, Ministério das Finanças, República de Cabo Verde
- Joseph is also approaching **Women in Tech Cabo Verde** for the technical build side
- The MST paper is published on PhilArchive/Zenodo (DOI: 10.5281/zenodo.19116008)
- The API uses **Claude Sonnet 4.6** (`claude-sonnet-4-6`) — good balance of quality, speed, and cost
- Budget constraint: ~$20 total for API tokens

## Demo Flow for the Presentation

1. Open the URL — bilingual featured analysis is already visible
2. Toggle PT to show Portuguese translation
3. Walk through the Stress Test findings (constraints, branches, warnings)
4. Switch to Narrative Engine, hit Forge — show "The Real Story" output
5. Toggle PT again — same analysis in Portuguese
6. Point out "Research-Enriched" badge — grounded in real data
7. Hit Download PDF — show the clean printable report
8. Invite Dr. Lopes to type his own scenario
