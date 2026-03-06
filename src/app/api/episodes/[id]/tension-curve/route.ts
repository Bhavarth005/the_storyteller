import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

// GET /api/episodes/:id/tension-curve — Returns X,Y coordinates for tension line graph
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return NextResponse.json(
    { error: { code: "NOT_IMPLEMENTED", message: `GET /api/episodes/${id}/tension-curve is not yet implemented.` } },
    { status: 501 }
  );
}
