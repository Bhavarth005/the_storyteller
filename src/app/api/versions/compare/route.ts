import { NextRequest, NextResponse } from "next/server";

// GET /api/versions/compare?base_id={uuid}&target_id={uuid} — Calculate delta between two versions
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: { code: "NOT_IMPLEMENTED", message: "GET /api/versions/compare is not yet implemented." } },
    { status: 501 }
  );
}
