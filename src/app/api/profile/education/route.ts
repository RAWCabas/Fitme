import { NextRequest } from "next/server";
import { errorResponse, jsonResponse } from "@/lib/http";
import { requireSession } from "@/lib/auth/session";
import { profileService } from "@/features/profile/service";

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const education = await profileService.addEducation(session.userId, body);
    return jsonResponse(education, 201);
  } catch (error) {
    return errorResponse(error);
  }
}

