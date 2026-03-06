import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { projects, versions } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";

type Params = { params: Promise<{ id: string }> };

const uuidSchema = z.uuid();

// GET /api/versions/:id — Fetch full data payload for a specific version
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
      with: {
        episodes: {
          orderBy: (episodes, { asc }) => [asc(episodes.episodeNumber)],
        },
        versionAnalysis: true,
      },
    });

    if (!version) {
      return NextResponse.json(
        { error: { code: "VERSION_NOT_FOUND", message: "The requested version could not be found." } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: version.id,
      analysis_status: version.analysisStatus,
      commit_message: version.commitMessage,
      global_characters: version.globalCharacters,
      episodes: version.episodes.map((ep) => ({
        id: ep.id,
        episode_number: ep.episodeNumber,
        title: ep.title,
        script_content: ep.scriptContent,
        script_segments: ep.scriptSegments,
        hook_and_cliffhanger_metrics: ep.hookAndCliffhangerMetrics,
        optimization_suggestions: ep.optimizationSuggestions,
        character_appearances: ep.characterAppearances,
        continuity_notes: ep.continuityLedger,
      })),
      version_analysis: version.versionAnalysis
        ? {
            overall_engagement_score: version.versionAnalysis.overallEngagementScore
              ? Number(version.versionAnalysis.overallEngagementScore)
              : null,
            average_cliffhanger: version.versionAnalysis.averageCliffhanger
              ? Number(version.versionAnalysis.averageCliffhanger)
              : null,
            emotional_variance_index: version.versionAnalysis.emotionalVarianceIndex
              ? Number(version.versionAnalysis.emotionalVarianceIndex)
              : null,
            radar_metrics: version.versionAnalysis.radarMetrics,
          }
        : null,
    });
  } catch (error) {
    console.error("GET /api/versions/[id] error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch version." } },
      { status: 500 }
    );
  }
}

// DELETE /api/versions/:id — Delete a specific version (cannot delete active)
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const parsed = uuidSchema.safeParse(id);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "INVALID_VERSION_ID", message: "Version ID must be a valid UUID." } },
        { status: 400 }
      );
    }

    // Check the version exists and get its project
    const version = await db.query.versions.findFirst({
      where: eq(versions.id, id),
      columns: { id: true, projectId: true },
    });

    if (!version) {
      return NextResponse.json(
        { error: { code: "VERSION_NOT_FOUND", message: "The requested version could not be found." } },
        { status: 404 }
      );
    }

    // Prevent deletion of the active version
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, version.projectId),
      columns: { activeVersionId: true },
    });

    if (project?.activeVersionId === id) {
      return NextResponse.json(
        { error: { code: "CANNOT_DELETE_ACTIVE", message: "Cannot delete the active version. Rollback to a different version first." } },
        { status: 400 }
      );
    }

    await db.delete(versions).where(eq(versions.id, id));

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/versions/[id] error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to delete version." } },
      { status: 500 }
    );
  }
}
