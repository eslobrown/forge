"use client";

import { useState } from "react";
import featuredData from "./featured-analysis.json";

/* ── Mode types ── */
const PURPOSES = [
  {
    id: "ancestor",
    label: "Ancestor Simulation",
    glyph: "\u2295",
    desc: "Reality as inherited memory",
  },
  {
    id: "consciousness",
    label: "Consciousness Lab",
    glyph: "\u25CE",
    desc: "Reality as observer experiment",
  },
  {
    id: "stress",
    label: "Stress Test",
    glyph: "\u26A1",
    desc: "Reality under overflow load",
  },
  {
    id: "narrative",
    label: "Narrative Engine",
    glyph: "\u221E",
    desc: "Reality as generated story",
  },
] as const;

type PurposeId = (typeof PURPOSES)[number]["id"];

/* ── Shared types ── */
interface StressAnalysis {
  scenario_summary: string;
  constraints: {
    name: string;
    type: string;
    description: string;
    severity: "blocking" | "limiting" | "shaping";
  }[];
  branches: {
    name: string;
    status: "dead" | "live" | "conditional";
    status_reason: string;
    stress_test: string | null;
    prerequisite: string | null;
  }[];
  early_warnings: string[];
  recommendations: string[];
  conventional_analysis_sufficient: boolean;
  conventional_analysis_note?: string;
}

interface AncestorAnalysis {
  scenario_summary: string;
  lineage: {
    event: string;
    period: string;
    consequence: string;
    visibility: string;
  }[];
  hidden_forks: {
    fork_point: string;
    path_taken: string;
    path_foreclosed: string;
    recoverable: boolean;
  }[];
  path_dependencies: string[];
  inherited_assumptions: {
    assumption: string;
    still_valid: boolean;
    risk_if_unexamined: string;
  }[];
  synthesis: string;
}

interface ConsciousnessAnalysis {
  scenario_summary: string;
  observers: {
    group: string;
    perspective: string;
    blind_spots: string;
    emotional_reality: string;
  }[];
  meaning_divergences: {
    element: string;
    interpretations: { observer: string; meaning: string }[];
  }[];
  coherence_conflicts: {
    conflict: string;
    why_irreconcilable: string;
    consequence: string;
  }[];
  perception_risks: string[];
  synthesis: string;
}

interface NarrativeAnalysis {
  scenario_summary: string;
  official_narrative: {
    story: string;
    promised_outcome: string;
    protagonist: string;
  };
  structural_narrative: {
    story: string;
    probable_outcome: string;
    actual_beneficiary: string;
  };
  narrative_gaps: {
    gap: string;
    what_is_obscured: string;
    consequence: string;
  }[];
  stakeholder_stories: {
    group: string;
    their_story: string;
    role_assigned: string;
  }[];
  future_narrative: string;
  synthesis: string;
}

type AnalysisResult =
  | StressAnalysis
  | AncestorAnalysis
  | ConsciousnessAnalysis
  | NarrativeAnalysis;

/* ── Constants ── */
const EXAMPLE_SCENARIOS = [
  {
    label: "Mobile Money Interoperability",
    text: "Cabo Verde is designing a mobile money interoperability framework to connect multiple payment providers (banks, fintechs, telcos) through a shared settlement layer. The framework would require all licensed providers to connect to a central switch operated by the central bank, with real-time settlement and standardized APIs. The goal is financial inclusion for the ~30% unbanked population across 10 islands with varying connectivity.",
  },
  {
    label: "National Digital ID Rollout",
    text: "A small island nation of 600,000 people is planning to roll out a national digital identity system. The system would replace physical ID cards with a mobile-first digital credential, used for government services, banking KYC, and potentially voting. The government wants to build on open-source standards (OpenID Connect) and host the infrastructure locally rather than depending on foreign cloud providers. Budget is limited to \u20AC2M for the first phase.",
  },
  {
    label: "AI Governance Framework",
    text: "A developing nation wants to create a national AI governance framework that positions it as a regional leader in responsible AI adoption. The framework would cover public sector AI use, private sector compliance, data protection, and AI skills development. The country has limited technical capacity (fewer than 200 AI practitioners), no existing data protection law, and wants to avoid simply copying EU or US frameworks.",
  },
];

const severityColor: Record<string, string> = {
  blocking: "#ef4444",
  limiting: "#f59e0b",
  shaping: "#3b82f6",
};

const statusColor: Record<string, string> = {
  dead: "#ef4444",
  live: "#22c55e",
  conditional: "#f59e0b",
};

const statusIcon: Record<string, string> = {
  dead: "\u2716",
  live: "\u2714",
  conditional: "\u25C6",
};

const roleColor: Record<string, string> = {
  protagonist: "#22c55e",
  displaced: "#ef4444",
  invisible: "#6b7280",
  antagonist: "#f59e0b",
};

const modeColor: Record<PurposeId, string> = {
  ancestor: "#00f5c8",
  consciousness: "#a78bfa",
  stress: "#f59e0b",
  narrative: "#00f5c8",
};

/* ── Loading step labels per mode ── */
const LOADING_STEPS: Record<PurposeId, string[]> = {
  ancestor: [
    "Tracing system lineage...",
    "Identifying hidden forks...",
    "Mapping path dependencies...",
    "Reconstructing inherited memory...",
  ],
  consciousness: [
    "Mapping observer perspectives...",
    "Detecting meaning divergence...",
    "Analyzing coherence conflicts...",
    "Resolving perceptual landscape...",
  ],
  stress: [
    "Extracting structural constraints...",
    "Mapping decision branches...",
    "Running adversarial stress tests...",
    "Synthesizing findings...",
  ],
  narrative: [
    "Reading official narrative...",
    "Extracting structural story...",
    "Mapping narrative gaps...",
    "Revealing the untold story...",
  ],
};

/* ── Render helpers per mode ── */
function StressResults({ data }: { data: StressAnalysis }) {
  return (
    <div className="space-y-8">
      <Section label={`${data.constraints.length} Structural Constraints Identified`}>
        <div className="space-y-2">
          {data.constraints.map((c, i) => (
            <div
              key={i}
              className="rounded-lg border px-4 py-3"
              style={{
                borderColor: `${severityColor[c.severity]}33`,
                background: `${severityColor[c.severity]}08`,
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Badge color={severityColor[c.severity]}>{c.severity}</Badge>
                <span className="font-mono text-[10px] uppercase text-white/30">{c.type}</span>
              </div>
              <div className="text-sm font-semibold text-white/90 mb-1">{c.name}</div>
              <div className="text-xs text-white/50 leading-relaxed">{c.description}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section label={`${data.branches.length} Decision Branches Mapped`}>
        <div className="space-y-3">
          {data.branches.map((b, i) => (
            <div
              key={i}
              className="rounded-lg border px-4 py-4"
              style={{
                borderColor: `${statusColor[b.status]}33`,
                background: `${statusColor[b.status]}06`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span style={{ color: statusColor[b.status], fontSize: 14 }}>
                  {statusIcon[b.status]}
                </span>
                <span className="text-sm font-bold text-white/90">{b.name}</span>
                <Badge color={statusColor[b.status]} className="ml-auto">
                  {b.status} branch
                </Badge>
              </div>
              <p className="text-xs text-white/60 leading-relaxed mb-2">{b.status_reason}</p>
              {b.stress_test && (
                <SubSection label="Stress Test Result">
                  <p className="text-xs text-white/50 leading-relaxed">{b.stress_test}</p>
                </SubSection>
              )}
              {b.prerequisite && (
                <SubSection label="Critical Prerequisite">
                  <p className="text-xs text-amber-400/70 leading-relaxed">{b.prerequisite}</p>
                </SubSection>
              )}
            </div>
          ))}
        </div>
      </Section>

      {data.early_warnings.length > 0 && (
        <Section label="Early Warning Signals" newPage>
          <div className="space-y-1">
            {data.early_warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-amber-400/60 leading-relaxed">
                <span className="mt-0.5">&#x26A0;</span>
                <span>{w}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {data.recommendations.length > 0 && (
        <Section label="Recommendations" newPage>
          <div className="space-y-1">
            {data.recommendations.map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-[#00f5c8]/70 leading-relaxed">
                <span className="mt-0.5">&#x2192;</span>
                <span>{r}</span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function AncestorResults({ data }: { data: AncestorAnalysis }) {
  return (
    <div className="space-y-8">
      <Section label={`${data.lineage.length} Lineage Events Traced`}>
        <div className="space-y-2">
          {data.lineage.map((l, i) => (
            <div key={i} className="rounded-lg border border-white/10 px-4 py-3 bg-white/[0.02]">
              <div className="flex items-center gap-2 mb-1">
                <Badge color={l.visibility === "hidden" ? "#f59e0b" : l.visibility === "forgotten" ? "#ef4444" : "#22c55e"}>
                  {l.visibility}
                </Badge>
                <span className="font-mono text-[10px] text-white/30">{l.period}</span>
              </div>
              <div className="text-sm font-semibold text-white/90 mb-1">{l.event}</div>
              <div className="text-xs text-white/50 leading-relaxed">{l.consequence}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section label={`${data.hidden_forks.length} Hidden Forks Identified`}>
        <div className="space-y-2">
          {data.hidden_forks.map((f, i) => (
            <div key={i} className="rounded-lg border border-white/10 px-4 py-3 bg-white/[0.02]">
              <div className="flex items-center gap-2 mb-1">
                <Badge color={f.recoverable ? "#22c55e" : "#ef4444"}>
                  {f.recoverable ? "recoverable" : "foreclosed"}
                </Badge>
              </div>
              <div className="text-sm font-semibold text-white/90 mb-1">{f.fork_point}</div>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <div className="font-mono text-[9px] text-white/30 uppercase mb-1">Path Taken</div>
                  <p className="text-xs text-white/50 leading-relaxed">{f.path_taken}</p>
                </div>
                <div>
                  <div className="font-mono text-[9px] text-white/30 uppercase mb-1">Path Foreclosed</div>
                  <p className="text-xs text-white/50 leading-relaxed">{f.path_foreclosed}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {data.path_dependencies.length > 0 && (
        <Section label="Path Dependencies">
          <div className="space-y-1">
            {data.path_dependencies.map((p, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-amber-400/60 leading-relaxed">
                <span className="mt-0.5">&#x1F517;</span>
                <span>{p}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {data.inherited_assumptions.length > 0 && (
        <Section label="Inherited Assumptions" newPage>
          <div className="space-y-2">
            {data.inherited_assumptions.map((a, i) => (
              <div key={i} className="rounded-lg border border-white/10 px-4 py-3 bg-white/[0.02]">
                <div className="flex items-center gap-2 mb-1">
                  <Badge color={a.still_valid ? "#22c55e" : "#ef4444"}>
                    {a.still_valid ? "still valid" : "outdated"}
                  </Badge>
                </div>
                <div className="text-sm text-white/90 mb-1">{a.assumption}</div>
                <div className="text-xs text-white/50 leading-relaxed">{a.risk_if_unexamined}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section label="Synthesis">
        <p className="text-sm text-white/70 leading-relaxed whitespace-pre-line">{data.synthesis}</p>
      </Section>
    </div>
  );
}

function ConsciousnessResults({ data }: { data: ConsciousnessAnalysis }) {
  return (
    <div className="space-y-8">
      <Section label={`${data.observers.length} Observer Perspectives Mapped`}>
        <div className="space-y-2">
          {data.observers.map((o, i) => (
            <div key={i} className="rounded-lg border border-[#a78bfa33] px-4 py-3 bg-[#a78bfa08]">
              <div className="text-sm font-semibold text-white/90 mb-2">{o.group}</div>
              <div className="text-xs text-white/60 leading-relaxed mb-2">{o.perspective}</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="font-mono text-[9px] text-white/30 uppercase mb-1">Blind Spots</div>
                  <p className="text-xs text-white/50 leading-relaxed">{o.blind_spots}</p>
                </div>
                <div>
                  <div className="font-mono text-[9px] text-white/30 uppercase mb-1">Emotional Reality</div>
                  <p className="text-xs text-[#a78bfa]/70 leading-relaxed">{o.emotional_reality}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {data.meaning_divergences.length > 0 && (
        <Section label="Meaning Divergences">
          <div className="space-y-3">
            {data.meaning_divergences.map((d, i) => (
              <div key={i} className="rounded-lg border border-white/10 px-4 py-3 bg-white/[0.02]">
                <div className="text-sm font-semibold text-white/90 mb-2">{d.element}</div>
                <div className="space-y-1">
                  {d.interpretations.map((interp, j) => (
                    <div key={j} className="flex gap-2 text-xs">
                      <span className="text-[#a78bfa] font-mono shrink-0">{interp.observer}:</span>
                      <span className="text-white/50">{interp.meaning}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {data.coherence_conflicts.length > 0 && (
        <Section label="Coherence Conflicts" newPage>
          <div className="space-y-2">
            {data.coherence_conflicts.map((c, i) => (
              <div key={i} className="rounded-lg border border-[#ef444433] px-4 py-3 bg-[#ef444408]">
                <div className="text-sm font-semibold text-white/90 mb-1">{c.conflict}</div>
                <SubSection label="Why Irreconcilable">
                  <p className="text-xs text-white/50 leading-relaxed">{c.why_irreconcilable}</p>
                </SubSection>
                <SubSection label="Consequence">
                  <p className="text-xs text-[#ef4444]/70 leading-relaxed">{c.consequence}</p>
                </SubSection>
              </div>
            ))}
          </div>
        </Section>
      )}

      {data.perception_risks.length > 0 && (
        <Section label="Perception Risks">
          <div className="space-y-1">
            {data.perception_risks.map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-amber-400/60 leading-relaxed">
                <span className="mt-0.5">&#x26A0;</span>
                <span>{r}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section label="Synthesis">
        <p className="text-sm text-white/70 leading-relaxed whitespace-pre-line">{data.synthesis}</p>
      </Section>
    </div>
  );
}

function NarrativeResults({ data }: { data: NarrativeAnalysis }) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-[#22c55e33] px-4 py-4 bg-[#22c55e06]">
          <div className="font-mono text-[10px] text-[#22c55e] uppercase tracking-[0.15em] mb-2">
            Official Narrative
          </div>
          <p className="text-xs text-white/60 leading-relaxed mb-2">{data.official_narrative.story}</p>
          <div className="font-mono text-[9px] text-white/30 uppercase mb-1">Promised Outcome</div>
          <p className="text-xs text-white/50 mb-2">{data.official_narrative.promised_outcome}</p>
          <div className="font-mono text-[9px] text-white/30 uppercase mb-1">Protagonist</div>
          <p className="text-xs text-[#22c55e]/70">{data.official_narrative.protagonist}</p>
        </div>
        <div className="rounded-lg border border-[#ef444433] px-4 py-4 bg-[#ef444406]">
          <div className="font-mono text-[10px] text-[#ef4444] uppercase tracking-[0.15em] mb-2">
            Structural Narrative
          </div>
          <p className="text-xs text-white/60 leading-relaxed mb-2">{data.structural_narrative.story}</p>
          <div className="font-mono text-[9px] text-white/30 uppercase mb-1">Probable Outcome</div>
          <p className="text-xs text-white/50 mb-2">{data.structural_narrative.probable_outcome}</p>
          <div className="font-mono text-[9px] text-white/30 uppercase mb-1">Actual Beneficiary</div>
          <p className="text-xs text-[#ef4444]/70">{data.structural_narrative.actual_beneficiary}</p>
        </div>
      </div>

      {data.narrative_gaps.length > 0 && (
        <Section label="Narrative Gaps">
          <div className="space-y-2">
            {data.narrative_gaps.map((g, i) => (
              <div key={i} className="rounded-lg border border-white/10 px-4 py-3 bg-white/[0.02]">
                <div className="text-sm font-semibold text-white/90 mb-1">{g.gap}</div>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <div className="font-mono text-[9px] text-white/30 uppercase mb-1">What Is Obscured</div>
                    <p className="text-xs text-white/50 leading-relaxed">{g.what_is_obscured}</p>
                  </div>
                  <div>
                    <div className="font-mono text-[9px] text-white/30 uppercase mb-1">Consequence</div>
                    <p className="text-xs text-[#ef4444]/70 leading-relaxed">{g.consequence}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {data.stakeholder_stories.length > 0 && (
        <Section label="Stakeholder Stories">
          <div className="space-y-2">
            {data.stakeholder_stories.map((s, i) => (
              <div key={i} className="rounded-lg border border-white/10 px-4 py-3 bg-white/[0.02]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-white/90">{s.group}</span>
                  <Badge color={roleColor[s.role_assigned] || "#6b7280"}>{s.role_assigned}</Badge>
                </div>
                <p className="text-xs text-white/50 leading-relaxed">{s.their_story}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section label="Future Narrative" newPage>
        <p className="text-sm text-white/70 leading-relaxed whitespace-pre-line">{data.future_narrative}</p>
      </Section>

      <Section label="The Real Story">
        <p className="text-sm text-white/90 leading-relaxed italic">{data.synthesis}</p>
      </Section>
    </div>
  );
}

/* ── Shared UI components ── */
function Section({
  label,
  children,
  newPage = false,
}: {
  label: string;
  children: React.ReactNode;
  newPage?: boolean;
}) {
  return (
    <div className={`print-section${newPage ? " print-new-page" : ""}`}>
      <div className="section-header font-mono text-[10px] text-white/40 uppercase tracking-[0.15em] mb-3">
        {label}
      </div>
      {children}
    </div>
  );
}

function SubSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-2 pt-2 border-t border-white/5">
      <div className="font-mono text-[9px] text-white/30 uppercase mb-1">{label}</div>
      {children}
    </div>
  );
}

function Badge({
  color,
  children,
  className = "",
}: {
  color: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded ${className}`}
      style={{
        background: `${color}22`,
        color: color,
        border: `1px solid ${color}44`,
      }}
    >
      {children}
    </span>
  );
}

/* ── Main page ── */
export default function Home() {
  const [scenario, setScenario] = useState(EXAMPLE_SCENARIOS[0].text);
  const [purpose, setPurpose] = useState<PurposeId>("stress");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(
    featuredData.analysis as unknown as AnalysisResult
  );
  const [activeMode, setActiveMode] = useState<PurposeId | null>(
    featuredData.mode as PurposeId
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeStep, setActiveStep] = useState("");
  const [researchEnabled, setResearchEnabled] = useState(true);
  const [researchEnriched, setResearchEnriched] = useState(false);

  const forge = async () => {
    if (!scenario.trim() || loading) return;
    setLoading(true);
    setError("");
    setAnalysis(null);
    setActiveMode(null);
    setResearchEnriched(false);

    const researchSteps = researchEnabled
      ? ["Researching real-world context via Perplexity..."]
      : [];
    const steps = [...researchSteps, ...LOADING_STEPS[purpose]];
    let stepIndex = 0;
    setActiveStep(steps[0]);
    const interval = setInterval(() => {
      stepIndex++;
      if (stepIndex < steps.length) {
        setActiveStep(steps[stepIndex]);
      }
    }, researchEnabled ? 4000 : 3000);

    try {
      const res = await fetch("/api/forge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: scenario.trim(),
          mode: purpose,
          research: researchEnabled,
        }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      setAnalysis(data.analysis);
      setActiveMode(data.mode);
      setResearchEnriched(data.research_enriched || false);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Failed to connect to analysis engine";
      setError(message);
    } finally {
      clearInterval(interval);
      setActiveStep("");
      setLoading(false);
    }
  };

  const activePurpose = PURPOSES.find((p) => p.id === purpose);

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(ellipse at 20% 50%, #0a0a1a 0%, #000008 60%, #050510 100%)",
      }}
    >
      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,245,200,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,200,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="max-w-3xl mx-auto px-6 py-12 relative">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="font-mono text-xs tracking-[0.3em] text-[#00f5c8] opacity-70 uppercase mb-3">
            MST &middot; Discrete Substrate Architecture
          </div>
          <h1
            className="text-5xl font-black tracking-tight font-mono mb-2"
            style={{
              background:
                "linear-gradient(135deg, #fff 30%, #a78bfa 70%, #00f5c8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            FORGE
          </h1>
          <p className="text-sm text-white/40 italic">
            by Augusto Bartolomeu &middot; Reality Branch Explorer
          </p>
        </div>

        {/* Simulation Purpose selector */}
        <div className="mb-7">
          <div className="font-mono text-[10px] text-white/40 uppercase tracking-[0.15em] mb-3">
            Simulation Purpose
          </div>
          <div className="grid grid-cols-2 gap-2">
            {PURPOSES.map((p) => (
              <button
                key={p.id}
                onClick={() => setPurpose(p.id)}
                className="text-left rounded-lg border px-4 py-3 transition-all cursor-pointer flex items-center gap-3"
                style={{
                  borderColor:
                    purpose === p.id
                      ? modeColor[p.id]
                      : "rgba(255,255,255,0.1)",
                  background:
                    purpose === p.id
                      ? `${modeColor[p.id]}0D`
                      : "rgba(255,255,255,0.02)",
                }}
              >
                <span className="text-lg opacity-90">{p.glyph}</span>
                <div>
                  <div
                    className="text-xs font-semibold font-mono"
                    style={{
                      color:
                        purpose === p.id
                          ? modeColor[p.id]
                          : "rgba(255,255,255,0.6)",
                    }}
                  >
                    {p.label}
                  </div>
                  <div className="text-[10px] text-white/30 mt-0.5">
                    {p.desc}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Example scenarios */}
        <div className="mb-6">
          <div className="font-mono text-[10px] text-white/40 uppercase tracking-[0.15em] mb-3">
            Example Scenarios
          </div>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_SCENARIOS.map((ex) => (
              <button
                key={ex.label}
                onClick={() => setScenario(ex.text)}
                className="text-xs font-mono px-3 py-1.5 rounded-md border transition-all cursor-pointer"
                style={{
                  borderColor:
                    scenario === ex.text
                      ? "#00f5c8"
                      : "rgba(255,255,255,0.1)",
                  background:
                    scenario === ex.text
                      ? "rgba(0,245,200,0.08)"
                      : "rgba(255,255,255,0.02)",
                  color:
                    scenario === ex.text
                      ? "#00f5c8"
                      : "rgba(255,255,255,0.5)",
                }}
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scenario input */}
        <div className="mb-5">
          <div className="font-mono text-[10px] text-white/40 uppercase tracking-[0.15em] mb-2">
            Scenario
          </div>
          <textarea
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) forge();
            }}
            placeholder="Enter a scenario to forge across reality branches..."
            className="w-full min-h-[120px] rounded-lg border px-4 py-3 text-sm font-serif resize-vertical outline-none"
            style={{
              background: "rgba(255,255,255,0.04)",
              borderColor: "rgba(255,255,255,0.12)",
              color: "#fff",
              lineHeight: 1.6,
            }}
          />
        </div>

        {/* Research toggle */}
        <div className="mb-5 flex items-center gap-3">
          <button
            onClick={() => setResearchEnabled(!researchEnabled)}
            className="flex items-center gap-2 font-mono text-xs transition-all cursor-pointer"
            style={{
              color: researchEnabled ? "#00f5c8" : "rgba(255,255,255,0.3)",
            }}
          >
            <div
              className="w-8 h-4 rounded-full relative transition-all"
              style={{
                background: researchEnabled
                  ? "rgba(0,245,200,0.3)"
                  : "rgba(255,255,255,0.1)",
              }}
            >
              <div
                className="w-3 h-3 rounded-full absolute top-0.5 transition-all"
                style={{
                  background: researchEnabled ? "#00f5c8" : "rgba(255,255,255,0.3)",
                  left: researchEnabled ? 17 : 2,
                }}
              />
            </div>
            Deep Research
          </button>
          <span className="text-[10px] text-white/20 font-mono">
            {researchEnabled
              ? "Perplexity will gather real-world data before analysis"
              : "Analysis uses training data only"}
          </span>
        </div>

        {/* Forge button */}
        <button
          onClick={forge}
          disabled={loading || !scenario.trim()}
          className="w-full py-4 rounded-lg font-mono text-sm font-extrabold uppercase tracking-[0.15em] transition-all mb-8 cursor-pointer"
          style={{
            background: loading
              ? "rgba(0,245,200,0.1)"
              : "linear-gradient(135deg, #00f5c8, #a78bfa)",
            border: "none",
            color: loading ? "#00f5c8" : "#000",
            opacity: !scenario.trim() ? 0.4 : 1,
            cursor:
              loading || !scenario.trim() ? "not-allowed" : "pointer",
            boxShadow: loading
              ? "none"
              : "0 0 30px rgba(0,245,200,0.3)",
          }}
        >
          {loading
            ? "Initializing Substrate..."
            : `${activePurpose?.glyph} Forge Reality Branches`}
        </button>

        {/* Error */}
        {error && (
          <div
            className="rounded-lg px-4 py-3 font-mono text-sm mb-6"
            style={{
              border: "1px solid rgba(239,68,68,0.4)",
              background: "rgba(239,68,68,0.06)",
              color: "#ef4444",
            }}
          >
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="text-center py-8 font-mono text-sm text-white/40">
            <div className="mb-2 text-[#00f5c8]">{activeStep}</div>
            <div className="w-48 h-1 mx-auto rounded-full overflow-hidden bg-white/5">
              <div
                className="h-full rounded-full"
                style={{
                  background: "linear-gradient(90deg, #00f5c8, #a78bfa)",
                  animation: "loading 2s ease-in-out infinite",
                }}
              />
            </div>
          </div>
        )}

        {/* Results */}
        {analysis && (
          <div id="forge-report">
            {/* Report header with badges and PDF button */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                {researchEnriched && (
                  <span
                    className="font-mono text-[10px] uppercase px-2 py-0.5 rounded"
                    style={{
                      background: "rgba(0,245,200,0.12)",
                      color: "#00f5c8",
                      border: "1px solid rgba(0,245,200,0.3)",
                    }}
                  >
                    &#x1F50D; Research-Enriched
                  </span>
                )}
                {activeMode && (
                  <span
                    className="font-mono text-[10px] uppercase px-2 py-0.5 rounded"
                    style={{
                      background: `${modeColor[activeMode]}15`,
                      color: modeColor[activeMode],
                      border: `1px solid ${modeColor[activeMode]}33`,
                    }}
                  >
                    {PURPOSES.find((p) => p.id === activeMode)?.label}
                  </span>
                )}
              </div>
              <button
                onClick={() => window.print()}
                className="font-mono text-[10px] uppercase px-3 py-1.5 rounded border transition-all cursor-pointer hover:bg-white/5"
                style={{
                  borderColor: "rgba(255,255,255,0.15)",
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                &#x1F4C4; Download PDF
              </button>
            </div>

            {/* Summary */}
            <div className="mb-8 print-section">
              <div className="section-header font-mono text-[10px] text-white/40 uppercase tracking-[0.15em] mb-2">
                Scenario Under Analysis
              </div>
              <p className="text-sm text-white/70 italic leading-relaxed">
                {(analysis as { scenario_summary: string }).scenario_summary}
              </p>
            </div>

            {/* Mode-specific results */}
            {activeMode === "stress" && <StressResults data={analysis as StressAnalysis} />}
            {activeMode === "ancestor" && <AncestorResults data={analysis as AncestorAnalysis} />}
            {activeMode === "consciousness" && (
              <ConsciousnessResults data={analysis as ConsciousnessAnalysis} />
            )}
            {activeMode === "narrative" && <NarrativeResults data={analysis as NarrativeAnalysis} />}

            {/* Footer */}
            <div className="pt-6 mt-8 border-t border-white/5 text-center font-mono text-[10px] text-white/20 leading-relaxed">
              MST v5 &middot; Discrete Substrate Law &middot; Universal Refresh
              Cycle
              <br />
              &quot;Dust is random. Code is intentional.&quot; &mdash; Augusto
              Bartolomeu
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes loading {
          0% {
            width: 0%;
            margin-left: 0;
          }
          50% {
            width: 60%;
            margin-left: 20%;
          }
          100% {
            width: 0%;
            margin-left: 100%;
          }
        }

        @media print {
          /* ── Global reset to white/black ── */
          * {
            background: transparent !important;
            color: #000 !important;
            box-shadow: none !important;
            text-shadow: none !important;
          }

          html, body {
            background: #fff !important;
          }

          @page {
            margin: 2.5cm 2.5cm 3cm 2.5cm;
            size: A4 portrait;

            @bottom-left {
              content: "\u00A9 2026 Augusto Bartolomeu  \u00B7  FORGE  \u00B7  Multi-Simulation Thesis";
              font-family: monospace;
              font-size: 7px;
              color: #999;
              letter-spacing: 0.05em;
            }

            @bottom-right {
              content: "page " counter(page) " of " counter(pages);
              font-family: monospace;
              font-size: 7px;
              color: #999;
              letter-spacing: 0.05em;
            }
          }

          /* ── Hide all UI controls ── */
          .fixed,
          .min-h-screen > div:first-child,
          textarea,
          button,
          .mb-7,
          .mb-6:has(button),
          .mb-5:has(button),
          .mb-5:has(textarea),
          [class*="loading"],
          [class*="error"] {
            display: none !important;
          }

          /* ── Show only the report ── */
          .min-h-screen {
            background: #fff !important;
            min-height: auto !important;
          }

          #forge-report {
            display: block !important;
            max-width: 100% !important;
            padding: 0 !important;
          }

          /* Hide the download button and badge bar in print */
          #forge-report > div:first-child {
            display: none !important;
          }

          /* ── Report cover header ── */
          #forge-report::before {
            content: "FORGE";
            display: block;
            font-family: monospace;
            font-size: 32px;
            font-weight: 900;
            color: #000 !important;
            letter-spacing: 0.1em;
            margin-bottom: 4px;
          }

          #forge-report::after {
            content: "Structural Decision Intelligence — Multi-Simulation Thesis | by Augusto Bartolomeu";
            display: block;
            font-family: monospace;
            font-size: 9px;
            color: #666 !important;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            border-bottom: 2px solid #000;
            padding-bottom: 16px;
            margin-bottom: 32px;
          }

          /* ── Section dividers ── */
          .print-section {
            margin-top: 28px !important;
            padding-top: 20px !important;
            border-top: 1px solid #ccc !important;
            page-break-inside: avoid;
          }

          .print-section:first-of-type {
            border-top: none !important;
            padding-top: 0 !important;
            margin-top: 0 !important;
          }

          .section-header {
            font-size: 13px !important;
            font-weight: 700 !important;
            color: #000 !important;
            text-transform: uppercase !important;
            letter-spacing: 0.1em !important;
            margin-bottom: 12px !important;
            padding-bottom: 6px !important;
            border-bottom: 1px solid #eee !important;
          }

          /* ── Scenario summary ── */
          #forge-report > div:nth-child(2) {
            margin-bottom: 24px !important;
          }

          #forge-report > div:nth-child(2) > div:first-child {
            font-size: 13px !important;
            font-weight: 700 !important;
            color: #000 !important;
            text-transform: uppercase !important;
            letter-spacing: 0.1em !important;
            margin-bottom: 8px !important;
          }

          #forge-report > div:nth-child(2) p {
            font-size: 12px !important;
            color: #333 !important;
            line-height: 1.6 !important;
          }

          /* ── Cards and containers ── */
          [class*="rounded-lg"] {
            border: 1px solid #ddd !important;
            border-radius: 4px !important;
            padding: 12px !important;
            margin-bottom: 8px !important;
            page-break-inside: avoid;
          }

          /* ── Text styling ── */
          .text-sm, .text-xs, p, span, div {
            color: #000 !important;
          }

          [class*="text-white"] {
            color: #000 !important;
          }

          [class*="text-amber"] {
            color: #b45309 !important;
          }

          /* ── Badges — keep colored but print-safe ── */
          [class*="font-mono"][class*="uppercase"][class*="px-2"] {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            border: 1px solid #999 !important;
            padding: 1px 6px !important;
            font-size: 8px !important;
          }

          /* Severity badges */
          [class*="px-2"][style*="rgb(239, 68, 68)"],
          [class*="px-2"][style*="#ef4444"] {
            color: #cc0000 !important;
            border-color: #cc0000 !important;
            background: #fff0f0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          [class*="px-2"][style*="rgb(245, 158, 11)"],
          [class*="px-2"][style*="#f59e0b"] {
            color: #b45309 !important;
            border-color: #b45309 !important;
            background: #fffbeb !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          [class*="px-2"][style*="rgb(34, 197, 94)"],
          [class*="px-2"][style*="#22c55e"] {
            color: #166534 !important;
            border-color: #166534 !important;
            background: #f0fdf4 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          [class*="px-2"][style*="rgb(59, 130, 246)"],
          [class*="px-2"][style*="#3b82f6"] {
            color: #1d4ed8 !important;
            border-color: #1d4ed8 !important;
            background: #eff6ff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* ── Sub-sections ── */
          [class*="border-t"] {
            border-color: #eee !important;
          }

          /* ── Footer ── */
          #forge-report > div:last-child {
            margin-top: 32px !important;
            padding-top: 16px !important;
            border-top: 2px solid #000 !important;
            font-size: 9px !important;
            color: #666 !important;
            text-align: center;
          }

          /* ── Narrative mode: official vs structural columns ── */
          .grid {
            gap: 16px !important;
          }

          .grid > div {
            border: 1px solid #ddd !important;
          }

          /* ── Warning and recommendation icons ── */
          .flex.items-start.gap-2 {
            margin-bottom: 6px !important;
          }

          /* ── Page breaks ── */
          .print-new-page {
            page-break-before: always !important;
            margin-top: 0 !important;
            padding-top: 0 !important;
            border-top: none !important;
          }
        }
      `}</style>
    </div>
  );
}
