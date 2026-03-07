import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/src/db";
import { projects, versions, episodes } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";
import {
  generateStoryArc,
  generateEpisodeScript,
  type ContinuityLedger,
} from "@/src/lib/ai-orchestrator";
import { authOptions } from "@/src/lib/auth";

const generateCoreSchema = z.object({
  title: z.string().min(1, "Title is required.").max(500),
  input_type: z.enum(["idea", "draft"]),
  raw_story: z.string().min(1, "Story text is required."),
  episode_count: z.number().int().min(1).max(20).default(8),
});

// POST /api/generate-core — Initialize project and generate raw episodic scripts
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "You must be signed in." } },
        { status: 401 }
      );
    }
    const userId = (session.user as { id?: string }).id ?? null;

    const body = await request.json();
    const parsed = generateCoreSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "INVALID_BODY", message: parsed.error.issues[0].message } },
        { status: 400 }
      );
    }

    const { title, input_type, raw_story, episode_count } = parsed.data;

    // 1. Generate story arc via AI orchestrator
    const storyArc = await generateStoryArc(title, raw_story, episode_count);

    // 2. Sequentially generate each episode script with continuity chaining
    let previousLedger: ContinuityLedger | null = null;
    const generatedEpisodes: Array<{
      episodeNumber: number;
      title: string;
      scriptContent: string;
      continuityLedger: ContinuityLedger;
    }> = [];

    for (const goal of storyArc.episode_goals) {
      const episodeResult = await generateEpisodeScript(
        goal.narrative_goal,
        goal.episode_number,
        previousLedger
      );
      generatedEpisodes.push({
        episodeNumber: goal.episode_number,
        title: `Episode ${goal.episode_number}: ${goal.narrative_goal.slice(0, 60)}`,
        scriptContent: episodeResult.script_content,
        continuityLedger: episodeResult.continuity_ledger,
      });
      previousLedger = episodeResult.continuity_ledger;
    }

    // 3. Transactional DB writes: Project → Version → Episodes → link activeVersionId
    const result = await db.transaction(async (tx) => {
      const [project] = await tx
        .insert(projects)
        .values({
          title,
          inputType: input_type,
          originalRawStory: raw_story,
          userId,
        })
        .returning();

      const [version] = await tx
        .insert(versions)
        .values({
          projectId: project.id,
          parentVersionId: null,
          commitMessage: "Initial Generation",
          analysisStatus: "pending",
          episodeCount: episode_count,
          globalCharacters: storyArc.global_characters,
        })
        .returning();

      const episodeRows = await tx
        .insert(episodes)
        .values(
          generatedEpisodes.map((ep) => ({
            projectId: project.id,
            versionId: version.id,
            episodeNumber: ep.episodeNumber,
            title: ep.title,
            scriptContent: ep.scriptContent,
            continuityLedger: ep.continuityLedger,
          }))
        )
        .returning();

      await tx
        .update(projects)
        .set({ activeVersionId: version.id })
        .where(eq(projects.id, project.id));

      return { project, version, episodes: episodeRows };
    });

    return NextResponse.json(
      {
        project_id: result.project.id,
        version_id: result.version.id,
        episode_ids: result.episodes.map((ep) => ep.id),
        analysis_status: result.version.analysisStatus,
        message: "Core generation complete. Trigger /api/analyze-version next.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/generate-core error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to generate core project." } },
      { status: 500 }
    );
  }
}
