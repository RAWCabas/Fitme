import { NextRequest } from "next/server";
import { errorResponse, jsonResponse } from "@/lib/http";
import { requireSession } from "@/lib/auth/session";
import { getTailorRepo } from "@/features/tailor/repo";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId") || undefined;

    const resumes = await getTailorRepo().listTailoredResumes(session.userId, jobId);
    return jsonResponse(resumes);
  } catch (error) {
    return errorResponse(error);
  }
}
