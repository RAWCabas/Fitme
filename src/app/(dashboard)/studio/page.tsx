import { requireSession } from "@/lib/auth/session";
import { profileService } from "@/features/profile/service";
import { getTailorRepo } from "@/features/tailor/repo";
import { JobOpportunity } from "@/features/tailor/schema";
import { StudioClient } from "./studio-client";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const session = await requireSession();
  const repo = getTailorRepo();
  const profile = await profileService.getOrCreateProfile(session.userId, session.email, session.name);
  const resumes = await repo.listTailoredResumes(session.userId);

  const jobsMap: Record<string, JobOpportunity> = {};
  for (const resume of resumes) {
    if (!jobsMap[resume.jobOpportunityId]) {
      const job = await repo.getJobOpportunity(session.userId, resume.jobOpportunityId);
      if (job) {
        jobsMap[resume.jobOpportunityId] = job;
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">The Fit Studio</h1>
        <p className="text-sm text-muted-foreground">
          Analyze job requirements, evaluate your ATS Fit Score, and tailor your resume bullets to match the role.
        </p>
      </div>

      <StudioClient 
        profile={profile} 
        savedResumes={resumes} 
        savedJobs={jobsMap} 
      />
    </div>
  );
}
