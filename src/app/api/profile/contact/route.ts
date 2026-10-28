import { NextRequest } from "next/server";
import { errorResponse, jsonResponse } from "@/lib/http";
import { requireSession } from "@/lib/auth/session";
import { profileService } from "@/features/profile/service";

export async function PUT(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const profile = await profileService.updateContact(session.userId, body);
    return jsonResponse(profile);
  } catch (error) {
    return errorResponse(error);
  }
}
