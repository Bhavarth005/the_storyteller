import { NextRequest, NextResponse } from "next/server";

// POST /api/rollback — Revert workspace to a previous version
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: { code: "NOT_IMPLEMENTED", message: "POST /api/rollback is not yet implemented." } },
    { status: 501 }
  );
}
