import { NextRequest } from "next/server";
import { errorResponse, jsonResponse } from "@/lib/http";
import { requireSession } from "@/lib/auth/session";
import { tailorService } from "@/features/tailor/service";

export async function POST(req: NextRequest) {
  try {
    await requireSession();
    const body = await req.json();
    const { bullet, metricsContext } = body;

    const boostedBullet = await tailorService.boostBulletWithMetrics(bullet, metricsContext);
    return jsonResponse({ boostedBullet });
  } catch (error) {
    return errorResponse(error);
  }
}
