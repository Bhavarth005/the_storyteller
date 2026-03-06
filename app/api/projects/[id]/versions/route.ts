import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { projects, versions } from "@/src/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod/v4";

type Params = { params: Promise<{ id: string }> };

const uuidSchema = z.uuid();

// GET /api/projects/:id/versions — Fetch linear version history for a project
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
      columns: { id: true },
    });
    if (!project) {
      return NextResponse.json(
        { error: { code: "PROJECT_NOT_FOUND", message: "The requested project could not be found." } },
        { status: 404 }
      );
    }

    const allVersions = await db
      .select({
        id: versions.id,
        parentVersionId: versions.parentVersionId,
        commitMessage: versions.commitMessage,
        analysisStatus: versions.analysisStatus,
        createdAt: versions.createdAt,
      })
      .from(versions)
      .where(eq(versions.projectId, id))
      .orderBy(desc(versions.createdAt));

    return NextResponse.json({
      versions: allVersions.map((v) => ({
        id: v.id,
        parent_version_id: v.parentVersionId,
        commit_message: v.commitMessage,
        analysis_status: v.analysisStatus,
        created_at: v.createdAt,
      })),
    });
  } catch (error) {
    console.error("GET /api/projects/[id]/versions error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch versions." } },
      { status: 500 }
    );
  }
}
