import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { projects } from "@/src/db/schema";
import { desc } from "drizzle-orm";

// GET /api/projects — Fetch lightweight list of all projects
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const offset = (page - 1) * limit;

    const [allProjects, countResult] = await Promise.all([
      db
        .select({
          id: projects.id,
          title: projects.title,
          inputType: projects.inputType,
          activeVersionId: projects.activeVersionId,
          createdAt: projects.createdAt,
          updatedAt: projects.updatedAt,
        })
        .from(projects)
        .orderBy(desc(projects.updatedAt))
        .limit(limit)
        .offset(offset),
      db.$count(projects),
    ]);

    return NextResponse.json({
      projects: allProjects.map((p) => ({
        id: p.id,
        title: p.title,
        input_type: p.inputType,
        active_version_id: p.activeVersionId,
        created_at: p.createdAt,
        updated_at: p.updatedAt,
      })),
      pagination: { page, limit, total: Number(countResult) },
    });
  } catch (error) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch projects." } },
      { status: 500 }
    );
  }
}
