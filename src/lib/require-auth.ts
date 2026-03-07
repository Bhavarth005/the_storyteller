import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";

/**
 * Validate the session for an API route.
 * Returns the userId if authenticated, or a 401 NextResponse.
 */
export async function requireAuth(): Promise<
  | { userId: string; error?: never }
  | { userId?: never; error: NextResponse }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return {
      error: NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "You must be signed in." } },
        { status: 401 }
      ),
    };
  }
  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    return {
      error: NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Invalid session." } },
        { status: 401 }
      ),
    };
  }
  return { userId };
}
