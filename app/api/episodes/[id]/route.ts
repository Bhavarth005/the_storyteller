import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { episodes } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";

type Params = { params: Promise<{ id: string }> };

const uuidSchema = z.uuid();

// GET /api/episodes/:id — Fetch single episode's complete script and segment data
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
    });

    if (!episode) {
      return NextResponse.json(
        { error: { code: "EPISODE_NOT_FOUND", message: "The requested episode could not be found." } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: episode.id,
      version_id: episode.versionId,
      episode_number: episode.episodeNumber,
      title: episode.title,
      script_content: episode.scriptContent,
      script_segments: episode.scriptSegments,
      hook_and_cliffhanger_metrics: episode.hookAndCliffhangerMetrics,
      optimization_suggestions: episode.optimizationSuggestions,
    });
  } catch (error) {
    console.error("GET /api/episodes/[id] error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch episode." } },
      { status: 500 }
    );
  }
}
