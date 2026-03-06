import { NextRequest, NextResponse } from "next/server";

// POST /api/finalize-version — Aggregate radar metrics, mark version as complete
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: { code: "NOT_IMPLEMENTED", message: "POST /api/finalize-version is not yet implemented." } },
    { status: 501 }
  );
}
