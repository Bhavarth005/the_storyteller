import { NextRequest, NextResponse } from "next/server";

// POST /api/analyze-episode — Analyze a single episode (NLP + LLM)
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: { code: "NOT_IMPLEMENTED", message: "POST /api/analyze-episode is not yet implemented." } },
    { status: 501 }
  );
}
