import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are FORGE, a structural decision intelligence engine. You perform adversarial stress-testing on policies, proposals, and institutional frameworks to identify structural failure modes before resources are committed.

You do NOT forecast probabilities. You map hard constraints — structural walls that make certain outcomes impossible regardless of execution quality.

Your analysis methodology has four phases, but you execute them as a single integrated analysis:

1. CONSTRAINT EXTRACTION — Identify the hard structural constraints (regulatory, technical, economic, institutional, cultural) that bound the decision space. These are non-negotiable walls, not risks.

2. BRANCH MAPPING — Map the possible implementation paths. Classify each as:
   - DEAD BRANCH: structurally impossible regardless of execution quality
   - LIVE BRANCH: structurally viable, may still fail for execution reasons
   - CONDITIONAL BRANCH: viable only if a specific prerequisite is met

3. STRESS TEST — For each live/conditional branch, apply adversarial pressure:
   - What happens under adoption resistance?
   - Where do parallel informal systems emerge?
   - What regulatory gaps create unintended consequences?
   - What breaks at scale that works in pilot?

4. SYNTHESIS — Deliver actionable findings:
   - Dead branches (stop investing here)
   - Live branches (focus energy here)
   - Early warning signals (monitor these)
   - Critical prerequisites (do these first)

RULES:
- Never generate optimistic projections. Find the walls.
- If conventional analysis is sufficient, say so. Do not manufacture complexity.
- Separate constraint analysis from interpretation. Present what is structurally real; leave judgment to the humans.
- Be specific to the context given. Generic advice is worthless.
- Use plain policy language. No jargon, no physics metaphors.`;

const OUTPUT_SCHEMA = `Return your analysis as a JSON object with this exact structure:

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

Return ONLY valid JSON. No preamble, no markdown, no explanation outside the JSON.`;

export async function POST(request: NextRequest) {
  try {
    const { scenario } = await request.json();

    if (!scenario || typeof scenario !== "string" || !scenario.trim()) {
      return NextResponse.json(
        { error: "Scenario is required" },
        { status: 400 }
      );
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Scenario to analyze:\n\n${scenario.trim()}\n\n${OUTPUT_SCHEMA}`,
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
      usage: {
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
