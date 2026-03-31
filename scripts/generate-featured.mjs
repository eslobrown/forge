#!/usr/bin/env node

/**
 * Generate featured analyses for all 4 simulation modes.
 * Calls the deployed FORGE API and saves results to src/app/featured-analyses.json.
 *
 * Usage: node scripts/generate-featured.mjs [BASE_URL]
 * Default: https://forge-virid-tau.vercel.app
 */

const BASE_URL = process.argv[2] || "https://forge-virid-tau.vercel.app";
const SCENARIO = "Cabo Verde is designing a mobile money interoperability framework to connect multiple payment providers (banks, fintechs, telcos) through a shared settlement layer. The framework would require all licensed providers to connect to a central switch operated by the central bank, with real-time settlement and standardized APIs. The goal is financial inclusion for the ~30% unbanked population across 10 islands with varying connectivity.";

const MODES = ["stress", "ancestor", "consciousness", "narrative"];

async function generateMode(mode) {
  console.log(`\n⚡ Running ${mode} mode...`);
  const start = Date.now();

  const res = await fetch(`${BASE_URL}/api/forge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      scenario: SCENARIO,
      mode,
      research: true,
    }),
  });

  const data = await res.json();

  if (data.error) {
    console.error(`  ✗ ${mode} failed: ${data.error}`);
    return null;
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  const tokens = data.usage
    ? `${data.usage.input_tokens} in / ${data.usage.output_tokens} out`
    : "unknown";
  console.log(`  ✓ ${mode} complete (${elapsed}s, ${tokens})`);
  console.log(`    Research: ${data.research_enriched}, Documents: ${data.document_grounded || false}`);

  return {
    analysis: data.analysis,
    mode: data.mode,
    research_enriched: data.research_enriched,
    document_grounded: data.document_grounded || false,
  };
}

async function main() {
  console.log(`FORGE Featured Analysis Generator`);
  console.log(`API: ${BASE_URL}`);
  console.log(`Scenario: ${SCENARIO.slice(0, 80)}...`);

  const results = {};

  for (const mode of MODES) {
    const result = await generateMode(mode);
    if (result) {
      results[mode] = result;
    }
  }

  const succeeded = Object.keys(results).length;
  console.log(`\n${succeeded}/${MODES.length} modes completed.`);

  if (succeeded === 0) {
    console.error("No modes succeeded. Aborting.");
    process.exit(1);
  }

  // Write output
  const outPath = new URL("../src/app/featured-analyses.json", import.meta.url);
  const { writeFileSync } = await import("fs");
  const { fileURLToPath } = await import("url");
  writeFileSync(fileURLToPath(outPath), JSON.stringify(results, null, 2));
  console.log(`\nSaved to src/app/featured-analyses.json`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
