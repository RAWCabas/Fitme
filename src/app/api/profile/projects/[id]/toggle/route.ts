import { NextRequest } from "next/server";
import { errorResponse, jsonResponse } from "@/lib/http";
import { requireSession } from "@/lib/auth/session";
import { profileService } from "@/features/profile/service";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const isHidden = await profileService.toggleProjectVisibility(session.userId, id);
    return jsonResponse({ id, isHidden });
  } catch (error) {
    return errorResponse(error);
  }
}
