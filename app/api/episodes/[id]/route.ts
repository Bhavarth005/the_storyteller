import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/src/db";
import { episodes } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";
import { authOptions } from "@/src/lib/auth";

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

const patchEpisodeSchema = z.object({
  script_content: z.string().min(1, "Script content is required."),
});

// PATCH /api/episodes/:id — Update episode script content
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "You must be signed in." } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const parsed = uuidSchema.safeParse(id);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "INVALID_EPISODE_ID", message: "Episode ID must be a valid UUID." } },
        { status: 400 }
      );
    }

    const body = await request.json();
    const bodyParsed = patchEpisodeSchema.safeParse(body);
    if (!bodyParsed.success) {
      return NextResponse.json(
        { error: { code: "INVALID_BODY", message: bodyParsed.error.issues[0].message } },
        { status: 400 }
      );
    }

    const existing = await db.query.episodes.findFirst({
      where: eq(episodes.id, id),
      columns: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: { code: "EPISODE_NOT_FOUND", message: "The requested episode could not be found." } },
        { status: 404 }
      );
    }

    await db
      .update(episodes)
      .set({ scriptContent: bodyParsed.data.script_content })
      .where(eq(episodes.id, id));

    return NextResponse.json({ id, updated: true });
  } catch (error) {
    console.error("PATCH /api/episodes/[id] error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to update episode." } },
      { status: 500 }
    );
  }
}
