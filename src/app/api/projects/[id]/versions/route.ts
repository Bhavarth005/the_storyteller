import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

// GET /api/projects/:id/versions — Fetch linear version history for a project
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return NextResponse.json(
    { error: { code: "NOT_IMPLEMENTED", message: `GET /api/projects/${id}/versions is not yet implemented.` } },
    { status: 501 }
  );
}
