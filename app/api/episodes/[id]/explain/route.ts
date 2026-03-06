import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { episodes } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";

type Params = { params: Promise<{ id: string }> };

const uuidSchema = z.uuid();

// GET /api/episodes/:id/explain — Human-readable logic behind AI scores for tooltips
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const parsed = uuidSchema.safeParse(id);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "INVALID_EPISODE_ID", message: "Episode ID must be a valid UUID." } },
        { status: 400 }
      );
    }

    const episode = await db.query.episodes.findFirst({
      where: eq(episodes.id, id),
      columns: { id: true, optimizationSuggestions: true },
    });

    if (!episode) {
      return NextResponse.json(
        { error: { code: "EPISODE_NOT_FOUND", message: "The requested episode could not be found." } },
        { status: 404 }
      );
    }

    const suggestions = (episode.optimizationSuggestions ?? []) as Array<{
      cliffhanger_logic?: string;
      retention_risk_reason?: string;
      optimization_rationale?: string;
    }>;

    // Aggregate explanations from optimization suggestions array
    const explanations = {
      cliffhanger_logic: suggestions.map((s) => s.cliffhanger_logic).filter(Boolean).join(" ") || null,
      retention_risk_reason: suggestions.map((s) => s.retention_risk_reason).filter(Boolean).join(" ") || null,
      optimization_rationale: suggestions.map((s) => s.optimization_rationale).filter(Boolean).join(" ") || null,
    };

    return NextResponse.json({
      episode_id: episode.id,
      explanations,
    });
  } catch (error) {
    console.error("GET /api/episodes/[id]/explain error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch explanations." } },
      { status: 500 }
    );
  }
}
