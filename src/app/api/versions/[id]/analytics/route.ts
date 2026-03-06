import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

// GET /api/versions/:id/analytics — Fetch radar metrics and health scores
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return NextResponse.json(
    { error: { code: "NOT_IMPLEMENTED", message: `GET /api/versions/${id}/analytics is not yet implemented.` } },
    { status: 501 }
  );
}
