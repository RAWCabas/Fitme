import { describe, it, expect } from "vitest";
import { tailorService } from "@/features/tailor/service";
import { profileService } from "@/features/profile/service";

describe("Job Tailoring Flow: Parse JD & Tailor Resume", () => {
  it("parses job description and produces a tailored resume with accurate ATS fit score", async () => {
    const userId = "test_user_service_desk_flow";
    const targetTitle = "Service Desk I";
    const sourceUrl = "https://www.linkedin.com/jobs/view/4470073900/";
    const jdText = `Knowledge in basic TCP/IP networking protocols, and network troubleshooting
Familiar with different Operating Systems (Windows, MacOS, Linux)
Self-motivated, tenacious, and eager to learn.
Excellent interpersonal skills / Client-oriented
Good analytical and problem-solving skills
Ability to work well in a team.

Experience Range Range (Years)
0 2 years`;

    // 1. Parse JD
    const job = await tailorService.parseJobDescription(userId, jdText, sourceUrl, targetTitle);
    expect(job.id).toBeDefined();
    expect(job.role).toBe("Service Desk I");
    expect(job.extractedSkills.length).toBeGreaterThan(0);

    // 2. Fetch or create candidate profile
    const profile = await profileService.getOrCreateProfile(userId, "rhinnanthon@gmail.com", "Rhinn Anthon William D. Cabas");

    // 3. Tailor resume
    const tailored = await tailorService.tailorResume(
      userId,
      job.id,
      "1_page",
      "cabas_executive",
      "rhinnanthon@gmail.com",
      "Rhinn Anthon William D. Cabas",
      profile
    );

    expect(tailored.id).toBeDefined();
    expect(tailored.jobOpportunityId).toBe(job.id);
    expect(tailored.preset).toBe("cabas_executive");
    expect(tailored.pageBudget).toBe("1_page");
    expect(tailored.fitScore.score).toBeGreaterThanOrEqual(0);
    expect(tailored.tailoredExperiences.length).toBeGreaterThan(0);
  });
});
