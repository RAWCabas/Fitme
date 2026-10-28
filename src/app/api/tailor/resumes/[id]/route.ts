import { NextRequest } from "next/server";
import { errorResponse, jsonResponse } from "@/lib/http";
import { requireSession } from "@/lib/auth/session";
import { getTailorRepo } from "@/features/tailor/repo";
import { AppError } from "@/lib/errors";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const resume = await getTailorRepo().getTailoredResume(session.userId, id);
    if (!resume) throw AppError.notFound("Tailored resume not found");

    return jsonResponse(resume);
  } catch (error) {
    return errorResponse(error);
  }
}
