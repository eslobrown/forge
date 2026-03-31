"use client";

import { useState } from "react";

interface Constraint {
  name: string;
  type: string;
  description: string;
  severity: "blocking" | "limiting" | "shaping";
}

interface Branch {
  name: string;
  status: "dead" | "live" | "conditional";
  status_reason: string;
  stress_test: string | null;
  prerequisite: string | null;
}

interface Analysis {
  scenario_summary: string;
  constraints: Constraint[];
  branches: Branch[];
  early_warnings: string[];
  recommendations: string[];
  conventional_analysis_sufficient: boolean;
  conventional_analysis_note?: string;
}

const EXAMPLE_SCENARIOS = [
  {
    label: "Mobile Money Interoperability",
    text: "Cabo Verde is designing a mobile money interoperability framework to connect multiple payment providers (banks, fintechs, telcos) through a shared settlement layer. The framework would require all licensed providers to connect to a central switch operated by the central bank, with real-time settlement and standardized APIs. The goal is financial inclusion for the ~30% unbanked population across 10 islands with varying connectivity.",
  },
  {
    label: "National Digital ID Rollout",
    text: "A small island nation of 600,000 people is planning to roll out a national digital identity system. The system would replace physical ID cards with a mobile-first digital credential, used for government services, banking KYC, and potentially voting. The government wants to build on open-source standards (OpenID Connect) and host the infrastructure locally rather than depending on foreign cloud providers. Budget is limited to €2M for the first phase.",
  },
  {
    label: "AI Governance Framework",
    text: "A developing nation wants to create a national AI governance framework that positions it as a regional leader in responsible AI adoption. The framework would cover public sector AI use, private sector compliance, data protection, and AI skills development. The country has limited technical capacity (fewer than 200 AI practitioners), no existing data protection law, and wants to avoid simply copying EU or US frameworks.",
  },
];

const severityColor = {
  blocking: "#ef4444",
  limiting: "#f59e0b",
  shaping: "#3b82f6",
};

const statusColor = {
  dead: "#ef4444",
  live: "#22c55e",
  conditional: "#f59e0b",
};

const statusIcon = {
  dead: "\u2716",
  live: "\u2714",
  conditional: "\u25C6",
};

export default function Home() {
  const [scenario, setScenario] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeStep, setActiveStep] = useState("");

  const forge = async () => {
    if (!scenario.trim() || loading) return;
    setLoading(true);
    setError("");
    setAnalysis(null);

    const steps = [
      "Extracting structural constraints...",
      "Mapping decision branches...",
      "Running adversarial stress tests...",
      "Synthesizing findings...",
    ];

    let stepIndex = 0;
    setActiveStep(steps[0]);
    const interval = setInterval(() => {
      stepIndex++;
      if (stepIndex < steps.length) {
        setActiveStep(steps[stepIndex]);
      }
    }, 3000);

    try {
      const res = await fetch("/api/forge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: scenario.trim() }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      setAnalysis(data.analysis);
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
          <div
            className="font-mono text-xs tracking-[0.3em] text-[#00f5c8] opacity-70 uppercase mb-3"
          >
            Structural Decision Intelligence
          </div>
          <h1
            className="text-5xl font-black tracking-tight font-mono mb-2"
            style={{
              background: "linear-gradient(135deg, #fff 30%, #a78bfa 70%, #00f5c8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            FORGE
          </h1>
          <p className="text-sm text-white/40 italic">
            by Augusto Bartolomeu
          </p>
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
                    scenario === ex.text ? "#00f5c8" : "rgba(255,255,255,0.5)",
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
            placeholder="Describe a policy, proposal, or framework to stress-test..."
            className="w-full min-h-[120px] rounded-lg border px-4 py-3 text-sm font-serif resize-vertical outline-none"
            style={{
              background: "rgba(255,255,255,0.04)",
              borderColor: "rgba(255,255,255,0.12)",
              color: "#fff",
              lineHeight: 1.6,
            }}
          />
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
            cursor: loading || !scenario.trim() ? "not-allowed" : "pointer",
            boxShadow: loading ? "none" : "0 0 30px rgba(0,245,200,0.3)",
          }}
        >
          {loading ? "Analyzing..." : "Forge Analysis"}
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
          <div className="space-y-8">
            {/* Summary */}
            <div>
              <div className="font-mono text-[10px] text-white/40 uppercase tracking-[0.15em] mb-2">
                Scenario Under Analysis
              </div>
              <p className="text-sm text-white/70 italic leading-relaxed">
                {analysis.scenario_summary}
              </p>
            </div>

            {/* Conventional analysis check */}
            {analysis.conventional_analysis_sufficient && (
              <div
                className="rounded-lg px-4 py-3 border"
                style={{
                  borderColor: "rgba(59,130,246,0.4)",
                  background: "rgba(59,130,246,0.06)",
                }}
              >
                <div className="font-mono text-xs text-blue-400 font-bold mb-1">
                  STAND DOWN
                </div>
                <p className="text-sm text-white/70">
                  {analysis.conventional_analysis_note}
                </p>
              </div>
            )}

            {/* Constraints */}
            <div>
              <div className="font-mono text-[10px] text-white/40 uppercase tracking-[0.15em] mb-3">
                {analysis.constraints.length} Structural Constraints Identified
              </div>
              <div className="space-y-2">
                {analysis.constraints.map((c, i) => (
                  <div
                    key={i}
                    className="rounded-lg border px-4 py-3"
                    style={{
                      borderColor: `${severityColor[c.severity]}33`,
                      background: `${severityColor[c.severity]}08`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="font-mono text-[10px] uppercase px-2 py-0.5 rounded"
                        style={{
                          background: `${severityColor[c.severity]}22`,
                          color: severityColor[c.severity],
                          border: `1px solid ${severityColor[c.severity]}44`,
                        }}
                      >
                        {c.severity}
                      </span>
                      <span
                        className="font-mono text-[10px] uppercase text-white/30"
                      >
                        {c.type}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-white/90 mb-1">
                      {c.name}
                    </div>
                    <div className="text-xs text-white/50 leading-relaxed">
                      {c.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Branches */}
            <div>
              <div className="font-mono text-[10px] text-white/40 uppercase tracking-[0.15em] mb-3">
                {analysis.branches.length} Decision Branches Mapped
              </div>
              <div className="space-y-3">
                {analysis.branches.map((b, i) => (
                  <div
                    key={i}
                    className="rounded-lg border px-4 py-4"
                    style={{
                      borderColor: `${statusColor[b.status]}33`,
                      background: `${statusColor[b.status]}06`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        style={{ color: statusColor[b.status], fontSize: 14 }}
                      >
                        {statusIcon[b.status]}
                      </span>
                      <span className="text-sm font-bold text-white/90">
                        {b.name}
                      </span>
                      <span
                        className="font-mono text-[10px] uppercase px-2 py-0.5 rounded ml-auto"
                        style={{
                          background: `${statusColor[b.status]}22`,
                          color: statusColor[b.status],
                          border: `1px solid ${statusColor[b.status]}44`,
                        }}
                      >
                        {b.status} branch
                      </span>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed mb-2">
                      {b.status_reason}
                    </p>
                    {b.stress_test && (
                      <div className="mt-2 pt-2 border-t border-white/5">
                        <div className="font-mono text-[9px] text-white/30 uppercase mb-1">
                          Stress Test Result
                        </div>
                        <p className="text-xs text-white/50 leading-relaxed">
                          {b.stress_test}
                        </p>
                      </div>
                    )}
                    {b.prerequisite && (
                      <div className="mt-2 pt-2 border-t border-white/5">
                        <div className="font-mono text-[9px] text-white/30 uppercase mb-1">
                          Critical Prerequisite
                        </div>
                        <p className="text-xs text-amber-400/70 leading-relaxed">
                          {b.prerequisite}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Early Warnings */}
            {analysis.early_warnings.length > 0 && (
              <div>
                <div className="font-mono text-[10px] text-white/40 uppercase tracking-[0.15em] mb-3">
                  Early Warning Signals
                </div>
                <div className="space-y-1">
                  {analysis.early_warnings.map((w, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-xs text-amber-400/60 leading-relaxed"
                    >
                      <span className="mt-0.5">&#x26A0;</span>
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {analysis.recommendations.length > 0 && (
              <div>
                <div className="font-mono text-[10px] text-white/40 uppercase tracking-[0.15em] mb-3">
                  Recommendations
                </div>
                <div className="space-y-1">
                  {analysis.recommendations.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-xs text-[#00f5c8]/70 leading-relaxed"
                    >
                      <span className="mt-0.5">&#x2192;</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div
              className="pt-6 mt-8 border-t border-white/5 text-center font-mono text-[10px] text-white/20"
            >
              FORGE &middot; Structural Decision Intelligence
              <br />
              Multi-Simulation Thesis &middot; Augusto Bartolomeu
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes loading {
          0% { width: 0%; margin-left: 0; }
          50% { width: 60%; margin-left: 20%; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
    </div>
  );
}
