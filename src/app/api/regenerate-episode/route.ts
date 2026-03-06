import { NextRequest, NextResponse } from "next/server";

// POST /api/regenerate-episode — Agentic rewrite of a specific episode, creates new version
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: { code: "NOT_IMPLEMENTED", message: "POST /api/regenerate-episode is not yet implemented." } },
    { status: 501 }
  );
}
