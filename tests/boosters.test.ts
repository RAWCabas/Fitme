import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { BoosterService } from "@/features/boosters/service";
import { Profile } from "@/features/profile/schema";
import { TailoredResume, JobOpportunity } from "@/features/tailor/schema";
import { getTailorRepo } from "@/features/tailor/repo";
import { getProfileRepo } from "@/features/profile/repo";
import { POST as coverLetterHandler } from "@/app/api/boosters/cover-letter/route";
import { POST as outreachHandler } from "@/app/api/boosters/outreach/route";
import { POST as cheatSheetHandler } from "@/app/api/boosters/cheat-sheet/route";
import { POST as followUpHandler } from "@/app/api/boosters/follow-up/route";

const mockCookieStore = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      const val = mockCookieStore.get(name);
      return val ? { name, value: val } : undefined;
    },
    set: (name: string, value: string) => {
      mockCookieStore.set(name, value);
    },
    delete: (name: string) => {
      mockCookieStore.delete(name);
    },
  }),
}));

const mockProfile: Profile = {
  userId: "user_booster_test",
  contact: {
    fullName: "Jordan Lee",
    headline: "Staff Cloud Architect",
    email: "jordan@example.com",
    phone: "+1 (555) 012-3456",
    location: "New York, NY",
    portfolioUrl: "https://jordanlee.dev",
    linkedinUrl: "https://linkedin.com/in/jordanlee",
    githubUrl: "https://github.com/jordanlee",
  },
  experiences: [
    {
      id: "a1b2c3d4-e5f6-47a8-9b01-234567890123",
      company: "DataCorp",
      role: "Lead Platform Engineer",
      location: "New York, NY",
      startDate: "2021-06-01",
      endDate: null,
      isHidden: false,
      bullets: [
        {
          id: "f1e2d3c4-b5a6-49f8-8e01-234567890123",
          content: "Built Kubernetes data streaming cluster reducing operational costs by 40%.",
          isHidden: false,
          hasMetrics: true,
        },
      ],
    },
  ],
  projects: [],
  skills: [
    { id: "c3d4e5f6-a7b8-49ca-8d12-345678901234", name: "Kubernetes", category: "cloud", isHidden: false },
    { id: "d4e5f6a7-b8c9-4adb-9e23-456789012345", name: "Go", category: "languages", isHidden: false },
  ],
  certifications: [],
  summary: "Cloud architect with 7+ years scaling distributed systems.",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const mockJob: JobOpportunity = {
  id: "1fa85f64-5717-4562-b3fc-2c963f66afa1",
  userId: "user_booster_test",
  company: "Stripe",
  role: "Staff Infrastructure Engineer",
  location: "Remote",
  sourceUrl: "https://stripe.com/jobs",
  rawDescription: "Seeking a staff engineer to build high-scale payment reliability systems.",
  extractedSkills: ["Kubernetes", "Go", "AWS", "Kafka"],
  mustHaves: ["Deep experience with container orchestration and high-throughput systems"],
  niceToHaves: ["Experience with Kafka streaming pipelines"],
  createdAt: "2026-01-01T00:00:00.000Z",
};

const mockResume: TailoredResume = {
  id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  userId: "user_booster_test",
  jobOpportunityId: mockJob.id,
  title: "Staff Cloud Infrastructure Engineer",
  versionNumber: 1,
  status: "draft",
  preset: "modern_standard",
  pageBudget: "1_page",
  fitScore: {
    score: 85,
    matchedCount: 2,
    missingCount: 1,
    keywords: [
      { keyword: "Kubernetes", status: "matched", occurrencesInJD: 2, notes: "" },
      { keyword: "Go", status: "matched", occurrencesInJD: 2, notes: "" },
      { keyword: "Kafka", status: "missing", occurrencesInJD: 1, notes: "Not found in Vault" },
    ],
    summaryEvaluation: "Strong infrastructure background matching 85% of requirements.",
  },
  tailoredSummary: "Proven platform leader specialized in Kubernetes and high-throughput systems.",
  tailoredExperiences: mockProfile.experiences,
  tailoredProjects: [],
  tailoredCertifications: [],
  selectedSkills: mockProfile.skills,
  pdfS3Key: null,
  pdfPresignedUrl: null,
  markdownContent: "",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("On-Demand Boosters: Service", () => {
  const boosterService = new BoosterService();

  beforeEach(async () => {
    const profileRepo = getProfileRepo();
    await profileRepo.saveProfile(mockProfile);

    const tailorRepo = getTailorRepo();
    await tailorRepo.saveJobOpportunity(mockJob);
    await tailorRepo.saveTailoredResume(mockResume);
  });

  it("generates a tailored cover letter referencing target role and verified experiences", async () => {
    const letter = await boosterService.generateCoverLetter(mockProfile.userId, mockResume.id);

    expect(letter).toContain("Stripe");
    expect(letter).toContain("Staff Infrastructure Engineer");
    expect(letter).toContain("Jordan Lee");
  });

  it("generates a concise recruiter outreach note", async () => {
    const note = await boosterService.generateRecruiterOutreach(mockProfile.userId, mockResume.id);

    expect(note).toContain("Stripe");
    expect(note).toContain("Staff Infrastructure Engineer");
    // Ensure concise length (under 120 words)
    const wordCount = note.split(/\s+/).length;
    expect(wordCount).toBeLessThan(120);
  });

  it("generates an interview cheat sheet addressing missing ATS keywords", async () => {
    const cheatSheet = await boosterService.generateInterviewCheatSheet(mockProfile.userId, mockResume.id);

    expect(cheatSheet.predictedQuestions.length).toBeGreaterThan(0);
    expect(cheatSheet.questionsToAskInterviewer.length).toBeGreaterThan(0);
    // Gap strategy should address missing "Kafka"
    const gapText = cheatSheet.talkingPointsForGaps.join(" ");
    expect(gapText).toContain("Kafka");
  });

  it("generates a polite follow-up email", async () => {
    const email = await boosterService.generateFollowUpEmail(mockProfile.userId, mockResume.id);

    expect(email).toContain("Subject: Following up on application for Staff Infrastructure Engineer — Jordan Lee");
    expect(email).toContain("Stripe");
    expect(email).toContain("jordan@example.com");
  });
});

describe("On-Demand Boosters: API Endpoints", () => {
  beforeEach(async () => {
    mockCookieStore.clear();

    const profileRepo = getProfileRepo();
    await profileRepo.saveProfile(mockProfile);

    const tailorRepo = getTailorRepo();
    await tailorRepo.saveJobOpportunity(mockJob);
    await tailorRepo.saveTailoredResume(mockResume);
  });

  it("returns 401 for unauthenticated cover-letter request", async () => {
    const req = new NextRequest("http://localhost:3000/api/boosters/cover-letter", {
      method: "POST",
      body: JSON.stringify({ resumeId: mockResume.id }),
    });
    const res = await coverLetterHandler(req);
    expect(res.status).toBe(401);
  });

  it("generates cover letter when authenticated", async () => {
    const authSession = { userId: mockProfile.userId, email: mockProfile.contact.email, name: "Jordan" };
    mockCookieStore.set("fitme_session", Buffer.from(JSON.stringify(authSession)).toString("base64url"));

    const req = new NextRequest("http://localhost:3000/api/boosters/cover-letter", {
      method: "POST",
      body: JSON.stringify({ resumeId: mockResume.id }),
    });
    const res = await coverLetterHandler(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.coverLetter).toContain("Stripe");
  });

  it("generates recruiter outreach when authenticated", async () => {
    const authSession = { userId: mockProfile.userId, email: mockProfile.contact.email, name: "Jordan" };
    mockCookieStore.set("fitme_session", Buffer.from(JSON.stringify(authSession)).toString("base64url"));

    const req = new NextRequest("http://localhost:3000/api/boosters/outreach", {
      method: "POST",
      body: JSON.stringify({ resumeId: mockResume.id }),
    });
    const res = await outreachHandler(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.recruiterOutreach).toContain("Stripe");
  });

  it("generates interview cheat sheet when authenticated", async () => {
    const authSession = { userId: mockProfile.userId, email: mockProfile.contact.email, name: "Jordan" };
    mockCookieStore.set("fitme_session", Buffer.from(JSON.stringify(authSession)).toString("base64url"));

    const req = new NextRequest("http://localhost:3000/api/boosters/cheat-sheet", {
      method: "POST",
      body: JSON.stringify({ resumeId: mockResume.id }),
    });
    const res = await cheatSheetHandler(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.cheatSheet.predictedQuestions.length).toBeGreaterThan(0);
  });

  it("generates follow-up email when authenticated", async () => {
    const authSession = { userId: mockProfile.userId, email: mockProfile.contact.email, name: "Jordan" };
    mockCookieStore.set("fitme_session", Buffer.from(JSON.stringify(authSession)).toString("base64url"));

    const req = new NextRequest("http://localhost:3000/api/boosters/follow-up", {
      method: "POST",
      body: JSON.stringify({ resumeId: mockResume.id }),
    });
    const res = await followUpHandler(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.followUpEmail).toContain("Subject:");
  });
});

