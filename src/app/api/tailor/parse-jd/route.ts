import { NextRequest } from "next/server";
import { errorResponse, jsonResponse } from "@/lib/http";
import { requireSession } from "@/lib/auth/session";
import { tailorService } from "@/features/tailor/service";

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const { rawDescription, sourceUrl } = body;

    const job = await tailorService.parseJobDescription(session.userId, rawDescription, sourceUrl);
    return jsonResponse(job, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
