import { NextRequest } from "next/server";
import { errorResponse, jsonResponse } from "@/lib/http";
import { requireSession } from "@/lib/auth/session";
import { tailorService } from "@/features/tailor/service";
import { getTailorRepo } from "@/features/tailor/repo";
import { AppError } from "@/lib/errors";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const job = await getTailorRepo().getJobOpportunity(session.userId, id);
    if (!job) throw AppError.notFound("Target job opportunity not found");

    return jsonResponse(job);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const body = await req.json();

    const updated = await tailorService.updateJobOpportunity(session.userId, id, body);
    return jsonResponse(updated);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PUT(req, { params });
}

