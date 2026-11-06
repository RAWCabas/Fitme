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

  it("handles and clamps overly long skill and requirement strings from AI without throwing schema errors", async () => {
    const userId = "test_user_long_strings";
    const longJdText = `Familiar with different complex distributed operating systems and legacy enterprise workstation environments (Windows 11, MacOS Sequoia, Ubuntu Linux Server LTS)
Extensive hands-on troubleshooting experience resolving network connectivity and TCP/IP routing incidents in multi-region environments
Excellent client satisfaction and customer relationship management skills across international corporate accounts`;

    const job = await tailorService.parseJobDescription(userId, longJdText, "", "Lead Support Specialist");
    expect(job.id).toBeDefined();
    // Verify all extracted skills satisfy schema bound (max 50 chars)
    for (const skill of job.extractedSkills) {
      expect(skill.length).toBeLessThanOrEqual(50);
    }
    // Verify all must-haves satisfy schema bound (max 200 chars)
    for (const req of job.mustHaves) {
      expect(req.length).toBeLessThanOrEqual(200);
    }
  });
});

