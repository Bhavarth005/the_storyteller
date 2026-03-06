import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { versions } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";

// GET /api/status?version_id={uuid} — Poll background processing progress
export async function GET(request: NextRequest) {
  try {
    const versionId = request.nextUrl.searchParams.get("version_id");

    const parsed = z.uuid().safeParse(versionId);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "INVALID_VERSION_ID", message: "A valid version_id query parameter is required." } },
        { status: 400 }
      );
    }

    const version = await db.query.versions.findFirst({
      where: eq(versions.id, parsed.data),
      columns: { id: true, analysisStatus: true },
    });

    if (!version) {
      return NextResponse.json(
        { error: { code: "VERSION_NOT_FOUND", message: "Version not found." } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      version_id: version.id,
      analysis_status: version.analysisStatus,
    });
  } catch (error) {
    console.error("GET /api/status error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch status." } },
      { status: 500 }
    );
  }
}
