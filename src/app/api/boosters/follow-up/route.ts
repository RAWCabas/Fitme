import { NextRequest } from "next/server";
import { errorResponse, jsonResponse } from "@/lib/http";
import { requireSession } from "@/lib/auth/session";
import { boosterService } from "@/features/boosters/service";
import { z } from "zod";

const requestSchema = z.object({
  resumeId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const { resumeId } = requestSchema.parse(body);

    const followUpEmail = await boosterService.generateFollowUpEmail(session.userId, resumeId);
    return jsonResponse({ followUpEmail });
  } catch (error) {
    return errorResponse(error);
  }
}
