import { describe, it, expect, beforeEach } from "vitest";
import { TailorService } from "@/features/tailor/service";
import { MemoryTailorRepo } from "@/features/tailor/repo";
import { ProfileService } from "@/features/profile/service";
import { MemoryProfileRepo, setProfileRepo } from "@/features/profile/repo";

describe("AI Fit Engine: JD Parsing, Scoring & Tailoring", () => {
  let tailorRepo: MemoryTailorRepo;
  let tailorService: TailorService;
  let profileRepo: MemoryProfileRepo;
  let profileService: ProfileService;

  const userId = "test_candidate_123";

  beforeEach(async () => {
    tailorRepo = new MemoryTailorRepo();
    profileRepo = new MemoryProfileRepo();
    setProfileRepo(profileRepo);
    profileService = new ProfileService(profileRepo);
    tailorService = new TailorService(tailorRepo, profileService);

    // Seed master profile
    await profileService.getOrCreateProfile(userId, "candidate@fitme.dev", "Jordan Lee");

    await profileService.addExperience(userId, {
      company: "Tech Corp",
      role: "Backend Engineer",
      bullets: [
        { content: "Maintained microservices in Node and TypeScript" },
        { content: "Deployed serverless infrastructure on AWS", isHidden: false },
        { content: "Hidden old task", isHidden: true },
      ],
    });

    await profileService.addProject(userId, {
      name: "Payment Gateway",
      description: "Distributed payment processing system",
      technologies: ["TypeScript", "DynamoDB", "AWS"],
      bullets: [{ content: "Processed 10k transactions daily with 99.99% uptime" }],
      isHidden: false,
    });

    await profileService.addProject(userId, {
      name: "Outdated PHP Website",
      description: "Legacy project",
      technologies: ["PHP", "MySQL"],
      bullets: [{ content: "Maintained legacy portal" }],
      isHidden: true, // Should be omitted from tailoring
    });

    await profileService.addSkill(userId, { name: "TypeScript", category: "languages" });
    await profileService.addSkill(userId, { name: "React", category: "frameworks" });
    await profileService.addSkill(userId, { name: "AWS", category: "cloud" });
    await profileService.addSkill(userId, { name: "COBOL", category: "languages", isHidden: true });
  });

  it("parses job description and extracts requirements", async () => {
    const rawJd = `
Stripe Inc.
Staff Infrastructure Engineer
Requirements:
- Strong background in TypeScript and AWS cloud architecture
- Experience with high-throughput DynamoDB datastores
- CI/CD automation pipelines
`;

    const job = await tailorService.parseJobDescription(userId, rawJd, "https://stripe.com/jobs/123");
    expect(job.company).toBeDefined();
    expect(job.role).toBeDefined();
    expect(job.extractedSkills.length).toBeGreaterThan(0);
  });

  it("calculates accurate ATS Fit Score and keyword breakdown", async () => {
    const job = await tailorService.parseJobDescription(
      userId,
      "Figma\nSenior Software Engineer\nLooking for TypeScript, React, and AWS expertise."
    );

    const profile = await profileService.getOrCreateProfile(userId);
    const fitScore = tailorService.calculateFitScore(profile, job);

    expect(fitScore.score).toBeGreaterThan(50);
    expect(fitScore.matchedCount).toBeGreaterThanOrEqual(2);
    expect(fitScore.summaryEvaluation).toContain("Match");

    const matchedKw = fitScore.keywords.find((k) => k.keyword.toLowerCase() === "typescript");
    expect(matchedKw?.status).toBe("matched");
  });

  it("tailors resume while strictly respecting isHidden item toggles", async () => {
    const job = await tailorService.parseJobDescription(
      userId,
      "Datadog\nCloud Systems Engineer\nSkills: AWS, TypeScript, DynamoDB."
    );

    const tailored = await tailorService.tailorResume(userId, job.id, "1_page", "modern_standard");

    expect(tailored.versionNumber).toBe(1);
    expect(tailored.status).toBe("draft");
    expect(tailored.tailoredSummary).toContain("Datadog");

    // Hidden projects should NOT be present in tailoredProjects
    const projectNames = tailored.tailoredProjects.map((p) => p.name);
    expect(projectNames).toContain("Payment Gateway");
    expect(projectNames).not.toContain("Outdated PHP Website");

    // Hidden bullets should NOT be present in tailored experiences
    const bullets = tailored.tailoredExperiences[0].bullets.map((b) => b.content);
    expect(bullets.some((b) => b.includes("Hidden old task"))).toBe(false);

    // Hidden skills should NOT be present in selected skills
    const skillNames = tailored.selectedSkills.map((s) => s.name);
    expect(skillNames).not.toContain("COBOL");
  });

  it("creates incremented version numbers for subsequent tailoring runs", async () => {
    const job = await tailorService.parseJobDescription(userId, "Apple\nSoftware Engineer");

    const v1 = await tailorService.tailorResume(userId, job.id, "1_page");
    expect(v1.versionNumber).toBe(1);

    const v2 = await tailorService.tailorResume(userId, job.id, "2_pages");
    expect(v2.versionNumber).toBe(2);
  });

  it("boosts weak bullet into Google XYZ format", async () => {
    const weakBullet = "Helped team speed up web performance";
    const boosted = await tailorService.boostBulletWithMetrics(
      weakBullet,
      "cut page load times by 45% using code splitting"
    );

    expect(boosted.length).toBeGreaterThan(weakBullet.length);
    expect(boosted).toContain("45%");
  });

  it("updates resume lifecycle status", async () => {
    const job = await tailorService.parseJobDescription(userId, "Netflix\nSenior Frontend Engineer");
    const resume = await tailorService.tailorResume(userId, job.id);

    expect(resume.status).toBe("draft");

    const sentResume = await tailorService.updateResumeStatus(userId, resume.id, "sent");
    expect(sentResume.status).toBe("sent");

    const interviewResume = await tailorService.updateResumeStatus(userId, resume.id, "interview");
    expect(interviewResume.status).toBe("interview");
  });

  it("updates tailored resume content directly", async () => {
    const job = await tailorService.parseJobDescription(userId, "Stripe\nBackend Engineer");
    const resume = await tailorService.tailorResume(userId, job.id);

    const updated = await tailorService.updateTailoredResume(userId, resume.id, {
      tailoredSummary: "Customized executive summary tailored specifically for Stripe payments team.",
    });

    expect(updated.tailoredSummary).toBe("Customized executive summary tailored specifically for Stripe payments team.");
    expect(updated.markdownContent).toContain("Customized executive summary tailored specifically for Stripe payments team.");
  });
});
