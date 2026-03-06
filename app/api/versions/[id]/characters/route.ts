import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { versions } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";

type Params = { params: Promise<{ id: string }> };

const uuidSchema = z.uuid();

// GET /api/versions/:id/characters — Fetch global character state for continuity sidebar
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
      columns: { id: true, globalCharacters: true },
    });

    if (!version) {
      return NextResponse.json(
        { error: { code: "VERSION_NOT_FOUND", message: "The requested version could not be found." } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      version_id: version.id,
      characters: version.globalCharacters ?? [],
    });
  } catch (error) {
    console.error("GET /api/versions/[id]/characters error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch characters." } },
      { status: 500 }
    );
  }
}
