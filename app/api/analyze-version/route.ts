import { NextRequest, NextResponse } from "next/server";

// POST /api/analyze-version — Trigger background NLP/LLM analysis for all episodes
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: { code: "NOT_IMPLEMENTED", message: "POST /api/analyze-version is not yet implemented." } },
    { status: 501 }
  );
}
