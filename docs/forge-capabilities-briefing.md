# FORGE — Platform Capabilities Briefing

**Prepared for:** Call with Dr. Pedro Lopes, Secretario de Estado para a Economia Digital
**Date:** April 1, 2026

---

## Part 1: For Technical Audiences

### What FORGE Does Beyond the Theory

The Multi-Simulation Thesis provides the analytical framework. The platform adds two engineering layers that transform FORGE from a methodology into a production-grade decision tool: **real-time research grounding** and **document-grounded analysis**.

### Capability 1: Perplexity Deep Research Integration

**Problem it solves:** AI analysis without current data produces plausible-sounding but ungrounded output. A constraint-mapping tool that identifies "walls" must know where the actual walls are — not where walls existed in its training data.

**How it works:**
- Before every FORGE analysis, the platform issues a research query to Perplexity's Deep Research API
- Perplexity crawls live sources — current regulations, recent policy changes, published statistics, comparable implementations in other jurisdictions — and returns a structured research brief
- This research context is injected into the Claude analysis prompt as primary source material
- The AI is instructed to reference specific data points, laws, and precedents from the research — not generate generic analysis

**What this means in practice:**
- When FORGE analyzes Cabo Verde's mobile money interoperability framework, it works with the *actual* BCV regulatory environment, *real* mobile penetration statistics across the 10 islands, and *documented* outcomes from comparable implementations in East Africa and the Pacific
- Constraints identified are real regulatory and infrastructure constraints, not hypothetical ones
- The "Research-Enriched" badge on the output confirms that live research was used

**Why this matters for the Secretariat:**
- Every analysis reflects the world as it is today, not as it was when the AI was trained
- Policy constraints change — new regulations, new bilateral agreements, new infrastructure deployments. FORGE's research layer captures these automatically
- Analyses can be re-run as conditions change, producing updated constraint maps without manual research

### Capability 2: Document Upload and RAG (Retrieval-Augmented Generation)

**Problem it solves:** Generic research catches public information. But the most critical constraints in policy decisions live in internal documents — draft frameworks, regulatory impact assessments, technical specifications, inter-ministry agreements, budget documents. An analysis tool that cannot read these is structurally blind to exactly the constraints that matter most.

**How it works:**
- Users upload PDF, text, or markdown documents through the FORGE interface
- Each document is processed through a pipeline:
  1. **Text extraction** — content is pulled from PDFs preserving structure
  2. **Chunking** — documents are split into ~500-token segments with overlap, preserving paragraph and sentence boundaries
  3. **Embedding** — each chunk is converted to a 1536-dimensional vector using OpenAI's text-embedding-3-small model
  4. **Vector storage** — embeddings are stored in Upstash Vector (a managed vector database) with document attribution metadata
- At analysis time, the user's scenario is embedded and compared against all stored document chunks using cosine similarity
- The top-k most relevant chunks (above a 0.3 similarity threshold) are retrieved and injected into the prompt as "Document Context" — with source attribution
- Document context takes precedence over research context when they conflict

**What this means in practice:**
- The Secretariat uploads Cabo Verde's draft Digital Economy Strategy, the BCV's payment systems regulatory framework, relevant ECOWAS interoperability standards, and internal technical assessments
- FORGE's analysis now maps constraints against *those specific documents* — not against generic knowledge of how mobile money frameworks work elsewhere
- The output references specific sections of uploaded documents, making the constraint mapping directly traceable to the Secretariat's own source material
- The "Document-Grounded" badge confirms which documents and how many text segments were used

**Why this matters for the Secretariat:**
- Analyses become institution-specific, not generic. The constraints FORGE finds are constraints in *Cabo Verde's* regulatory architecture, not in mobile money frameworks generally
- Confidential documents never leave the analysis environment — they are chunked and embedded, not stored as readable text
- As policy documents evolve, new versions can be uploaded and FORGE automatically uses the latest material
- Multiple stakeholders can upload documents from their domains (telecom regulation, banking supervision, fiscal policy) and FORGE synthesizes constraints across all of them

### Capability 3: Four Simulation Modes

Each mode applies the MST framework from a different analytical angle. All four benefit equally from research grounding and document context:

| Mode | Analytical Angle | What the Secretariat Gets |
|------|-----------------|--------------------------|
| **Stress Test** | Adversarial pressure testing | Hard constraints, dead/live/conditional branches, early warning signals |
| **Ancestor Simulation** | Historical path dependency analysis | How past decisions constrain present options, which foreclosed paths are recoverable |
| **Consciousness Lab** | Multi-stakeholder perception mapping | Where different stakeholders (BCV, telcos, fintechs, unbanked populations) see fundamentally different realities |
| **Narrative Engine** | Structural story vs. official story | Where the stated policy narrative diverges from what the architecture actually produces |

### Capability 4: Bilingual Output (EN/PT)

Every analysis is generated in both English and European Portuguese in a single API call. Users toggle between languages instantly. This is not machine translation — both versions are generated natively by the AI, ensuring technical terminology is correct in both languages.

### Architecture Summary

```
User Scenario
     |
     v
[Perplexity Deep Research] --> Live research context
     |
[Document RAG Retrieval]  --> Relevant chunks from uploaded documents
     |
     v
[Claude Sonnet 4.6 + MST Framework + Selected Simulation Mode]
     |
     v
Bilingual Structured Analysis (EN/PT)
with source attribution and constraint classification
```

---

## Part 2: In Plain Language

### What FORGE Actually Does (No Jargon)

Joseph's theory — the Multi-Simulation Thesis — gives FORGE its brain: a way of thinking about decisions that finds the hard limits, not the best guesses. My contribution was giving that brain **eyes and ears**.

### The Two Things I Built and Why They Matter

#### 1. Live Research — FORGE Knows What's Happening Right Now

**The problem:** AI tools are trained on old data. If you ask one to analyze Cabo Verde's mobile money plans, it might reference regulations that were updated six months ago, or miss a new agreement with ECOWAS entirely. It sounds smart, but it's working with yesterday's map.

**What FORGE does instead:** Before every analysis, FORGE goes out and researches the topic in real time. It reads current news, finds the latest regulations, looks up actual statistics, and checks what happened when other countries tried similar things. Then it uses all of that as the foundation for its analysis.

**Why this matters for Dr. Lopes:** When FORGE tells you that a particular approach to mobile money interoperability hits a regulatory wall, it's referring to the *actual* regulation — not a regulation it vaguely remembers from its training data. The constraints it identifies are real and current.

#### 2. Document Upload — FORGE Can Read Your Own Files

**The problem:** Even with live research, FORGE can only find publicly available information. But the most important details — draft policy frameworks, internal assessments, technical specifications, budget documents — are not public. Without these, any analysis is working with incomplete information.

**What FORGE does instead:** You can upload your own documents — PDFs, text files, reports — directly into FORGE. The system reads them, understands what's in them, and then uses that knowledge when running analyses. If you upload Cabo Verde's draft digital economy strategy and the BCV's payment systems framework, FORGE will analyze your mobile money scenario against *those specific documents*, not against generic knowledge.

**Why this matters for Dr. Lopes:**
- **It makes the analysis yours.** FORGE isn't giving you a generic report about mobile money. It's stress-testing *your specific framework* against *your specific regulatory environment* using *your own documents* as the source of truth.
- **It finds what consultants miss.** When FORGE identifies a conflict between two uploaded documents — say, a technical specification that assumes real-time settlement but a regulatory framework that requires batch processing — it surfaces that before anyone commits budget to building it.
- **Your documents stay private.** The system processes the content for analysis but doesn't store readable copies. The documents are converted into mathematical representations that the AI can search but that cannot be reverse-engineered back into the original text.

#### How It All Works Together

Imagine Dr. Lopes wants to evaluate a proposed digital identity system for Cabo Verde:

1. He types the scenario into FORGE
2. FORGE automatically researches the latest on digital ID implementations worldwide, Cabo Verde's current infrastructure, relevant regulations
3. FORGE checks the uploaded documents — perhaps the national ICT strategy, the data protection bill draft, and a World Bank assessment of CV's digital readiness
4. FORGE runs the analysis through one of four lenses (stress test, historical analysis, stakeholder perception, or narrative analysis)
5. The result identifies specific constraints — things like "the data protection bill draft requires local hosting, but the proposed architecture depends on cloud providers with no local presence" — with references to the actual documents
6. Everything is available in both English and Portuguese instantly

#### The Bottom Line

Joseph built the methodology — a new way of thinking about whether a decision can structurally succeed. What I built ensures that methodology is working with real, current, institution-specific information rather than generic AI knowledge.

**Without these capabilities:** FORGE is a smart framework that produces intelligent-sounding but generic analysis.

**With these capabilities:** FORGE is a decision tool grounded in your actual regulatory environment, your actual documents, and today's actual reality. The constraints it finds are your constraints, not hypothetical ones.

That is the difference between an academic methodology and a working governance tool.
