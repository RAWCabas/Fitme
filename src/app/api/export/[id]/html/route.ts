import { NextRequest } from "next/server";
import { errorResponse } from "@/lib/http";
import { AppError } from "@/lib/errors";
import { requireSession } from "@/lib/auth/session";
import { getTailorRepo } from "@/features/tailor/repo";
import { profileService } from "@/features/profile/service";
import { exportService } from "@/features/export/service";
import { typographyPresetSchema, TypographyPreset } from "@/features/tailor/schema";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const repo = getTailorRepo();
    const resume = await repo.getTailoredResume(session.userId, id);
    if (!resume) {
      throw AppError.notFound("Tailored resume not found");
    }

    const rawPreset = req.nextUrl.searchParams.get("preset");
    let preset: TypographyPreset = resume.preset;
    if (rawPreset) {
      const parsed = typographyPresetSchema.safeParse(rawPreset);
      if (parsed.success) {
        preset = parsed.data;
      }
    }

    const shouldAutoPrint = req.nextUrl.searchParams.get("print") === "true";

    const profile = await profileService.getOrCreateProfile(session.userId);
    let html = exportService.generateHtmlDocument(resume, profile, preset);

    if (shouldAutoPrint) {
      html = html.replace(
        "</body>",
        "<script>window.addEventListener('load', () => { setTimeout(() => window.print(), 100); });</script></body>"
      );
    }

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

