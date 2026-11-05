import { NextRequest } from "next/server";
import { errorResponse, jsonResponse } from "@/lib/http";
import { requireSession } from "@/lib/auth/session";
import { profileService } from "@/features/profile/service";

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const fieldName = String(body.field || "").trim();
    if (!fieldName) {
      return jsonResponse({ error: "Field name required" }, 400);
    }
    const isHidden = await profileService.toggleContactFieldVisibility(session.userId, fieldName);
    return jsonResponse({ field: fieldName, isHidden });
  } catch (error) {
    return errorResponse(error);
  }
}

