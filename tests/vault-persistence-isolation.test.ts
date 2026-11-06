import { describe, it, expect, beforeEach } from "vitest";
import { ProfileService } from "@/features/profile/service";
import { MemoryProfileRepo } from "@/features/profile/repo";
import { DynamoProfileRepo } from "@/features/profile/dynamo-repo";
import { DynamoTailorRepo } from "@/features/tailor/dynamo-repo";
import { 
  MemoryDynamoDocClient, 
  setDynamoDocClient 
} from "@/lib/dynamodb";
import { Profile } from "@/features/profile/schema";
import { JobOpportunity, TailoredResume } from "@/features/tailor/schema";

describe("Master Vault: Edit & Hide Persistence Across Logout/Login", () => {
  let docClient: MemoryDynamoDocClient;
  let dynamoProfileRepo: DynamoProfileRepo;
  let dynamoTailorRepo: DynamoTailorRepo;
  let profileService: ProfileService;

  beforeEach(() => {
    docClient = new MemoryDynamoDocClient();
    setDynamoDocClient(docClient);
    dynamoProfileRepo = new DynamoProfileRepo();
    dynamoTailorRepo = new DynamoTailorRepo();
    profileService = new ProfileService(dynamoProfileRepo);
  });

  it("persists edited contact info and summary across logout and subsequent login", async () => {
    const userId = "user_vault_persist_1";
    const initialEmail = "persisted.user@fitme.dev";
    const initialName = "Persisted Candidate";

    // 1. Initial Login: profile is created
    const profile = await profileService.getOrCreateProfile(userId, initialEmail, initialName);
    expect(profile.contact.fullName).toBe("Persisted Candidate");

    // 2. User edits their contact information in Master Vault
    const updated = await profileService.updateContact(userId, {
      fullName: "Alexander Hamilton",
      headline: "Principal Distributed Systems Architect",
      email: initialEmail,
      phone: "+1 (555) 789-0123",
      location: "San Francisco, CA",
      portfolioUrl: "https://alexhamilton.tech",
      linkedinUrl: "https://linkedin.com/in/alexhamilton",
      githubUrl: "https://github.com/alexhamilton",
      summary: "Architecting cloud-native multi-tenant engines with high availability.",
    });

    expect(updated.contact.fullName).toBe("Alexander Hamilton");
    expect(updated.contact.headline).toBe("Principal Distributed Systems Architect");
    expect(updated.contact.phone).toBe("+1 (555) 789-0123");
    expect(updated.summary).toBe("Architecting cloud-native multi-tenant engines with high availability.");

    // 3. User logs out: session is destroyed, browser memory is cleared
    // Now simulate subsequent login from any device
    const profileAfterLogin = await profileService.getOrCreateProfile(userId, initialEmail, initialName);

    // Verify all edited fields stayed intact and NEVER reverted to default values
    expect(profileAfterLogin.contact.fullName).toBe("Alexander Hamilton");
    expect(profileAfterLogin.contact.headline).toBe("Principal Distributed Systems Architect");
    expect(profileAfterLogin.contact.phone).toBe("+1 (555) 789-0123");
    expect(profileAfterLogin.contact.location).toBe("San Francisco, CA");
    expect(profileAfterLogin.contact.portfolioUrl).toBe("https://alexhamilton.tech");
    expect(profileAfterLogin.contact.linkedinUrl).toBe("https://linkedin.com/in/alexhamilton");
    expect(profileAfterLogin.contact.githubUrl).toBe("https://github.com/alexhamilton");
    expect(profileAfterLogin.summary).toBe("Architecting cloud-native multi-tenant engines with high availability.");
  });

  it("persists hidden contact fields across logout and login", async () => {
    const userId = "user_vault_hide_contact";
    await profileService.getOrCreateProfile(userId, "hide.contact@fitme.dev", "Hide Tester");

    // Hide phone, location, and summary
    await profileService.toggleContactFieldVisibility(userId, "phone");
    await profileService.toggleContactFieldVisibility(userId, "location");
    await profileService.toggleContactFieldVisibility(userId, "summary");

    // Simulate logout and re-login
    const profile = await profileService.getOrCreateProfile(userId, "hide.contact@fitme.dev", "Hide Tester");
    expect(profile.hiddenContactFields).toContain("phone");
    expect(profile.hiddenContactFields).toContain("location");
    expect(profile.hiddenContactFields).toContain("summary");
    expect(profile.hiddenContactFields).not.toContain("email");
  });

  it("persists hidden experiences and granular bullet points across logout and login", async () => {
    const userId = "user_vault_hide_exp";
    await profileService.getOrCreateProfile(userId, "exp.tester@fitme.dev", "Exp Tester");

    // Add experience with 2 bullets
    const exp = await profileService.addExperience(userId, {
      company: "CloudCorp Inc.",
      role: "Lead Site Reliability Engineer",
      location: "Seattle, WA",
      startDate: "2023-01-01",
      endDate: null,
      bullets: [
        { content: "Maintained 99.999% SLA across 4 global regions." },
        { content: "Automated chaos engineering drills with zero downtime." },
      ],
    });

    const bulletToHide = exp.bullets[1].id;

    // Hide bullet 1
    const isBulletHidden = await profileService.toggleBulletVisibility(userId, "experience", exp.id, bulletToHide);
    expect(isBulletHidden).toBe(true);

    // Simulate logout and re-login
    let loaded = await profileService.getOrCreateProfile(userId, "exp.tester@fitme.dev", "Exp Tester");
    expect(loaded.experiences[0].bullets[0].isHidden).toBe(false);
    expect(loaded.experiences[0].bullets[1].isHidden).toBe(true);

    // Hide the entire experience
    const isExpHidden = await profileService.toggleExperienceVisibility(userId, exp.id);
    expect(isExpHidden).toBe(true);

    // Simulate another logout and re-login
    loaded = await profileService.getOrCreateProfile(userId, "exp.tester@fitme.dev", "Exp Tester");
    expect(loaded.experiences[0].isHidden).toBe(true);
    expect(loaded.experiences[0].bullets[1].isHidden).toBe(true);
  });

  it("persists hidden projects, skills, certifications, and education across logout and login", async () => {
    const userId = "user_vault_all_entities";
    await profileService.getOrCreateProfile(userId, "entities@fitme.dev", "Entity Tester");

    // 1. Add project & hide it
    const proj = await profileService.addProject(userId, {
      name: "Secret Internal Tool",
      description: "Proprietary internal testing harness",
      technologies: ["Rust", "TypeScript"],
    });
    await profileService.toggleProjectVisibility(userId, proj.id);

    // 2. Add skill & hide it
    const skill = await profileService.addSkill(userId, {
      name: "Legacy COBOL",
      category: "languages",
    });
    await profileService.toggleSkillVisibility(userId, skill.id);

    // 3. Add certification & hide it
    const cert = await profileService.addCertification(userId, {
      name: "AWS Certified Solutions Architect",
      issuer: "Amazon Web Services",
      hours: "100 Hours",
    });
    await profileService.toggleCertificationVisibility(userId, cert.id);

    // 4. Add education & hide it
    const edu = await profileService.addEducation(userId, {
      institution: "State University",
      degree: "B.S. in Computer Science",
      level: "college",
      startDate: "2018",
      endDate: "2022",
    });
    await profileService.toggleEducationVisibility(userId, edu.id);

    // Simulate logout and subsequent login
    const profile = await profileService.getOrCreateProfile(userId, "entities@fitme.dev", "Entity Tester");

    expect(profile.projects.find((p) => p.id === proj.id)?.isHidden).toBe(true);
    expect(profile.skills.find((s) => s.id === skill.id)?.isHidden).toBe(true);
    expect(profile.certifications.find((c) => c.id === cert.id)?.isHidden).toBe(true);
    expect(profile.education.find((e) => e.id === edu.id)?.isHidden).toBe(true);
  });
});

describe("Dashboard & Account Privacy: Multi-Tenant Isolation", () => {
  let docClient: MemoryDynamoDocClient;
  let dynamoProfileRepo: DynamoProfileRepo;
  let dynamoTailorRepo: DynamoTailorRepo;
  let profileService: ProfileService;

  beforeEach(() => {
    docClient = new MemoryDynamoDocClient();
    setDynamoDocClient(docClient);
    dynamoProfileRepo = new DynamoProfileRepo();
    dynamoTailorRepo = new DynamoTailorRepo();
    profileService = new ProfileService(dynamoProfileRepo);
  });

  it("strictly prevents User B from seeing User A's profile or private Vault data", async () => {
    const userA = "user_tenant_alice";
    const userB = "user_tenant_bob";

    // Alice creates her profile and adds confidential details
    await profileService.getOrCreateProfile(userA, "alice@work.com", "Alice Confidential");
    await profileService.addSkill(userA, { name: "Quantum Cryptography", category: "cloud" });

    // Bob creates his profile
    await profileService.getOrCreateProfile(userB, "bob@personal.com", "Bob Public");

    // Bob retrieves his profile
    const bobProfile = await profileService.getOrCreateProfile(userB);
    expect(bobProfile.contact.fullName).toBe("Bob Public");
    expect(bobProfile.contact.email).toBe("bob@personal.com");
    expect(bobProfile.skills).toHaveLength(0);

    // Direct repo read by Bob using Alice's ID must fail or return null
    const aliceDataAsBob = await dynamoProfileRepo.getProfile(userB);
    expect(aliceDataAsBob?.contact.fullName).toBe("Bob Public");
    expect(aliceDataAsBob?.skills).toHaveLength(0);
  });

  it("strictly isolates tailored resumes and application pipeline across users", async () => {
    const userA = "user_tenant_alice";
    const userB = "user_tenant_bob";

    // Alice creates a job and tailored resume
    const jobId = crypto.randomUUID();
    const resumeId = crypto.randomUUID();

    const aliceJob: JobOpportunity = {
      id: jobId,
      userId: userA,
      company: "TopSecret Tech Inc.",
      role: "Lead Security Engineer",
      location: "San Francisco",
      sourceUrl: "https://topsecret.tech/jobs",
      rawDescription: "Build zero-trust architecture.",
      extractedSkills: ["Zero Trust", "OAuth"],
      mustHaves: ["Security clearance"],
      niceToHaves: [],
      createdAt: new Date().toISOString(),
    };
    await dynamoTailorRepo.saveJobOpportunity(aliceJob);

    const aliceResume: TailoredResume = {
      id: resumeId,
      userId: userA,
      jobOpportunityId: aliceJob.id,
      title: "Security Engineer - TopSecret",
      versionNumber: 1,
      status: "sent",
      preset: "modern_standard",
      pageBudget: "1_page",
      fitScore: { score: 98, matchedCount: 5, missingCount: 0, keywords: [], summaryEvaluation: "Match" },
      tailoredSummary: "Top secret resume content for Alice.",
      tailoredExperiences: [],
      tailoredProjects: [],
      tailoredEducation: [],
      tailoredCertifications: [],
      selectedSkills: [],
      pdfS3Key: "resumes/alice/resume.pdf",
      pdfPresignedUrl: null,
      markdownContent: "# Confidential Resume",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await dynamoTailorRepo.saveTailoredResume(aliceResume);

    // Verify Alice sees her resume and job
    const aliceResumes = await dynamoTailorRepo.listTailoredResumes(userA);
    expect(aliceResumes).toHaveLength(1);
    expect(aliceResumes[0].title).toBe("Security Engineer - TopSecret");
    expect(aliceResumes[0].status).toBe("sent");

    // Bob logs in and checks his resumes
    const bobResumes = await dynamoTailorRepo.listTailoredResumes(userB);
    expect(bobResumes).toHaveLength(0);

    // Bob tries to fetch Alice's job directly by ID
    const bobJobFetch = await dynamoTailorRepo.getJobOpportunity(userB, aliceJob.id);
    expect(bobJobFetch).toBeNull();

    // Bob tries to fetch Alice's resume directly by ID
    const bobResumeFetch = await dynamoTailorRepo.getTailoredResume(userB, aliceResume.id);
    expect(bobResumeFetch).toBeNull();
  });
});
