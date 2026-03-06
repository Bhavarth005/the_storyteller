#!/usr/bin/env tsx
/**
 * scripts/test-e2e.ts
 * End-to-end test for the hybrid AI/Heuristic pipeline.
 *
 * Prereqs:  Next.js dev server running on http://localhost:3000
 *           DATABASE_URL set (via .env in project root)
 *
 * Run:  npx tsx scripts/test-e2e.ts
 *  or:  bun run tsx scripts/test-e2e.ts
 */

import { config } from "dotenv";
config(); // must be first — loads DATABASE_URL before Drizzle imports

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/db/schema";
import {
  versionAnalysis as versionAnalysisTable,
  episodes as episodesTable,
  versions as versionsTable,
  projects as projectsTable,
} from "../src/db/schema";

// ─── ANSI Color Helpers ──────────────────────────────────────────────────────

const C = {
  reset:   "\x1b[0m",
  bold:    "\x1b[1m",
  dim:     "\x1b[2m",
  green:   "\x1b[32m",
  red:     "\x1b[31m",
  yellow:  "\x1b[33m",
  cyan:    "\x1b[36m",
  magenta: "\x1b[35m",
  blue:    "\x1b[34m",
  gray:    "\x1b[90m",
};

const tag = {
  pass: `${C.bold}${C.green} PASS ${C.reset}`,
  fail: `${C.bold}${C.red} FAIL ${C.reset}`,
  step: `${C.bold}${C.cyan} STEP ${C.reset}`,
  info: `${C.bold}${C.blue} INFO ${C.reset}`,
  poll: `${C.bold}${C.gray} POLL ${C.reset}`,
  warn: `${C.bold}${C.yellow} WARN ${C.reset}`,
};

function log(prefix: string, msg: string) {
  const ts = new Date().toISOString().slice(11, 23); // HH:mm:ss.mmm
  console.log(`${C.gray}${ts}${C.reset} ${prefix} ${msg}`);
}

function hRule(char = "─", len = 72) {
  return C.gray + char.repeat(len) + C.reset;
}

function pad(s: string, n: number) {
  return s.padEnd(n);
}

// ─── API Response Types ──────────────────────────────────────────────────────

const BASE = "http://localhost:3000";

interface OptimizationSuggestion {
  target_time_sec: number;
  failure_reason: string;
  rationale: string;
  suggestion: string;
}

interface EpisodeData {
  id: string;
  episode_number: number;
  title: string;
  optimization_suggestions: OptimizationSuggestion[] | null;
}

interface VersionAnalysis {
  overall_engagement_score: string | number | null;
  average_cliffhanger: string | number | null;
  emotional_variance_index: string | number | null;
  radar_metrics: Record<string, number> | null;
}

interface ProjectData {
  id: string;
  title: string;
  active_version_id: string | null;
  version_data: {
    id: string;
    analysis_status: string;
    episodes: EpisodeData[];
    version_analysis: VersionAnalysis | null;
  } | null;
}

interface VersionData {
  id: string;
  analysis_status: string;
  version_analysis: VersionAnalysis | null;
}

interface StatusData {
  version_id: string;
  analysis_status: string;
}

// ─── HTTP Helpers ────────────────────────────────────────────────────────────

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json() as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(`POST ${path} → HTTP ${res.status}: ${JSON.stringify(json)}`);
  }
  return json as T;
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  const json = await res.json() as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(`GET ${path} → HTTP ${res.status}: ${JSON.stringify(json)}`);
  }
  return json as T;
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

// ─── Polling Helper ──────────────────────────────────────────────────────────

async function pollUntilComplete(versionId: string, label: string): Promise<void> {
  const INTERVAL_MS = 2_000;
  const MAX_ATTEMPTS = 180; // 6 minutes maximum
  let attempt = 0;

  while (attempt < MAX_ATTEMPTS) {
    attempt++;
    const data = await apiGet<StatusData>(`/api/status?version_id=${versionId}`);

    log(
      tag.poll,
      `${label} → ${C.yellow}${data.analysis_status}${C.reset}` +
        `  ${C.gray}(attempt ${attempt}/${MAX_ATTEMPTS})${C.reset}`
    );

    if (data.analysis_status === "complete") {
      log(tag.pass, `${label} — analysis ${C.green}complete${C.reset}.`);
      return;
    }

    if (data.analysis_status === "failed") {
      throw new Error(
        `Analysis for ${label} (${versionId}) reached "failed" status.`
      );
    }

    await sleep(INTERVAL_MS);
  }

  throw new Error(
    `Timeout: ${label} did not complete within ${(MAX_ATTEMPTS * INTERVAL_MS) / 1000}s.`
  );
}

// ─── Score Helpers ───────────────────────────────────────────────────────────

function toNum(v: string | number | null | undefined): number {
  if (v == null) return NaN;
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : NaN;
}

function fmtScore(n: number): string {
  return isNaN(n) ? `${C.gray}N/A${C.reset}` : `${C.cyan}${n.toFixed(4)}${C.reset}`;
}

function fmtDelta(d: number): string {
  if (isNaN(d)) return `${C.gray}N/A${C.reset}`;
  const s = d >= 0 ? `+${d.toFixed(6)}` : d.toFixed(6);
  return d > 0 ? `${C.green}${s}${C.reset}` : d < 0 ? `${C.red}${s}${C.reset}` : C.gray + s + C.reset;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n" + hRule("═"));
  console.log(
    `${C.bold}${C.magenta}   🧪  Episodic Intelligence — E2E Pipeline Test${C.reset}`
  );
  console.log(
    `${C.gray}   Target: ${BASE}   •   ${new Date().toLocaleString()}${C.reset}`
  );
  console.log(hRule("═") + "\n");

  // ═══════════════════════════════════════════════════════════════════════════
  // 0. DATABASE RESET
  // ═══════════════════════════════════════════════════════════════════════════
  log(tag.step, `${C.bold}Phase 0 — Database Reset${C.reset}`);

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Create a .env file in the project root."
    );
  }

  const client = postgres(process.env.DATABASE_URL, { max: 1 });
  const db = drizzle(client, { schema });

  try {
    // Delete in FK-safe order: dependents first
    await db.delete(versionAnalysisTable);
    await db.delete(episodesTable);
    await db.delete(versionsTable);
    await db.delete(projectsTable);

    log(tag.pass, `Tables cleared — versionAnalysis, episodes, versions, projects.`);
  } finally {
    await client.end();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 1: GENERATE CORE
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n" + hRule());
  log(tag.step, `${C.bold}Step 1 — POST /api/generate-core${C.reset} (3-episode sci-fi thriller)`);

  const coreResp = await apiPost<{
    project_id: string;
    version_id: string;
    analysis_status: string;
    message: string;
  }>("/api/generate-core", {
    title: "Echoes of the Void",
    input_type: "idea",
    genre: "thriller",
    raw_story:
      "In 2147, a deep-space signal is intercepted by the last crewed research station " +
      "near the edge of the solar system. Commander Yara Osei leads a skeptical crew through " +
      "escalating paranoia as the signal begins rewriting their ship's AI. Loyalties fracture " +
      "when it becomes clear one crew member has been secretly communicating with the source " +
      "all along, and the signal is not a call — it's a key.",
    episode_count: 3,
  });

  const projectId  = coreResp.project_id;
  const versionId1 = coreResp.version_id;

  log(tag.pass, `Project created.`);
  log(tag.info, `  project_id:       ${C.cyan}${projectId}${C.reset}`);
  log(tag.info, `  version_id (V1):  ${C.cyan}${versionId1}${C.reset}`);
  log(tag.info, `  analysis_status:  ${C.yellow}${coreResp.analysis_status}${C.reset}`);

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 2: ANALYZE VERSION 1
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n" + hRule());
  log(tag.step, `${C.bold}Step 2 — POST /api/analyze-version${C.reset} → poll until complete (Version 1)`);

  await apiPost("/api/analyze-version", { version_id: versionId1 });
  log(tag.info, "Queued (202). Polling every 2s…");
  await pollUntilComplete(versionId1, "Version 1");

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 3: FETCH & EVALUATE BASELINE
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n" + hRule());
  log(tag.step, `${C.bold}Step 3 — GET /api/projects/:id${C.reset} → evaluate baseline`);

  const project1 = await apiGet<ProjectData>(`/api/projects/${projectId}`);

  const v1Analysis  = project1.version_data?.version_analysis;
  const v1Engagement = toNum(v1Analysis?.overall_engagement_score);
  const v1Cliffhanger = toNum(v1Analysis?.average_cliffhanger);
  const v1EVI = toNum(v1Analysis?.emotional_variance_index);

  if (isNaN(v1Engagement)) {
    throw new Error(
      "Version 1 overall_engagement_score is missing or NaN after analysis completed."
    );
  }

  log(tag.pass, `Baseline scores fetched.`);
  log(tag.info, `  overall_engagement_score:  ${fmtScore(v1Engagement)}`);
  log(tag.info, `  average_cliffhanger:       ${fmtScore(v1Cliffhanger)}`);
  log(tag.info, `  emotional_variance_index:  ${fmtScore(v1EVI)}`);

  const episodes1 = project1.version_data?.episodes ?? [];
  const epWithSuggestion = episodes1.find(
    (ep) =>
      Array.isArray(ep.optimization_suggestions) &&
      ep.optimization_suggestions.length > 0
  );

  if (!epWithSuggestion) {
    log(
      tag.warn,
      "No optimization suggestions found — RoBERTa may have returned uniformly high intensity."
    );
    log(tag.info, "Falling back to Episode 1 for regeneration target.");
  }

  const targetEpisode     = epWithSuggestion ?? episodes1[0];
  const firstSuggestion   = epWithSuggestion?.optimization_suggestions?.[0];
  const instruction       = firstSuggestion?.suggestion ??
    "Raise the stakes with a sudden character revelation that recontextualizes the scene.";

  log(tag.info, `  Target:  Ep #${targetEpisode?.episode_number} — ${C.cyan}${targetEpisode?.title}${C.reset}`);
  if (firstSuggestion) {
    log(tag.info, `  Suggestion (@t=${firstSuggestion.target_time_sec}s):`);    
    log(tag.info, `    ${C.yellow}Failure: ${firstSuggestion.failure_reason}${C.reset}`);
    log(tag.info, `    ${C.gray}Rationale: ${firstSuggestion.rationale}${C.reset}`);
    log(tag.info, `    ${C.magenta}"${instruction}"${C.reset}`);
  } else {
    log(tag.info, `  Fallback instruction: ${C.magenta}"${instruction}"${C.reset}`);
  }

  if (!targetEpisode) {
    throw new Error("No episodes found in Version 1 — cannot proceed with regeneration.");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 4: REGENERATE EPISODE
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n" + hRule());
  log(
    tag.step,
    `${C.bold}Step 4 — POST /api/regenerate-episode${C.reset}` +
      ` → rewrite Ep #${targetEpisode.episode_number}`
  );

  const regenResp = await apiPost<{
    new_version_id: string;
    new_episode_id: string;
    analysis_status: string;
    message: string;
  }>("/api/regenerate-episode", {
    project_id:        projectId,
    parent_version_id: versionId1,
    episode_id:        targetEpisode.id,
    instruction,
  });

  const versionId2 = regenResp.new_version_id;

  log(tag.pass, `Regeneration complete.`);
  log(tag.info, `  version_id (V2):   ${C.cyan}${versionId2}${C.reset}`);
  log(tag.info, `  new_episode_id:    ${C.cyan}${regenResp.new_episode_id}${C.reset}`);
  log(tag.info, `  analysis_status:   ${C.yellow}${regenResp.analysis_status}${C.reset}`);

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 5: ANALYZE VERSION 2
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n" + hRule());
  log(tag.step, `${C.bold}Step 5 — POST /api/analyze-version${C.reset} → poll until complete (Version 2)`);

  await apiPost("/api/analyze-version", { version_id: versionId2 });
  log(tag.info, "Queued (202). Polling every 2s…");
  await pollUntilComplete(versionId2, "Version 2");

  // ═══════════════════════════════════════════════════════════════════════════
  // FINAL REPORT
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n" + hRule("═"));
  log(tag.step, `${C.bold}FINAL REPORT${C.reset}`);
  console.log(hRule("═"));

  const v2Data = await apiGet<VersionData>(`/api/versions/${versionId2}`);
  const v2Analysis  = v2Data.version_analysis;
  const v2Engagement  = toNum(v2Analysis?.overall_engagement_score);
  const v2Cliffhanger = toNum(v2Analysis?.average_cliffhanger);
  const v2EVI         = toNum(v2Analysis?.emotional_variance_index);

  const deltaEngagement  = isNaN(v1Engagement)  || isNaN(v2Engagement)  ? NaN : v2Engagement  - v1Engagement;
  const deltaCliffhanger = isNaN(v1Cliffhanger) || isNaN(v2Cliffhanger) ? NaN : v2Cliffhanger - v1Cliffhanger;
  const deltaEVI         = isNaN(v1EVI)         || isNaN(v2EVI)         ? NaN : v2EVI         - v1EVI;

  const improvementPct =
    !isNaN(deltaEngagement) && v1Engagement > 0
      ? (deltaEngagement / v1Engagement) * 100
      : NaN;

  console.log("");
  console.log(
    `  ${C.bold}${pad("Metric", 28)}${pad("Version 1", 16)}${pad("Version 2", 16)}Delta${C.reset}`
  );
  console.log("  " + hRule("─", 68));

  function scoreRow(label: string, v1: number, v2: number, delta: number) {
    console.log(
      `  ${pad(label, 28)}` +
        `${pad(fmtScore(v1), 16 + 9)}` +  // +9 for ANSI escape chars
        `${pad(fmtScore(v2), 16 + 9)}` +
        `${fmtDelta(delta)}`
    );
  }

  scoreRow("Overall Engagement",   v1Engagement,  v2Engagement,  deltaEngagement);
  scoreRow("Avg Cliffhanger",      v1Cliffhanger, v2Cliffhanger, deltaCliffhanger);
  scoreRow("Emotional Variance",   v1EVI,         v2EVI,         deltaEVI);

  if (v2Analysis?.radar_metrics) {
    console.log("");
    console.log(`  ${C.bold}Radar Metrics (Version 2):${C.reset}`);
    for (const [key, val] of Object.entries(v2Analysis.radar_metrics)) {
      console.log(
        `    ${C.gray}${pad(key, 30)}${C.reset}${C.cyan}${Number(val).toFixed(4)}${C.reset}`
      );
    }
  }

  console.log("\n" + hRule("─") + "\n");

  // Verdict
  if (isNaN(deltaEngagement)) {
    log(tag.warn, "Cannot compare — one or both engagement scores was missing.");
  } else if (deltaEngagement > 0 && !isNaN(improvementPct) && improvementPct >= 5) {
    log(
      tag.pass,
      `${C.bold}${C.green}Pipeline SUCCESS${C.reset}` +
        ` — Engagement improved by ${C.green}+${improvementPct.toFixed(1)}%${C.reset}.`
    );
    log(
      tag.info,
      "The heuristic engine detected a RoBERTa sentiment shift and improved the score above the 5% threshold."
    );
  } else if (deltaEngagement > 0) {
    log(
      tag.warn,
      `${C.bold}Diminishing Returns${C.reset}` +
        ` — Improved only ${C.yellow}${improvementPct.toFixed(1)}%${C.reset}` +
        ` (threshold: 5%). Consider a structural rewrite over incremental tweaks.`
    );
  } else if (deltaEngagement === 0) {
    log(tag.warn, "Engagement unchanged after regeneration (Δ = 0.0000).");
  } else {
    log(
      tag.fail,
      `${C.bold}${C.red}Regression detected${C.reset}` +
        ` — Engagement decreased by ${C.red}${deltaEngagement.toFixed(4)}${C.reset}.` +
        " The regenerated script may need a more targeted optimization instruction."
    );
  }

  console.log("\n" + hRule("═"));
  console.log(
    `\n  ${C.gray}V1 id: ${versionId1}${C.reset}` +
    `\n  ${C.gray}V2 id: ${versionId2}${C.reset}\n`
  );
}

// ─── Entry point ─────────────────────────────────────────────────────────────

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  console.error(`\n${C.bold}${C.red}[FATAL]${C.reset} ${msg}`);
  if (stack) {
    console.error(C.gray + stack + C.reset);
  }
  process.exit(1);
});
