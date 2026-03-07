import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { projects, versions, episodes } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod/v4";
import { generateEpisodeScript } from "@/src/lib/ai-orchestrator";
import { requireAuth } from "@/src/lib/require-auth";

const regenerateEpisodeSchema = z.object({
  project_id: z.uuid(),
  parent_version_id: z.uuid(),
  episode_id: z.uuid(),
  instruction: z.string().min(1, "Instruction is required."),
});

// POST /api/regenerate-episode — Agentic rewrite of a specific episode, creates new version
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = regenerateEpisodeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "INVALID_BODY", message: parsed.error.issues[0].message } },
        { status: 400 }
      );
    }

    const { project_id, parent_version_id, episode_id, instruction } = parsed.data;

    // 1. Verify project exists
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, project_id),
    });
    if (!project) {
      return NextResponse.json(
        { error: { code: "PROJECT_NOT_FOUND", message: "Project not found." } },
        { status: 404 }
      );
    }

    // 2. Verify parent version exists and belongs to project
    const parentVersion = await db.query.versions.findFirst({
      where: and(
        eq(versions.id, parent_version_id),
        eq(versions.projectId, project_id)
      ),
    });
    if (!parentVersion) {
      return NextResponse.json(
        { error: { code: "VERSION_NOT_FOUND", message: "Parent version not found for this project." } },
        { status: 404 }
      );
    }

    // 3. Verify target episode exists and belongs to parent version
    const targetEpisode = await db.query.episodes.findFirst({
      where: and(
        eq(episodes.id, episode_id),
        eq(episodes.versionId, parent_version_id)
      ),
    });
    if (!targetEpisode) {
      return NextResponse.json(
        { error: { code: "EPISODE_NOT_FOUND", message: "Episode not found in the specified version." } },
        { status: 404 }
      );
    }

    // 4. Fetch all episodes from the parent version
    const parentEpisodes = await db.query.episodes.findMany({
      where: eq(episodes.versionId, parent_version_id),
    });

    // 5. Generate rewritten script for the target episode
    const rewriteResult = await generateEpisodeScript(
      instruction,
      targetEpisode.episodeNumber,
      targetEpisode.continuityLedger as Parameters<typeof generateEpisodeScript>[2]
    );

    // 6. Transactional: new Version → duplicate episodes → replace target
    const result = await db.transaction(async (tx) => {
      // Create new version
      const [newVersion] = await tx
        .insert(versions)
        .values({
          projectId: project_id,
          parentVersionId: parent_version_id,
          commitMessage: `Regenerated Episode ${targetEpisode.episodeNumber}: ${instruction.slice(0, 80)}`,
          analysisStatus: "pending",
          episodeCount: parentVersion.episodeCount,
          globalCharacters: parentVersion.globalCharacters,
          generationMetadata: parentVersion.generationMetadata,
        })
        .returning();

      // Duplicate all episodes to new version, replacing the target
      const newEpisodeValues = parentEpisodes.map((ep) => {
        if (ep.id === episode_id) {
          return {
            projectId: project_id,
            versionId: newVersion.id,
            episodeNumber: ep.episodeNumber,
            title: ep.title,
            scriptContent: rewriteResult.script_content,
            continuityLedger: rewriteResult.continuity_ledger,
            // Clear analysis data — will be re-analyzed
            scriptSegments: null,
            hookAndCliffhangerMetrics: null,
            optimizationSuggestions: null,
            characterAppearances: ep.characterAppearances,
          };
        }
        return {
          projectId: project_id,
          versionId: newVersion.id,
          episodeNumber: ep.episodeNumber,
          title: ep.title,
          scriptContent: ep.scriptContent,
          scriptSegments: ep.scriptSegments,
          hookAndCliffhangerMetrics: ep.hookAndCliffhangerMetrics,
          optimizationSuggestions: ep.optimizationSuggestions,
          characterAppearances: ep.characterAppearances,
          continuityLedger: ep.continuityLedger,
        };
      });

      const newEpisodes = await tx
        .insert(episodes)
        .values(newEpisodeValues)
        .returning();

      // Update active version pointer
      await tx
        .update(projects)
        .set({ activeVersionId: newVersion.id })
        .where(eq(projects.id, project_id));

      const newTargetEpisode = newEpisodes.find(
        (ep) => ep.episodeNumber === targetEpisode.episodeNumber
      );

      return { newVersion, newEpisodeId: newTargetEpisode?.id };
    });

    return NextResponse.json(
      {
        new_version_id: result.newVersion.id,
        new_episode_id: result.newEpisodeId,
        analysis_status: "pending",
        message: "Regeneration complete. Trigger /api/analyze-version to re-analyze.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/regenerate-episode error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to regenerate episode." } },
      { status: 500 }
    );
  }
}
