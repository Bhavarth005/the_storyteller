import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { projects, versions } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";

const rollbackSchema = z.object({
  project_id: z.uuid(),
  target_version_id: z.uuid(),
});

// POST /api/rollback — Revert workspace to a previous version
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = rollbackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "INVALID_BODY", message: "Request body must include valid project_id and target_version_id UUIDs." } },
        { status: 400 }
      );
    }

    const { project_id, target_version_id } = parsed.data;

    // Verify project exists
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, project_id),
      columns: { id: true },
    });
    if (!project) {
      return NextResponse.json(
        { error: { code: "PROJECT_NOT_FOUND", message: "The requested project could not be found." } },
        { status: 404 }
      );
    }

    // Verify the target version exists and belongs to this project
    const version = await db.query.versions.findFirst({
      where: eq(versions.id, target_version_id),
      columns: { id: true, projectId: true },
    });
    if (!version || version.projectId !== project_id) {
      return NextResponse.json(
        { error: { code: "VERSION_NOT_FOUND", message: "The target version could not be found or does not belong to this project." } },
        { status: 404 }
      );
    }

    await db
      .update(projects)
      .set({ activeVersionId: target_version_id })
      .where(eq(projects.id, project_id));

    return NextResponse.json({
      status: "success",
      active_version_id: target_version_id,
    });
  } catch (error) {
    console.error("POST /api/rollback error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to rollback version." } },
      { status: 500 }
    );
  }
}
