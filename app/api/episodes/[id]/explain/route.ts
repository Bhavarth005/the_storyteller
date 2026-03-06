import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { episodes } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";

type Params = { params: Promise<{ id: string }> };

const uuidSchema = z.uuid();

// GET /api/episodes/:id/explain — Human-readable logic behind AI scores for tooltips
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const parsed = uuidSchema.safeParse(id);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "INVALID_EPISODE_ID", message: "Episode ID must be a valid UUID." } },
        { status: 400 }
      );
    }

    const episode = await db.query.episodes.findFirst({
      where: eq(episodes.id, id),
      columns: {
        id: true,
        optimizationSuggestions: true,
        hookAndCliffhangerMetrics: true,
        scriptSegments: true,
      },
    });

    if (!episode) {
      return NextResponse.json(
        { error: { code: "EPISODE_NOT_FOUND", message: "The requested episode could not be found." } },
        { status: 404 }
      );
    }

    // Derive cliffhanger_logic from hookAndCliffhangerMetrics
    const metrics = episode.hookAndCliffhangerMetrics as {
      open_loops?: number;
      threat_level?: number;
    } | null;
    const cliffhangerLogic = metrics
      ? `${metrics.open_loops ?? 0} unresolved narrative thread(s) remain open with a threat level of ${((metrics.threat_level ?? 0) * 100).toFixed(0)}%, creating sustained viewer anticipation.`
      : null;

    // Derive retention_risk_reason from scriptSegments
    const segments = (episode.scriptSegments ?? []) as Array<{
      start_sec: number;
      emotion_intensity?: number;
      drop_probability?: number;
    }>;
    const highRiskSegments = segments.filter((s) => (s.drop_probability ?? 0) > 0.5);
    const retentionRiskReason = highRiskSegments.length > 0
      ? `Emotional intensity dropped below safe thresholds for ${highRiskSegments.length} segment(s) starting at ${highRiskSegments.map((s) => `${s.start_sec}s`).join(", ")}, indicating retention risk zones.`
      : "No significant retention risk zones detected. Emotional pacing remains within safe thresholds throughout.";

    // Derive optimization_rationale from optimizationSuggestions
    const suggestions = (episode.optimizationSuggestions ?? []) as Array<{
      target_time_sec?: number;
      suggestion?: string;
    }>;
    const optimizationRationale = suggestions.length > 0
      ? suggestions.map((s) => s.suggestion).filter(Boolean).join(" ")
      : "Pacing is strong across all segments. No immediate optimizations recommended.";

    const explanations = {
      cliffhanger_logic: cliffhangerLogic,
      retention_risk_reason: retentionRiskReason,
      optimization_rationale: optimizationRationale,
    };

    return NextResponse.json({
      episode_id: episode.id,
      explanations,
    });
  } catch (error) {
    console.error("GET /api/episodes/[id]/explain error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch explanations." } },
      { status: 500 }
    );
  }
}
