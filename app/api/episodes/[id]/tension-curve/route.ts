import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { episodes } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";
import { calculateTensionCurve, type RawSegment } from "@/src/lib/math-engine";

type Params = { params: Promise<{ id: string }> };

const uuidSchema = z.uuid();

// GET /api/episodes/:id/tension-curve — Returns X,Y coordinates for tension line graph
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
        scriptSegments: true,
        hookAndCliffhangerMetrics: true,
      },
    });

    if (!episode) {
      return NextResponse.json(
        { error: { code: "EPISODE_NOT_FOUND", message: "The requested episode could not be found." } },
        { status: 404 }
      );
    }

    const rawSegments = typeof episode.scriptSegments === "string"
      ? JSON.parse(episode.scriptSegments)
      : episode.scriptSegments;
    const segments = (rawSegments ?? []) as RawSegment[];
    const rawMetrics = typeof episode.hookAndCliffhangerMetrics === "string"
      ? JSON.parse(episode.hookAndCliffhangerMetrics)
      : episode.hookAndCliffhangerMetrics;
    const metrics = rawMetrics as { threat_level?: number } | null;
    const threatLevel = metrics?.threat_level ?? 0.5;

    const curve = calculateTensionCurve(segments, threatLevel);

    return NextResponse.json({
      episode_id: episode.id,
      curve,
    });
  } catch (error) {
    console.error("GET /api/episodes/[id]/tension-curve error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to calculate tension curve." } },
      { status: 500 }
    );
  }
}
