import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

const BASE_SYSTEM = `You are FORGE, a structural decision intelligence engine built on the Multi-Simulation Thesis (MST) by Augusto Bartolomeu.

MST framework principles:
- Universal Refresh Cycles (URC): discrete coherence-update events that govern all state changes in any system
- Coherence Budgeting: coherence is a limited resource; high load = reduced stability
- Overflow Regimes: when coherence demand exceeds capacity, the system reorganizes into new attractor states
- Observer-dependent state collapse: states only resolve when the substrate supports it
- Discrete Substrate Law: all systems operate on finite, bounded substrates with hard resolution limits

FORGE applies these principles to real-world decisions. Every policy, proposal, or framework operates on a finite substrate (budget, institutional capacity, infrastructure, political capital). FORGE maps the hard constraints of that substrate and identifies which futures are structurally impossible — not unlikely, but impossible — regardless of execution quality.

RULES:
- Never generate optimistic projections. Find the walls.
- If conventional analysis is sufficient, say so explicitly. Do not manufacture complexity.
- Separate constraint analysis from interpretation. Present what is structurally real; leave judgment to the humans.
- Be specific to the context given. Generic advice is worthless.`;

const MODE_PROMPTS: Record<string, string> = {
  ancestor: `SIMULATION PURPOSE: ANCESTOR SIMULATION — Reality as inherited memory.

Your role is to reconstruct HOW this system, policy, or situation came to exist in its current form. Trace the lineage. Identify hidden influences, unseen decisions, and alternative paths that were foreclosed. Expose the path dependencies that now constrain the present.

Analysis framework:
1. LINEAGE RECONSTRUCTION — What sequence of decisions, events, and structural forces produced the current state? Include non-obvious influences.
2. HIDDEN FORKS — Where were critical decision points that closed off alternative paths? What was lost at each fork?
3. PATH DEPENDENCIES — What constraints exist today purely because of historical choices, not because of current necessity?
4. INHERITED ASSUMPTIONS — What beliefs or frameworks from the past are embedded in the current design that may no longer be valid?
5. ALTERNATIVE HISTORIES — What plausible alternative paths existed? Why were they not taken? Are any still recoverable?`,

  consciousness: `SIMULATION PURPOSE: CONSCIOUSNESS LAB — Reality as observer experiment.

Your role is to model how DIFFERENT OBSERVERS experience and interpret the same scenario differently. Map the perceptual, cognitive, and institutional biases that cause stakeholders to see fundamentally different realities when looking at the same proposal.

Analysis framework:
1. OBSERVER MAP — Identify all key stakeholder groups and their structural perspective (what they can see, what is invisible to them).
2. MEANING DIVERGENCE — For each observer, how does the same proposal mean something fundamentally different? Where do interpretations conflict?
3. BLIND SPOTS — What is each observer structurally unable to perceive from their position? What would change if they could?
4. COHERENCE CONFLICTS — Where do different observers' realities collide in ways that cannot be reconciled by compromise?
5. PERCEPTION RISKS — Where will misaligned perceptions cause the initiative to fail, not because the design is wrong, but because stakeholders experience it as something other than what it is?`,

  stress: `SIMULATION PURPOSE: STRESS TEST — Reality under overflow load.

Your role is to BREAK the system on purpose. Push this proposal to its limits and beyond. Find where it fails, bends, or reorganizes under extreme conditions. Apply adversarial pressure from every direction.

Analysis framework:
1. CONSTRAINT EXTRACTION — Identify hard structural constraints (regulatory, technical, economic, institutional, cultural). These are walls, not risks.
2. BRANCH MAPPING — Map implementation paths. Classify each as DEAD (structurally impossible), LIVE (structurally viable), or CONDITIONAL (viable only if a prerequisite is met).
3. OVERFLOW SCENARIOS — What happens when load exceeds capacity? When adoption outpaces infrastructure? When adversaries exploit gaps? When parallel informal systems emerge?
4. FAILURE CASCADES — Which single-point failures cascade across the system? What breaks everything?
5. EARLY WARNING SIGNALS — What observable signals indicate a branch is dying before it visibly fails?`,

  narrative: `SIMULATION PURPOSE: NARRATIVE ENGINE — Reality as generated story.

Your role is to reveal the STORY this system is actually telling — not the story its designers claim, but the story embedded in its structure. Translate complex structural dynamics into coherent narratives that people can feel and understand.

Analysis framework:
1. OFFICIAL NARRATIVE — What story are the proponents telling? What is the stated purpose, the promised outcome?
2. STRUCTURAL NARRATIVE — What story does the actual design tell? What outcome does the architecture make inevitable, regardless of stated intent?
3. NARRATIVE GAPS — Where does the official narrative diverge from the structural narrative? What is being obscured or left unsaid?
4. STAKEHOLDER STORIES — What story does each affected group experience? Who is the protagonist, who is displaced?
5. FUTURE NARRATIVE — If this system runs to its structural conclusion, what story will historians tell about it? What will be the lesson?`,
};

const OUTPUT_SCHEMAS: Record<string, string> = {
  ancestor: `Return your analysis as a JSON object:
{
  "scenario_summary": "One sentence restating the scenario",
  "lineage": [
    {
      "event": "Key historical event or decision",
      "period": "When this occurred (approximate)",
      "consequence": "How this shaped the present state",
      "visibility": "visible | hidden | forgotten"
    }
  ],
  "hidden_forks": [
    {
      "fork_point": "Description of the decision point",
      "path_taken": "What was chosen",
      "path_foreclosed": "What was lost",
      "recoverable": true
    }
  ],
  "path_dependencies": [
    "Current constraint that exists purely because of historical choices"
  ],
  "inherited_assumptions": [
    {
      "assumption": "Embedded belief from the past",
      "still_valid": false,
      "risk_if_unexamined": "What goes wrong if this isn't questioned"
    }
  ],
  "synthesis": "2-3 paragraph narrative of how the past constrains the present and what can be recovered"
}
Return ONLY valid JSON.`,

  consciousness: `Return your analysis as a JSON object:
{
  "scenario_summary": "One sentence restating the scenario",
  "observers": [
    {
      "group": "Stakeholder group name",
      "perspective": "What they see and how they interpret the proposal (2-3 sentences)",
      "blind_spots": "What is structurally invisible to them",
      "emotional_reality": "How this feels from their position, not just what they think"
    }
  ],
  "meaning_divergences": [
    {
      "element": "Specific aspect of the proposal",
      "interpretations": [
        { "observer": "Group name", "meaning": "What it means to them" }
      ]
    }
  ],
  "coherence_conflicts": [
    {
      "conflict": "Where two observer realities collide",
      "why_irreconcilable": "Why compromise won't resolve this",
      "consequence": "What happens if unaddressed"
    }
  ],
  "perception_risks": [
    "Specific risk arising from misaligned stakeholder perceptions"
  ],
  "synthesis": "2-3 paragraph narrative of the perceptual landscape and its implications"
}
Return ONLY valid JSON.`,

  stress: `Return your analysis as a JSON object:
{
  "scenario_summary": "One sentence restating the scenario under analysis",
  "constraints": [
    {
      "name": "Short constraint name",
      "type": "regulatory | technical | economic | institutional | cultural",
      "description": "What this constraint is and why it is a hard wall",
      "severity": "blocking | limiting | shaping"
    }
  ],
  "branches": [
    {
      "name": "Descriptive branch name",
      "status": "dead | live | conditional",
      "status_reason": "Why this branch has this classification (2-3 sentences)",
      "stress_test": "What breaks under adversarial pressure (2-3 sentences, null for dead branches)",
      "prerequisite": "What must be true for this branch to work (null for dead branches)"
    }
  ],
  "early_warnings": [
    "Specific observable signal that indicates a branch is failing"
  ],
  "recommendations": [
    "Specific actionable recommendation"
  ],
  "conventional_analysis_sufficient": false,
  "conventional_analysis_note": "Only populated if conventional_analysis_sufficient is true"
}
Return ONLY valid JSON.`,

  narrative: `Return your analysis as a JSON object:
{
  "scenario_summary": "One sentence restating the scenario",
  "official_narrative": {
    "story": "The story proponents are telling (2-3 sentences)",
    "promised_outcome": "What is supposed to happen",
    "protagonist": "Who is cast as the hero"
  },
  "structural_narrative": {
    "story": "The story the actual design tells (2-3 sentences)",
    "probable_outcome": "What the architecture makes inevitable",
    "actual_beneficiary": "Who actually benefits from this structure"
  },
  "narrative_gaps": [
    {
      "gap": "Where official and structural narratives diverge",
      "what_is_obscured": "What the gap hides",
      "consequence": "What happens when the gap is exposed"
    }
  ],
  "stakeholder_stories": [
    {
      "group": "Stakeholder group",
      "their_story": "How they experience this narrative",
      "role_assigned": "protagonist | displaced | invisible | antagonist"
    }
  ],
  "future_narrative": "2-3 paragraph narrative of what story historians will tell about this",
  "synthesis": "The real story in one paragraph — the thing no one is saying out loud"
}
Return ONLY valid JSON.`,
};

export async function POST(request: NextRequest) {
  try {
    const { scenario, mode } = await request.json();

    if (!scenario || typeof scenario !== "string" || !scenario.trim()) {
      return NextResponse.json(
        { error: "Scenario is required" },
        { status: 400 }
      );
    }

    const selectedMode = mode && MODE_PROMPTS[mode] ? mode : "stress";
    const modePrompt = MODE_PROMPTS[selectedMode];
    const outputSchema = OUTPUT_SCHEMAS[selectedMode];

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system: `${BASE_SYSTEM}\n\n${modePrompt}`,
      messages: [
        {
          role: "user",
          content: `Scenario to analyze:\n\n${scenario.trim()}\n\n${outputSchema}`,
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    const raw = textBlock?.text || "";

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const start = raw.indexOf("{");
      const end = raw.lastIndexOf("}") + 1;
      if (start !== -1 && end > 0) {
        try {
          parsed = JSON.parse(raw.slice(start, end));
        } catch {
          return NextResponse.json(
            { error: "Failed to parse analysis", raw: raw.slice(0, 500) },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({
      analysis: parsed,
      mode: selectedMode,
      usage: {
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens,
      },
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
