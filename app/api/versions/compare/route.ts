import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { versionAnalysis } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";
import { calculateVersionDelta, type RadarMetrics } from "@/src/lib/math-engine";

const uuidSchema = z.uuid();

function toRadarMetrics(
  analysis: {
    overallEngagementScore: string | number | null;
    averageCliffhanger: string | number | null;
    radarMetrics: unknown;
  }
): RadarMetrics {
  const stored = (analysis.radarMetrics as Record<string, number> | null) ?? {};
  const hookStrength =
    typeof stored.hook_strength === "number"
      ? stored.hook_strength
      : Number(analysis.overallEngagementScore ?? 0);
  const suspenseDensity =
    typeof stored.suspense_density === "number"
      ? stored.suspense_density
      : Number(analysis.averageCliffhanger ?? 0);
  const retentionStability =
    typeof stored.retention_stability === "number"
      ? stored.retention_stability
      : 0;

  return {
    ...stored,
    hook_strength: hookStrength,
    suspense_density: suspenseDensity,
    retention_stability: retentionStability,
  };
}

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

    const baseMetrics = toRadarMetrics(baseAnalysis);
    const targetMetrics = toRadarMetrics(targetAnalysis);

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
