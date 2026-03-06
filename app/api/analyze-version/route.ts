import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { versions, episodes, versionAnalysis } from "@/src/db/schema";
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
  deriveEngagementScore,
  calculateEmotionalVariance,
} from "@/src/lib/math-engine";

const analyzeVersionSchema = z.object({
  version_id: z.uuid(),
});

// Extracted single-episode analysis logic (shared with /api/analyze-episode)
async function analyzeOneEpisode(episodeRow: typeof episodes.$inferSelect) {
  const [sentiment, hooks] = await Promise.all([
    analyzeEpisodeSentiment(episodeRow.scriptContent),
    evaluateEpisodeHooks(episodeRow.scriptContent),
  ]);

  const threatLevel = hooks.cliffhanger.threat_level;
  const enrichedSegments = detectRetentionRisks(sentiment.segments, threatLevel);
  const optimizations = await suggestOptimizations(sentiment.segments);

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

  await db
    .update(episodes)
    .set({ scriptSegments, hookAndCliffhangerMetrics, optimizationSuggestions })
    .where(eq(episodes.id, episodeRow.id));

  return { hookAndCliffhangerMetrics, sentiment };
}

// POST /api/analyze-version — Trigger background analysis for all episodes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = analyzeVersionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "INVALID_BODY", message: parsed.error.issues[0].message } },
        { status: 400 }
      );
    }

    const { version_id } = parsed.data;

    // 1. Fetch version
    const version = await db.query.versions.findFirst({
      where: eq(versions.id, version_id),
    });

    if (!version) {
      return NextResponse.json(
        { error: { code: "VERSION_NOT_FOUND", message: "Version not found." } },
        { status: 404 }
      );
    }

    // 2. Set status to 'processing'
    await db
      .update(versions)
      .set({ analysisStatus: "processing" })
      .where(eq(versions.id, version_id));

    // 3. Return 202 immediately, run analysis in background via unhandled promise
    const backgroundAnalysis = (async () => {
      try {
        // Fetch all episodes for this version
        const versionEpisodes = await db.query.episodes.findMany({
          where: eq(episodes.versionId, version_id),
        });

        // Sequentially analyze each episode
        const results: Array<{
          hookAndCliffhangerMetrics: {
            hook_strength: number;
            cliffhanger_score: number;
            open_loops: number;
            threat_level: number;
          };
          sentiment: { segments: Array<{ emotion_intensity: number }> };
        }> = [];

        for (const ep of versionEpisodes) {
          const result = await analyzeOneEpisode(ep);
          results.push(result);
        }

        // 4. Aggregate scores for version_analysis
        const allIntensities = results.flatMap((r) =>
          r.sentiment.segments.map((s) => s.emotion_intensity)
        );
        const avgHookStrength =
          results.reduce((sum, r) => sum + r.hookAndCliffhangerMetrics.hook_strength, 0) /
          (results.length || 1);
        const avgCliffhanger =
          results.reduce((sum, r) => sum + r.hookAndCliffhangerMetrics.cliffhanger_score, 0) /
          (results.length || 1);
        const emotionalVariance = calculateEmotionalVariance(allIntensities);
        const overallEngagement = deriveEngagementScore(
          avgHookStrength,
          emotionalVariance,
          avgCliffhanger / 10 // normalize cliffhanger score to 0-1 range
        );

        const avgThreatLevel =
          results.reduce((sum, r) => sum + r.hookAndCliffhangerMetrics.threat_level, 0) /
          (results.length || 1);

        // Suspense density = average tension across all segments
        const suspenseDensity = allIntensities.length > 0
          ? allIntensities.reduce((a, b) => a + b, 0) / allIntensities.length
          : 0;

        // Retention stability = inverse of drop risk (1 - avg threat_level normalized)
        const retentionStability = parseFloat(
          Math.max(0, Math.min(1, 1 - avgThreatLevel * 0.3)).toFixed(4)
        );

        const radarMetrics = {
          hook_strength: parseFloat(avgHookStrength.toFixed(4)),
          suspense_density: parseFloat(suspenseDensity.toFixed(4)),
          retention_stability: retentionStability,
        };

        // Upsert version_analysis
        await db
          .insert(versionAnalysis)
          .values({
            versionId: version_id,
            overallEngagementScore: overallEngagement.toFixed(4),
            averageCliffhanger: avgCliffhanger.toFixed(2),
            emotionalVarianceIndex: emotionalVariance.toFixed(4),
            radarMetrics,
          })
          .onConflictDoUpdate({
            target: versionAnalysis.versionId,
            set: {
              overallEngagementScore: overallEngagement.toFixed(4),
              averageCliffhanger: avgCliffhanger.toFixed(2),
              emotionalVarianceIndex: emotionalVariance.toFixed(4),
              radarMetrics,
            },
          });

        // 5. Set status to 'complete'
        await db
          .update(versions)
          .set({ analysisStatus: "complete" })
          .where(eq(versions.id, version_id));
      } catch (err) {
        console.error(`Background analysis failed for version ${version_id}:`, err);
        await db
          .update(versions)
          .set({ analysisStatus: "failed" })
          .where(eq(versions.id, version_id));
      }
    })();

    // Fire and forget — do not await
    void backgroundAnalysis;

    return NextResponse.json(
      {
        message: `Analysis queued successfully. Poll /api/status?version_id=${version_id} for completion.`,
        version_id,
      },
      { status: 202 }
    );
  } catch (error) {
    console.error("POST /api/analyze-version error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to queue version analysis." } },
      { status: 500 }
    );
  }
}
