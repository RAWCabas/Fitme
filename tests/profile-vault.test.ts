import { describe, it, expect, beforeEach } from "vitest";
import { ProfileService } from "@/features/profile/service";
import { MemoryProfileRepo } from "@/features/profile/repo";

describe("Profile Vault: Schemas & Service", () => {
  let repo: MemoryProfileRepo;
  let service: ProfileService;

  beforeEach(() => {
    repo = new MemoryProfileRepo();
    service = new ProfileService(repo);
  });

  it("initializes a clean profile for a new user", async () => {
    const profile = await service.getOrCreateProfile("user_123", "alex@fitme.dev", "Alex Doe");
    expect(profile.userId).toBe("user_123");
    expect(profile.contact.fullName).toBe("Alex Doe");
    expect(profile.contact.email).toBe("alex@fitme.dev");
    expect(profile.experiences).toHaveLength(0);
    expect(profile.projects).toHaveLength(0);
    expect(profile.skills).toHaveLength(0);
  });

  it("updates contact information", async () => {
    await service.getOrCreateProfile("user_123");
    const updated = await service.updateContact("user_123", {
      fullName: "Alex River",
      headline: "Senior Cloud Engineer",
      email: "alex.river@fitme.dev",
      phone: "+1 555-0192",
      location: "Seattle, WA",
      portfolioUrl: "https://alexriver.dev",
      linkedinUrl: "https://linkedin.com/in/alexriver",
      githubUrl: "https://github.com/alexriver",
    });

    expect(updated.contact.fullName).toBe("Alex River");
    expect(updated.contact.headline).toBe("Senior Cloud Engineer");
    expect(updated.contact.location).toBe("Seattle, WA");
  });

  it("adds, toggles visibility, and deletes work experiences", async () => {
    const exp = await service.addExperience("user_123", {
      company: "Stripe",
      role: "Backend Engineer",
      location: "Remote",
      startDate: "2024-01-01",
      endDate: null,
      bullets: [{ content: "Engineered high-throughput payments engine" }],
    });

    expect(exp.id).toBeDefined();
    expect(exp.company).toBe("Stripe");
    expect(exp.isHidden).toBe(false);
    expect(exp.bullets).toHaveLength(1);

    // Toggle visibility
    const hiddenStatus = await service.toggleExperienceVisibility("user_123", exp.id);
    expect(hiddenStatus).toBe(true);

    const profileAfterToggle = await service.getOrCreateProfile("user_123");
    expect(profileAfterToggle.experiences[0].isHidden).toBe(true);

    // Delete
    await service.deleteExperience("user_123", exp.id);
    const profileAfterDelete = await service.getOrCreateProfile("user_123");
    expect(profileAfterDelete.experiences).toHaveLength(0);
  });

  it("adds, toggles visibility, and deletes projects", async () => {
    const proj = await service.addProject("user_123", {
      name: "Fitme App",
      description: "AI Resume Tailor",
      technologies: ["Next.js", "DynamoDB", "AWS Bedrock"],
      liveUrl: "https://fitme.dev",
      repoUrl: "https://github.com/fitme/fitme",
    });

    expect(proj.name).toBe("Fitme App");
    expect(proj.technologies).toContain("Next.js");
    expect(proj.isHidden).toBe(false);

    // Toggle visibility
    const isHidden = await service.toggleProjectVisibility("user_123", proj.id);
    expect(isHidden).toBe(true);

    // Delete
    await service.deleteProject("user_123", proj.id);
    const profile = await service.getOrCreateProfile("user_123");
    expect(profile.projects).toHaveLength(0);
  });

  it("adds, toggles visibility, and deletes skills", async () => {
    const skill = await service.addSkill("user_123", {
      name: "TypeScript",
      category: "languages",
    });

    expect(skill.name).toBe("TypeScript");
    expect(skill.category).toBe("languages");
    expect(skill.isHidden).toBe(false);

    // Toggle visibility
    const isHidden = await service.toggleSkillVisibility("user_123", skill.id);
    expect(isHidden).toBe(true);

    // Delete
    await service.deleteSkill("user_123", skill.id);
    const profile = await service.getOrCreateProfile("user_123");
    expect(profile.skills).toHaveLength(0);
  });

  it("toggles granular bullet point visibility inside an experience", async () => {
    const exp = await service.addExperience("user_123", {
      company: "Google",
      role: "Software Engineer",
      bullets: [{ content: "Optimized search ranking algorithm" }],
    });

    const bulletId = exp.bullets[0].id;
    const isBulletHidden = await service.toggleBulletVisibility("user_123", "experience", exp.id, bulletId);
    expect(isBulletHidden).toBe(true);

    const profile = await service.getOrCreateProfile("user_123");
    expect(profile.experiences[0].bullets[0].isHidden).toBe(true);
  });

  it("strictly enforces multi-tenant isolation across user IDs", async () => {
    await service.addSkill("user_A", { name: "React", category: "frameworks" });
    await service.addSkill("user_B", { name: "Angular", category: "frameworks" });

    const profileA = await service.getOrCreateProfile("user_A");
    const profileB = await service.getOrCreateProfile("user_B");

    expect(profileA.skills).toHaveLength(1);
    expect(profileA.skills[0].name).toBe("React");

    expect(profileB.skills).toHaveLength(1);
    expect(profileB.skills[0].name).toBe("Angular");
  });
});
