import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { versionAnalysis } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";
import { calculateVersionDelta, type RadarMetrics } from "@/src/lib/math-engine";

const uuidSchema = z.uuid();

// GET /api/versions/compare?base_id={uuid}&target_id={uuid} — Calculate delta between two versions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const baseId = searchParams.get("base_id");
    const targetId = searchParams.get("target_id");

    if (!baseId || !targetId) {
      return NextResponse.json(
        { error: { code: "MISSING_PARAMS", message: "Both base_id and target_id query parameters are required." } },
        { status: 400 }
      );
    }

    if (!uuidSchema.safeParse(baseId).success || !uuidSchema.safeParse(targetId).success) {
      return NextResponse.json(
        { error: { code: "INVALID_VERSION_ID", message: "base_id and target_id must be valid UUIDs." } },
        { status: 400 }
      );
    }

    const [baseAnalysis, targetAnalysis] = await Promise.all([
      db.query.versionAnalysis.findFirst({ where: eq(versionAnalysis.versionId, baseId) }),
      db.query.versionAnalysis.findFirst({ where: eq(versionAnalysis.versionId, targetId) }),
    ]);

    if (!baseAnalysis || !targetAnalysis) {
      return NextResponse.json(
        { error: { code: "ANALYSIS_NOT_FOUND", message: "Analysis data not found for one or both versions." } },
        { status: 404 }
      );
    }

    const baseMetrics: RadarMetrics = {
      overall_engagement: Number(baseAnalysis.overallEngagementScore ?? 0),
      average_cliffhanger: Number(baseAnalysis.averageCliffhanger ?? 0),
      retention_stability: (baseAnalysis.radarMetrics as RadarMetrics | null)?.retention_stability ?? 0,
      ...(baseAnalysis.radarMetrics as Record<string, number> | null),
    };

    const targetMetrics: RadarMetrics = {
      overall_engagement: Number(targetAnalysis.overallEngagementScore ?? 0),
      average_cliffhanger: Number(targetAnalysis.averageCliffhanger ?? 0),
      retention_stability: (targetAnalysis.radarMetrics as RadarMetrics | null)?.retention_stability ?? 0,
      ...(targetAnalysis.radarMetrics as Record<string, number> | null),
    };

    const deltas = calculateVersionDelta(baseMetrics, targetMetrics);

    return NextResponse.json({
      base_version_id: baseId,
      target_version_id: targetId,
      deltas,
    });
  } catch (error) {
    console.error("GET /api/versions/compare error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to compare versions." } },
      { status: 500 }
    );
  }
}
