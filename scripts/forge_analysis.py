#!/usr/bin/env python3
"""
FORGE Analysis Pipeline
Run a structural decision intelligence analysis and save results as JSON.

Usage:
    python3 scripts/forge_analysis.py "Your scenario description here"
    python3 scripts/forge_analysis.py --file scenario.txt

Output is saved to scripts/outputs/<timestamp>-<slug>.json
"""

import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path

try:
    import anthropic
except ImportError:
    print("Install the anthropic package: pip3 install anthropic")
    sys.exit(1)

SYSTEM_PROMPT = """You are FORGE, a structural decision intelligence engine. You perform adversarial stress-testing on policies, proposals, and institutional frameworks to identify structural failure modes before resources are committed.

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
- Use plain policy language. No jargon, no physics metaphors."""

OUTPUT_SCHEMA = """Return your analysis as a JSON object with this exact structure:

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

Return ONLY valid JSON. No preamble, no markdown, no explanation outside the JSON."""


def slugify(text: str) -> str:
    slug = re.sub(r'[^a-z0-9]+', '-', text.lower().strip())
    return slug[:60].strip('-')


def run_analysis(scenario: str) -> dict:
    client = anthropic.Anthropic()

    print("\n  [1/4] Extracting structural constraints...")
    print("  [2/4] Mapping decision branches...")
    print("  [3/4] Running adversarial stress tests...")
    print("  [4/4] Synthesizing findings...\n")

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4000,
        system=SYSTEM_PROMPT,
        messages=[{
            "role": "user",
            "content": f"Scenario to analyze:\n\n{scenario.strip()}\n\n{OUTPUT_SCHEMA}"
        }]
    )

    raw = message.content[0].text

    try:
        result = json.loads(raw)
    except json.JSONDecodeError:
        start = raw.find('{')
        end = raw.rfind('}') + 1
        if start != -1 and end > 0:
            result = json.loads(raw[start:end])
        else:
            raise ValueError(f"Could not parse response: {raw[:200]}")

    return {
        "analysis": result,
        "metadata": {
            "scenario_input": scenario,
            "model": "claude-sonnet-4-6",
            "timestamp": datetime.now().isoformat(),
            "input_tokens": message.usage.input_tokens,
            "output_tokens": message.usage.output_tokens,
        }
    }


def print_summary(data: dict):
    a = data["analysis"]
    m = data["metadata"]

    print(f"  Scenario: {a['scenario_summary']}")
    print(f"  Constraints: {len(a['constraints'])}")
    print(f"  Branches: {len(a['branches'])}")

    dead = sum(1 for b in a['branches'] if b['status'] == 'dead')
    live = sum(1 for b in a['branches'] if b['status'] == 'live')
    cond = sum(1 for b in a['branches'] if b['status'] == 'conditional')
    print(f"    Dead: {dead} | Live: {live} | Conditional: {cond}")

    print(f"  Early warnings: {len(a['early_warnings'])}")
    print(f"  Recommendations: {len(a['recommendations'])}")
    print(f"  Tokens: {m['input_tokens']} in / {m['output_tokens']} out")


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/forge_analysis.py \"Your scenario here\"")
        print("       python3 scripts/forge_analysis.py --file scenario.txt")
        sys.exit(1)

    if sys.argv[1] == "--file":
        filepath = sys.argv[2] if len(sys.argv) > 2 else None
        if not filepath or not Path(filepath).exists():
            print(f"File not found: {filepath}")
            sys.exit(1)
        scenario = Path(filepath).read_text().strip()
    else:
        scenario = " ".join(sys.argv[1:])

    print(f"\n  FORGE — Structural Decision Intelligence")
    print(f"  {'=' * 42}\n")
    print(f"  Analyzing scenario ({len(scenario)} chars)...\n")

    data = run_analysis(scenario)

    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    slug = slugify(data["analysis"]["scenario_summary"])
    output_dir = Path(__file__).parent / "outputs"
    output_dir.mkdir(exist_ok=True)
    output_path = output_dir / f"{timestamp}-{slug}.json"

    output_path.write_text(json.dumps(data, indent=2, ensure_ascii=False))

    print(f"\n  Results:")
    print(f"  {'-' * 42}")
    print_summary(data)
    print(f"\n  Saved to: {output_path}\n")


if __name__ == "__main__":
    main()
