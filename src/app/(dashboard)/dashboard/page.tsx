import { requireSession } from "@/lib/auth/session";
import { getTailorRepo } from "@/features/tailor/repo";
import { profileService } from "@/features/profile/service";
import { JobOpportunity, TailoredResume } from "@/features/tailor/schema";
import { PipelineClient } from "./pipeline-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireSession();
  const repo = getTailorRepo();

  let resumes: TailoredResume[] = [];
  try {
    resumes = await repo.listTailoredResumes(session.userId);
  } catch (err) {
    console.error("Failed to list resumes on dashboard:", err);
  }

  // Fetch corresponding job opportunities
  const jobsMap: Record<string, JobOpportunity> = {};
  for (const resume of resumes) {
    if (!jobsMap[resume.jobOpportunityId]) {
      try {
        const job = await repo.getJobOpportunity(session.userId, resume.jobOpportunityId);
        if (job) {
          jobsMap[resume.jobOpportunityId] = job;
        }
      } catch (err) {
        console.error("Failed to load job opportunity for resume:", resume.id, err);
      }
    }
  }

  // Fetch user profile to display real full name
  let displayName = session.name || "Candidate";
  try {
    const profile = await profileService.getOrCreateProfile(session.userId, session.email, session.name);
    if (profile?.contact?.fullName && profile.contact.fullName !== "Candidate") {
      displayName = profile.contact.fullName;
    }
  } catch (err) {
    console.error("Failed to load profile for dashboard:", err);
  }

  return (
    <PipelineClient
      initialResumes={resumes}
      jobs={jobsMap}
      userName={displayName}
      userId={session.userId}
    />
  );
}
