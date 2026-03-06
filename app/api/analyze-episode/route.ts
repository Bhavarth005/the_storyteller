import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { episodes } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";
import {
  analyzeEpisodeSentiment,
  evaluateEpisodeHooks,
  suggestOptimizations,
} from "@/src/lib/ai-orchestrator";
import {
  calculateTensionCurve,
  detectRetentionRisks,
} from "@/src/lib/math-engine";

const analyzeEpisodeSchema = z.object({
  episode_id: z.uuid(),
});

// POST /api/analyze-episode — Analyze a single episode (NLP + LLM + math)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = analyzeEpisodeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "INVALID_BODY", message: parsed.error.issues[0].message } },
        { status: 400 }
      );
    }

    const { episode_id } = parsed.data;

    // 1. Fetch the episode
    const episode = await db.query.episodes.findFirst({
      where: eq(episodes.id, episode_id),
    });

    if (!episode) {
      return NextResponse.json(
        { error: { code: "EPISODE_NOT_FOUND", message: "Episode not found." } },
        { status: 404 }
      );
    }

    // 2. Run AI analysis pipelines
    const [sentiment, hooks] = await Promise.all([
      analyzeEpisodeSentiment(episode.scriptContent),
      evaluateEpisodeHooks(episode.scriptContent),
    ]);

    // 3. Run math engine on sentiment data
    const threatLevel = hooks.cliffhanger.threat_level;
    const tensionCurve = calculateTensionCurve(sentiment.segments, threatLevel);
    const enrichedSegments = detectRetentionRisks(sentiment.segments, threatLevel);

    // 4. Generate optimization suggestions
    const optimizations = await suggestOptimizations(sentiment.segments);

    // 5. Build JSONB payloads
    const scriptSegments = enrichedSegments.map((seg) => ({
      start_sec: seg.start_sec,
      end_sec: seg.end_sec,
      text: seg.text,
      emotion: seg.emotion,
      emotion_intensity: seg.emotion_intensity,
      drop_probability: seg.drop_probability,
      engagement_score: seg.engagement_score,
    }));

    const hookAndCliffhangerMetrics = {
      hook_strength: hooks.hook.novelty_score,
      cliffhanger_score: hooks.cliffhanger.open_loops,
      open_loops: hooks.cliffhanger.open_loops,
      threat_level: hooks.cliffhanger.threat_level,
    };

    const optimizationSuggestions = optimizations.optimization_suggestions.map((s) => ({
      target_time_sec: s.target_time_sec,
      suggestion: s.suggestion,
    }));

    // 6. Update the episode in DB
    await db
      .update(episodes)
      .set({
        scriptSegments,
        hookAndCliffhangerMetrics,
        optimizationSuggestions,
      })
      .where(eq(episodes.id, episode_id));

    return NextResponse.json({
      episode_id,
      status: "success",
    });
  } catch (error) {
    console.error("POST /api/analyze-episode error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to analyze episode." } },
      { status: 500 }
    );
  }
}
