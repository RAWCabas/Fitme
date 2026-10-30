import { NextRequest } from "next/server";
import { errorResponse, jsonResponse } from "@/lib/http";
import { requireSession } from "@/lib/auth/session";
import { profileService } from "@/features/profile/service";

export async function POST(_req: NextRequest) {
  try {
    const session = await requireSession();
    const profile = await profileService.importBothResumes(session.userId);
    return jsonResponse(profile);
  } catch (error) {
    return errorResponse(error);
  }
}
