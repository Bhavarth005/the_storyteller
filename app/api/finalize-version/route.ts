import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { versions, versionAnalysis } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";
import { requireAuth } from "@/src/lib/require-auth";

const finalizeVersionSchema = z.object({
  version_id: z.uuid(),
  commit_message: z.string().min(1).max(500).optional(),
});

// POST /api/finalize-version — Mark a version as complete, optionally update commit message
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = finalizeVersionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "INVALID_BODY", message: parsed.error.issues[0].message } },
        { status: 400 }
      );
    }

    const { version_id, commit_message } = parsed.data;

    // 1. Fetch version
    const version = await db.query.versions.findFirst({
      where: eq(versions.id, version_id),
    });

    if (!version) {
      return NextResponse.json(
        { error: { code: "VERSION_NOT_FOUND", message: "Version not found." } },
        { status: 404 }
      );
    }

    if (version.analysisStatus === "processing") {
      return NextResponse.json(
        { error: { code: "VERSION_PROCESSING", message: "Cannot finalize a version that is still being analyzed." } },
        { status: 400 }
      );
    }

    // 2. Update version: set status to 'complete' and optionally update commit message
    const updateSet: Record<string, unknown> = { analysisStatus: "complete" as const };
    if (commit_message) {
      updateSet.commitMessage = commit_message;
    }

    await db
      .update(versions)
      .set(updateSet)
      .where(eq(versions.id, version_id));

    // 3. Check if version_analysis exists; if not, create a placeholder
    const existingAnalysis = await db.query.versionAnalysis.findFirst({
      where: eq(versionAnalysis.versionId, version_id),
    });

    if (!existingAnalysis) {
      await db.insert(versionAnalysis).values({
        versionId: version_id,
        overallEngagementScore: "0",
        averageCliffhanger: "0",
        emotionalVarianceIndex: "0",
        radarMetrics: { hook_strength: 0, suspense_density: 0, retention_stability: 0 },
      });
    }

    return NextResponse.json({
      version_id,
      analysis_status: "complete",
      commit_message: commit_message ?? version.commitMessage,
      message: "Version finalized successfully.",
    });
  } catch (error) {
    console.error("POST /api/finalize-version error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to finalize version." } },
      { status: 500 }
    );
  }
}
