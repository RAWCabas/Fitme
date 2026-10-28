import { NextRequest } from "next/server";
import { errorResponse, jsonResponse } from "@/lib/http";
import { requireSession } from "@/lib/auth/session";
import { tailorService } from "@/features/tailor/service";
import { resumeStatusSchema } from "@/features/tailor/schema";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const body = await req.json();
    const status = resumeStatusSchema.parse(body.status);

    const updated = await tailorService.updateResumeStatus(session.userId, id, status);
    return jsonResponse(updated);
  } catch (error) {
    return errorResponse(error);
  }
}

