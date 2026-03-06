import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { versions, versionAnalysis } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";

type Params = { params: Promise<{ id: string }> };

const uuidSchema = z.uuid();

// GET /api/versions/:id/analytics — Fetch radar metrics and health scores
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const parsed = uuidSchema.safeParse(id);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "INVALID_VERSION_ID", message: "Version ID must be a valid UUID." } },
        { status: 400 }
      );
    }

    const version = await db.query.versions.findFirst({
      where: eq(versions.id, id),
      columns: { id: true },
      with: { versionAnalysis: true },
    });

    if (!version) {
      return NextResponse.json(
        { error: { code: "VERSION_NOT_FOUND", message: "The requested version could not be found." } },
        { status: 404 }
      );
    }

    if (!version.versionAnalysis) {
      return NextResponse.json(
        { error: { code: "ANALYSIS_NOT_FOUND", message: "No analysis data exists for this version." } },
        { status: 404 }
      );
    }

    const a = version.versionAnalysis;
    return NextResponse.json({
      version_id: version.id,
      overall_engagement_score: a.overallEngagementScore ? Number(a.overallEngagementScore) : null,
      average_cliffhanger: a.averageCliffhanger ? Number(a.averageCliffhanger) : null,
      emotional_variance_index: a.emotionalVarianceIndex ? Number(a.emotionalVarianceIndex) : null,
      radar_metrics: a.radarMetrics,
    });
  } catch (error) {
    console.error("GET /api/versions/[id]/analytics error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch analytics." } },
      { status: 500 }
    );
  }
}
