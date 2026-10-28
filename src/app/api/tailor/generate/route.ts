import { NextRequest } from "next/server";
import { errorResponse, jsonResponse } from "@/lib/http";
import { requireSession } from "@/lib/auth/session";
import { tailorService } from "@/features/tailor/service";
import { PageBudget, TypographyPreset } from "@/features/tailor/schema";

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const { jobId, pageBudget, preset } = body;

    const tailoredResume = await tailorService.tailorResume(
      session.userId,
      jobId,
      pageBudget as PageBudget,
      preset as TypographyPreset
    );

    return jsonResponse(tailoredResume, 201);
  } catch (error) {
    return errorResponse(error);
  }
}

