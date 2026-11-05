import { NextRequest } from "next/server";
import { errorResponse, jsonResponse } from "@/lib/http";
import { requireSession } from "@/lib/auth/session";
import { profileService } from "@/features/profile/service";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; bulletId: string }> }
) {
  try {
    const session = await requireSession();
    const { id, bulletId } = await params;
    const isHidden = await profileService.toggleBulletVisibility(session.userId, "experience", id, bulletId);
    return jsonResponse({ id, bulletId, isHidden });
  } catch (error) {
    return errorResponse(error);
  }
}

