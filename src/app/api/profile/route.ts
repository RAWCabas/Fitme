import { NextRequest } from "next/server";
import { errorResponse, jsonResponse } from "@/lib/http";
import { requireSession } from "@/lib/auth/session";
import { profileService } from "@/features/profile/service";

export async function GET() {
  try {
    const session = await requireSession();
    const profile = await profileService.getOrCreateProfile(session.userId, session.email, session.name);
    return jsonResponse(profile);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const summary = typeof body.summary === "string" ? body.summary : "";
    const updated = await profileService.updateSummary(session.userId, summary);
    return jsonResponse(updated);
  } catch (error) {
    return errorResponse(error);
  }
}
