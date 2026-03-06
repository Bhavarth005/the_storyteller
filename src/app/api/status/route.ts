import { NextRequest, NextResponse } from "next/server";

// GET /api/status?version_id={uuid} — Poll background processing progress
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: { code: "NOT_IMPLEMENTED", message: "GET /api/status is not yet implemented." } },
    { status: 501 }
  );
}
