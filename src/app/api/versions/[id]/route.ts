import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

// GET /api/versions/:id — Fetch full data payload for a specific version
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return NextResponse.json(
    { error: { code: "NOT_IMPLEMENTED", message: `GET /api/versions/${id} is not yet implemented.` } },
    { status: 501 }
  );
}

// DELETE /api/versions/:id — Delete a specific version (cannot delete active)
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return NextResponse.json(
    { error: { code: "NOT_IMPLEMENTED", message: `DELETE /api/versions/${id} is not yet implemented.` } },
    { status: 501 }
  );
}
