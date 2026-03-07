import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { projects } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";

type Params = { params: Promise<{ id: string }> };

const uuidSchema = z.uuid();

// GET /api/projects/:id — Fetch complete hierarchical state of active version
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const parsed = uuidSchema.safeParse(id);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "INVALID_PROJECT_ID", message: "Project ID must be a valid UUID." } },
        { status: 400 }
      );
    }

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, id),
      with: {
        activeVersion: {
          with: {
            episodes: {
              orderBy: (episodes, { asc }) => [asc(episodes.episodeNumber)],
            },
            versionAnalysis: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: { code: "PROJECT_NOT_FOUND", message: "The requested project could not be found." } },
        { status: 404 }
      );
    }

    const activeVersion = project.activeVersion;

    // Safety: parse jsonb fields that may be double-serialized strings
    const safeJson = (val: unknown) =>
      typeof val === "string" ? JSON.parse(val) : val;

    return NextResponse.json({
      id: project.id,
      title: project.title,
      input_type: project.inputType,
      original_raw_story: project.originalRawStory,
      active_version_id: project.activeVersionId,
      version_data: activeVersion
        ? {
            id: activeVersion.id,
            analysis_status: activeVersion.analysisStatus,
            commit_message: activeVersion.commitMessage,
            global_characters: safeJson(activeVersion.globalCharacters),
            episodes: activeVersion.episodes.map((ep) => ({
              id: ep.id,
              episode_number: ep.episodeNumber,
              title: ep.title,
              script_content: ep.scriptContent,
              script_segments: safeJson(ep.scriptSegments),
              hook_and_cliffhanger_metrics: safeJson(ep.hookAndCliffhangerMetrics),
              optimization_suggestions: safeJson(ep.optimizationSuggestions),
              character_appearances: safeJson(ep.characterAppearances),
              continuity_notes: ep.continuityLedger,
            })),
            version_analysis: activeVersion.versionAnalysis
              ? {
                  overall_engagement_score: Number(activeVersion.versionAnalysis.overallEngagementScore) || 0,
                  average_cliffhanger: Number(activeVersion.versionAnalysis.averageCliffhanger) || 0,
                  emotional_variance_index: Number(activeVersion.versionAnalysis.emotionalVarianceIndex) || 0,
                  radar_metrics: safeJson(activeVersion.versionAnalysis.radarMetrics),
                }
              : null,
          }
        : null,
    });
  } catch (error) {
    console.error("GET /api/projects/[id] error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch project." } },
      { status: 500 }
    );
  }
}

const patchBodySchema = z.object({
  title: z.string().min(1, "Title must not be empty.").max(500),
});

// PATCH /api/projects/:id — Update project metadata
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const idParsed = uuidSchema.safeParse(id);
    if (!idParsed.success) {
      return NextResponse.json(
        { error: { code: "INVALID_PROJECT_ID", message: "Project ID must be a valid UUID." } },
        { status: 400 }
      );
    }

    const body = await request.json();
    const bodyParsed = patchBodySchema.safeParse(body);
    if (!bodyParsed.success) {
      return NextResponse.json(
        { error: { code: "INVALID_BODY", message: bodyParsed.error.issues[0].message } },
        { status: 400 }
      );
    }

    const updated = await db
      .update(projects)
      .set({ title: bodyParsed.data.title })
      .where(eq(projects.id, id))
      .returning({
        id: projects.id,
        title: projects.title,
        updatedAt: projects.updatedAt,
      });

    if (updated.length === 0) {
      return NextResponse.json(
        { error: { code: "PROJECT_NOT_FOUND", message: "The requested project could not be found." } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: updated[0].id,
      title: updated[0].title,
      updated_at: updated[0].updatedAt,
    });
  } catch (error) {
    console.error("PATCH /api/projects/[id] error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to update project." } },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/:id — Permanently delete a project (cascades to versions, episodes)
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
      const { id } = await params;
    const idParsed = uuidSchema.safeParse(id);
    if (!idParsed.success) {
      return NextResponse.json(
        { error: { code: "INVALID_PROJECT_ID", message: "Project ID must be a valid UUID." } },
        { status: 400 }
      );
    }

    const deleted = await db
      .delete(projects)
      .where(eq(projects.id, id))
      .returning({ id: projects.id });

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: { code: "PROJECT_NOT_FOUND", message: "The requested project could not be found." } },
        { status: 404 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/projects/[id] error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to delete project." } },
      { status: 500 }
    );
  }
}
