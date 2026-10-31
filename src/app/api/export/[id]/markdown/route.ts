import { NextRequest } from "next/server";
import { errorResponse } from "@/lib/http";
import { AppError } from "@/lib/errors";
import { requireSession } from "@/lib/auth/session";
import { getTailorRepo } from "@/features/tailor/repo";
import { profileService } from "@/features/profile/service";
import { exportService } from "@/features/export/service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const cleanId = decodeURIComponent(id).trim().replace(/\s+/g, "-");

    const repo = getTailorRepo();
    let resume = await repo.getTailoredResume(session.userId, cleanId);
    if (!resume && cleanId !== id) {
      resume = await repo.getTailoredResume(session.userId, id);
    }
    if (!resume) {
      const allResumes = await repo.listTailoredResumes(session.userId);
      resume = allResumes.find((r) => r.id === cleanId || r.id === id) || null;
    }
    if (!resume) {
      throw AppError.notFound("Tailored resume not found");
    }

    const profile = await profileService.getOrCreateProfile(session.userId, session.email, session.name);
    const markdown = exportService.generateMarkdown(resume, profile);

    return new Response(markdown, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="tailored-resume-v${resume.versionNumber}.md"`,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

