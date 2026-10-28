import { NextRequest } from "next/server";
import { errorResponse, jsonResponse } from "@/lib/http";
import { requireSession } from "@/lib/auth/session";
import { profileService } from "@/features/profile/service";

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const experience = await profileService.addExperience(session.userId, body);
    return jsonResponse(experience, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
