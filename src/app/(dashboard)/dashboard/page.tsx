import { requireSession } from "@/lib/auth/session";
import { getTailorRepo } from "@/features/tailor/repo";
import { JobOpportunity } from "@/features/tailor/schema";
import { PipelineClient } from "./pipeline-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireSession();
  const repo = getTailorRepo();

  const resumes = await repo.listTailoredResumes(session.userId);

  // Fetch corresponding job opportunities
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
    <PipelineClient
      initialResumes={resumes}
      jobs={jobsMap}
      userName={session.name || "Candidate"}
    />
  );
}
