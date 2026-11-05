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

  it("adds, toggles visibility, and deletes certifications", async () => {
    const cert = await service.addCertification("user_123", {
      name: "TESDA Computer Systems Servicing NC II",
      issuer: "TESDA",
      hours: "280 Hours",
      credentialId: "TESDA-CSS-NCII-2024",
      issueDate: "2024-05-15",
    });

    expect(cert.name).toBe("TESDA Computer Systems Servicing NC II");
    expect(cert.issuer).toBe("TESDA");
    expect(cert.hours).toBe("280 Hours");
    expect(cert.issueDate).toBe("2024-05-15");
    expect(cert.isHidden).toBe(false);

    // Toggle visibility
    const isHidden = await service.toggleCertificationVisibility("user_123", cert.id);
    expect(isHidden).toBe(true);

    const profileAfterToggle = await service.getOrCreateProfile("user_123");
    expect(profileAfterToggle.certifications?.[0].isHidden).toBe(true);

    // Delete
    await service.deleteCertification("user_123", cert.id);
    const profileAfterDelete = await service.getOrCreateProfile("user_123");
    expect(profileAfterDelete.certifications).toHaveLength(0);
  });

  it("adds, toggles visibility, updates, and deletes education items for college, high school, and elementary", async () => {
    // Add college
    const college = await service.addEducation("user_123", {
      institution: "Cebu Technological University- Main Campus",
      degree: "Bachelor of Science in Computer Engineering",
      fieldOfStudy: "Computer Engineering",
      startDate: "2020",
      endDate: "2024",
      level: "college",
      honors: "Cum Laude",
    });

    expect(college.institution).toBe("Cebu Technological University- Main Campus");
    expect(college.level).toBe("college");
    expect(college.isHidden).toBe(false);

    // Add high school
    const highSchool = await service.addEducation("user_123", {
      institution: "City High School",
      degree: "High School Diploma",
      level: "high_school",
      startDate: "2016",
      endDate: "2020",
    });
    expect(highSchool.level).toBe("high_school");

    // Add elementary
    const elementary = await service.addEducation("user_123", {
      institution: "Central Elementary School",
      level: "elementary",
      startDate: "2010",
      endDate: "2016",
    });
    expect(elementary.level).toBe("elementary");

    // Toggle visibility on elementary
    const isElemHidden = await service.toggleEducationVisibility("user_123", elementary.id);
    expect(isElemHidden).toBe(true);

    // Update college
    const updatedCollege = await service.updateEducation("user_123", college.id, {
      honors: "Magna Cum Laude",
    });
    expect(updatedCollege.honors).toBe("Magna Cum Laude");

    // Delete high school
    await service.deleteEducation("user_123", highSchool.id);
    const profile = await service.getOrCreateProfile("user_123");
    expect(profile.education.find((e) => e.id === highSchool.id)).toBeUndefined();
    expect(profile.education.find((e) => e.id === elementary.id)?.isHidden).toBe(true);
    expect(profile.education.find((e) => e.id === college.id)?.honors).toBe("Magna Cum Laude");
  });

  it("updates existing experiences, projects, certifications, and skills", async () => {
    // 1. Experience
    const exp = await service.addExperience("user_123", {
      company: "Acme Corp",
      role: "Junior Dev",
      location: "Remote",
      bullets: [{ content: "Fixed bugs" }],
    });
    const updatedExp = await service.updateExperience("user_123", exp.id, {
      role: "Senior Dev",
      company: "Acme Global",
      bullets: [{ content: "Architected distributed streaming engine" }],
    });
    expect(updatedExp.role).toBe("Senior Dev");
    expect(updatedExp.company).toBe("Acme Global");
    expect(updatedExp.bullets[0].content).toBe("Architected distributed streaming engine");

    // 2. Project
    const proj = await service.addProject("user_123", {
      name: "Old App",
      description: "Simple app",
      technologies: ["JavaScript"],
    });
    const updatedProj = await service.updateProject("user_123", proj.id, {
      name: "NextGen Platform",
      technologies: ["TypeScript", "Next.js"],
    });
    expect(updatedProj.name).toBe("NextGen Platform");
    expect(updatedProj.technologies).toContain("TypeScript");

    // 3. Certification
    const cert = await service.addCertification("user_123", {
      name: "Basic IT",
      issuer: "Institute",
      hours: "40 Hours",
    });
    const updatedCert = await service.updateCertification("user_123", cert.id, {
      name: "Advanced Computer Systems Servicing",
      hours: "280 Hours",
    });
    expect(updatedCert.name).toBe("Advanced Computer Systems Servicing");
    expect(updatedCert.hours).toBe("280 Hours");

    // 4. Skill
    const skill = await service.addSkill("user_123", {
      name: "Java",
      category: "languages",
    });
    const updatedSkill = await service.updateSkill("user_123", skill.id, {
      name: "Java SE 21",
    });
    expect(updatedSkill.name).toBe("Java SE 21");
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

  it("toggles visibility for contact and personal summary fields", async () => {
    await service.getOrCreateProfile("user_contact_test");
    
    // Toggle phone hidden
    const isPhoneHidden = await service.toggleContactFieldVisibility("user_contact_test", "phone");
    expect(isPhoneHidden).toBe(true);

    let profile = await service.getOrCreateProfile("user_contact_test");
    expect(profile.hiddenContactFields).toContain("phone");

    // Toggle summary hidden
    const isSummaryHidden = await service.toggleContactFieldVisibility("user_contact_test", "summary");
    expect(isSummaryHidden).toBe(true);

    profile = await service.getOrCreateProfile("user_contact_test");
    expect(profile.hiddenContactFields).toContain("summary");

    // Toggle phone unhidden
    const isPhoneHiddenAgain = await service.toggleContactFieldVisibility("user_contact_test", "phone");
    expect(isPhoneHiddenAgain).toBe(false);

    profile = await service.getOrCreateProfile("user_contact_test");
    expect(profile.hiddenContactFields).not.toContain("phone");
    expect(profile.hiddenContactFields).toContain("summary");
  });

  it("supports fallback matching by title/company when toggling item visibility", async () => {
    await service.getOrCreateProfile("user_fallback_test");
    const exp = await service.addExperience("user_fallback_test", {
      company: "Tesla",
      role: "Firmware Engineer",
      bullets: [{ content: "Embedded C++" }],
    });

    // Toggle using company name fallback
    const isHidden = await service.toggleExperienceVisibility("user_fallback_test", "Tesla");
    expect(isHidden).toBe(true);

    const profile = await service.getOrCreateProfile("user_fallback_test");
    expect(profile.experiences[0].isHidden).toBe(true);
  });
});

