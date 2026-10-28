import { errorResponse, jsonResponse } from "@/lib/http";
import { requireSession } from "@/lib/auth/session";

export async function GET() {
  try {
    const session = await requireSession();
    return jsonResponse({ user: session });
  } catch (error) {
    return errorResponse(error);
  }
}

