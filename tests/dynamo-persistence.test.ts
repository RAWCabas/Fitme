import { describe, it, expect, beforeEach } from "vitest";
import { 
  userPk, 
  profileSk, 
  jobSk, 
  resumeSk, 
  gsi1Pk, 
  MemoryDynamoDocClient, 
  setDynamoDocClient 
} from "@/lib/dynamodb";
import { DynamoProfileRepo } from "@/features/profile/dynamo-repo";
import { DynamoTailorRepo } from "@/features/tailor/dynamo-repo";
import { Profile } from "@/features/profile/schema";
import { JobOpportunity, TailoredResume } from "@/features/tailor/schema";
import { getUploadPresignedUrl, getDownloadPresignedUrl, RESUME_BUCKET_NAME } from "@/lib/s3";

const sampleProfileA: Profile = {
  userId: "user_tenant_A",
  contact: {
    fullName: "Alice Tenant",
    headline: "Cloud Architect",
    email: "alice@example.com",
    phone: "+1 555-0101",
    location: "Austin, TX",
    portfolioUrl: "https://alice.io",
    linkedinUrl: "https://linkedin.com/in/alice",
    githubUrl: "https://github.com/alice",
  },
  experiences: [],
  projects: [],
  skills: [
    { id: "1fa85f64-5717-4562-b3fc-2c963f66afa1", name: "DynamoDB", category: "cloud", isHidden: false },
  ],
  certifications: [],
  summary: "Alice's verified experience summary.",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const sampleJobA: JobOpportunity = {
  id: "2fa85f64-5717-4562-b3fc-2c963f66afa2",
  userId: "user_tenant_A",
  company: "CloudTech",
  role: "Lead DynamoDB Specialist",
  location: "Austin, TX",
  sourceUrl: "https://cloudtech.io/jobs",
  rawDescription: "Seeking DynamoDB architect to build multi-tenant databases.",
  extractedSkills: ["DynamoDB", "AWS"],
  mustHaves: ["5+ years DynamoDB"],
  niceToHaves: [],
  createdAt: "2026-01-01T00:00:00.000Z",
};

const sampleResumeA: TailoredResume = {
  id: "3fa85f64-5717-4562-b3fc-2c963f66afa3",
  userId: "user_tenant_A",
  jobOpportunityId: sampleJobA.id,
  versionNumber: 1,
  status: "draft",
  preset: "modern_standard",
  pageBudget: "1_page",
  fitScore: {
    score: 95,
    matchedCount: 2,
    missingCount: 0,
    keywords: [],
    summaryEvaluation: "Exceptional match",
  },
  tailoredSummary: "Proven DynamoDB specialist with multi-tenant expertise.",
  tailoredExperiences: [],
  tailoredProjects: [],
  tailoredCertifications: [],
  selectedSkills: sampleProfileA.skills,
  pdfS3Key: "resumes/user_tenant_A/sample-resume.pdf",
  pdfPresignedUrl: null,
  markdownContent: "# Alice Tenant",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("DynamoDB Persistence: Keys & Invariants", () => {
  it("formats single-table keys conforming strictly to masterplan", () => {
    expect(userPk("sub_12345")).toBe("USER#sub_12345");
    expect(profileSk()).toBe("PROFILE");
    expect(jobSk("job_abc")).toBe("JOB#job_abc");
    expect(resumeSk("job_abc", "res_xyz")).toBe("RESUME#job_abc#res_xyz");
    expect(gsi1Pk("sub_12345", "interview")).toBe("USER#sub_12345#STATUS#interview");
  });
});

describe("DynamoDB Persistence: Profile Repository", () => {
  let docClient: MemoryDynamoDocClient;
  let profileRepo: DynamoProfileRepo;

  beforeEach(() => {
    docClient = new MemoryDynamoDocClient();
    setDynamoDocClient(docClient);
    profileRepo = new DynamoProfileRepo();
  });

  it("persists and loads profile with strict USER#<userId> partition key", async () => {
    await profileRepo.saveProfile(sampleProfileA);

    const loaded = await profileRepo.getProfile("user_tenant_A");
    expect(loaded).toBeDefined();
    expect(loaded?.contact.fullName).toBe("Alice Tenant");
    expect(loaded?.skills[0].name).toBe("DynamoDB");

    // Verify raw Dynamo item contains correct PK & SK
    const raw = await docClient.get({
      TableName: "fitme-main",
      Key: { PK: "USER#user_tenant_A", SK: "PROFILE" },
    });
    expect(raw.Item?.PK).toBe("USER#user_tenant_A");
    expect(raw.Item?.SK).toBe("PROFILE");
    expect(raw.Item?.entityType).toBe("PROFILE");
  });

  it("enforces tenant isolation across multiple users", async () => {
    await profileRepo.saveProfile(sampleProfileA);

    // User B tries to read User A's data
    const userBLoad = await profileRepo.getProfile("user_tenant_B");
    expect(userBLoad).toBeNull();
  });
});

describe("DynamoDB Persistence: Tailor Repository", () => {
  let docClient: MemoryDynamoDocClient;
  let tailorRepo: DynamoTailorRepo;

  beforeEach(() => {
    docClient = new MemoryDynamoDocClient();
    setDynamoDocClient(docClient);
    tailorRepo = new DynamoTailorRepo();
  });

  it("saves and loads job opportunities", async () => {
    await tailorRepo.saveJobOpportunity(sampleJobA);

    const loaded = await tailorRepo.getJobOpportunity("user_tenant_A", sampleJobA.id);
    expect(loaded).toBeDefined();
    expect(loaded?.company).toBe("CloudTech");
    expect(loaded?.role).toBe("Lead DynamoDB Specialist");
  });

  it("saves and retrieves tailored resume with GSI1 status indexing", async () => {
    await tailorRepo.saveTailoredResume(sampleResumeA);

    const loaded = await tailorRepo.getTailoredResume("user_tenant_A", sampleResumeA.id);
    expect(loaded).toBeDefined();
    expect(loaded?.fitScore.score).toBe(95);

    // Verify raw Dynamo item has GSI1 attributes
    const raw = await docClient.get({
      TableName: "fitme-main",
      Key: {
        PK: "USER#user_tenant_A",
        SK: `RESUME#${sampleJobA.id}#${sampleResumeA.id}`,
      },
    });
    expect(raw.Item?.GSI1PK).toBe("USER#user_tenant_A#STATUS#draft");
    expect(raw.Item?.GSI1SK).toBe("2026-01-01T00:00:00.000Z");
  });

  it("lists resumes for user with optional jobId filter", async () => {
    await tailorRepo.saveTailoredResume(sampleResumeA);

    const all = await tailorRepo.listTailoredResumes("user_tenant_A");
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(sampleResumeA.id);

    const forJob = await tailorRepo.listTailoredResumes("user_tenant_A", sampleJobA.id);
    expect(forJob).toHaveLength(1);

    const forOtherJob = await tailorRepo.listTailoredResumes("user_tenant_A", "nonexistent_job");
    expect(forOtherJob).toHaveLength(0);
  });

  it("updates resume status and refreshes GSI1 key", async () => {
    await tailorRepo.saveTailoredResume(sampleResumeA);

    const updated = await tailorRepo.updateResumeStatus("user_tenant_A", sampleResumeA.id, "interview");
    expect(updated.status).toBe("interview");

    const raw = await docClient.get({
      TableName: "fitme-main",
      Key: {
        PK: "USER#user_tenant_A",
        SK: `RESUME#${sampleJobA.id}#${sampleResumeA.id}`,
      },
    });
    expect(raw.Item?.GSI1PK).toBe("USER#user_tenant_A#STATUS#interview");
  });
});

describe("S3 Presigned Storage", () => {
  it("generates presigned upload URL with bucket and key", async () => {
    const url = await getUploadPresignedUrl("resumes/user_tenant_A/test.pdf");

    expect(url).toContain(RESUME_BUCKET_NAME);
    expect(url).toContain("resumes%2Fuser_tenant_A%2Ftest.pdf");
  });

  it("generates presigned download URL with bucket and key", async () => {
    const url = await getDownloadPresignedUrl("resumes/user_tenant_A/test.pdf");

    expect(url).toContain(RESUME_BUCKET_NAME);
    expect(url).toContain("resumes%2Fuser_tenant_A%2Ftest.pdf");
  });
});

