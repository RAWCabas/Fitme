import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { ExportService } from "@/features/export/service";
import { Profile } from "@/features/profile/schema";
import { TailoredResume } from "@/features/tailor/schema";
import { getTailorRepo } from "@/features/tailor/repo";
import { getProfileRepo } from "@/features/profile/repo";
import { GET as exportMarkdownHandler } from "@/app/api/export/[id]/markdown/route";
import { GET as exportHtmlHandler } from "@/app/api/export/[id]/html/route";

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
  userId: "user_export_test",
  contact: {
    fullName: "Alex Cloud",
    headline: "Staff Solutions Architect",
    email: "alex.cloud@example.com",
    phone: "+1 (555) 019-2831",
    location: "Austin, TX",
    portfolioUrl: "https://alexcloud.io",
    linkedinUrl: "https://linkedin.com/in/alexcloud",
    githubUrl: "https://github.com/alexcloud",
  },
  experiences: [],
  projects: [],
  skills: [],
  summary: "Experienced cloud architect.",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const mockResume: TailoredResume = {
  id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  userId: "user_export_test",
  jobOpportunityId: "1fa85f64-5717-4562-b3fc-2c963f66afa1",
  versionNumber: 1,
  status: "draft",
  preset: "modern_standard",
  pageBudget: "1_page",
  fitScore: {
    score: 92,
    matchedCount: 5,
    missingCount: 1,
    keywords: [
      { keyword: "TypeScript", status: "matched", occurrencesInJD: 2, notes: "" },
      { keyword: "AWS", status: "matched", occurrencesInJD: 3, notes: "" },
    ],
    summaryEvaluation: "Strong match for Senior Cloud role.",
  },
  tailoredSummary: "Architected high-throughput cloud services with 99.99% uptime.",
  tailoredExperiences: [
    {
      id: "4fa85f64-5717-4562-b3fc-2c963f66afa4",
      company: "Stripe",
      role: "Staff Infrastructure Engineer",
      location: "San Francisco, CA",
      startDate: "2022-03-01",
      endDate: null,
      isHidden: false,
      bullets: [
        {
          id: "5fa85f64-5717-4562-b3fc-2c963f66afa5",
          content: "Engineered real-time settlement pipeline handling $10M+ daily volume.",
          isHidden: false,
          hasMetrics: true,
        },
      ],
    },
  ],
  tailoredProjects: [
    {
      id: "6fa85f64-5717-4562-b3fc-2c963f66afa6",
      name: "Serverless Mesh",
      description: "Distributed message bus running on AWS EventBridge.",
      technologies: ["TypeScript", "AWS CDK", "Lambda"],
      liveUrl: "https://mesh.alexcloud.io",
      repoUrl: "https://github.com/alexcloud/mesh",
      bullets: [
        {
          id: "7fa85f64-5717-4562-b3fc-2c963f66afa7",
          content: "Achieved sub-15ms processing latency across 20 global regions.",
          isHidden: false,
          hasMetrics: true,
        },
      ],
      isHidden: false,
    },
  ],
  selectedSkills: [
    { id: "8fa85f64-5717-4562-b3fc-2c963f66afa8", name: "AWS CDK", category: "cloud", isHidden: false },
    { id: "9fa85f64-5717-4562-b3fc-2c963f66afa9", name: "TypeScript", category: "languages", isHidden: false },
  ],
  pdfS3Key: null,
  pdfPresignedUrl: null,
  markdownContent: "",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("ATS Export Engine: Service", () => {
  const exportService = new ExportService();

  it("generates structured ATS-clean Markdown", () => {
    const md = exportService.generateMarkdown(mockResume, mockProfile);

    expect(md).toContain("# Alex Cloud");
    expect(md).toContain("*Staff Solutions Architect*");
    expect(md).toContain("alex.cloud@example.com | +1 (555) 019-2831 | Austin, TX");
    expect(md).toContain("https://linkedin.com/in/alexcloud | https://github.com/alexcloud | https://alexcloud.io");
    expect(md).toContain("## Professional Summary");
    expect(md).toContain(mockResume.tailoredSummary);
    expect(md).toContain("## Work Experience");
    expect(md).toContain("### Staff Infrastructure Engineer — Stripe");
    expect(md).toContain("- Engineered real-time settlement pipeline handling $10M+ daily volume.");
    expect(md).toContain("## Technical Projects");
    expect(md).toContain("### Serverless Mesh (TypeScript, AWS CDK, Lambda)");
    expect(md).toContain("## Core Competencies");
    expect(md).toContain("AWS CDK, TypeScript");
  });

  it("generates HTML with modern_standard typography preset", () => {
    const html = exportService.generateHtmlDocument(mockResume, mockProfile, "modern_standard");

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain('data-preset="modern_standard"');
    expect(html).toContain("-apple-system");
    expect(html).toContain("Alex Cloud");
    expect(html).toContain("Work Experience");
    expect(html).toContain("Stripe");
  });

  it("generates HTML with classic_ivy typography preset", () => {
    const html = exportService.generateHtmlDocument(mockResume, mockProfile, "classic_ivy");

    expect(html).toContain('data-preset="classic_ivy"');
    expect(html).toContain("Garamond");
    expect(html).toContain("Serverless Mesh");
  });

  it("generates HTML with tech_minimalist typography preset", () => {
    const html = exportService.generateHtmlDocument(mockResume, mockProfile, "tech_minimalist");

    expect(html).toContain('data-preset="tech_minimalist"');
    expect(html).toContain("SFMono-Regular");
    expect(html).toContain("Core Competencies");
  });

  it("escapes special HTML characters properly", () => {
    const specialProfile: Profile = {
      ...mockProfile,
      contact: {
        ...mockProfile.contact,
        fullName: "Jane & John <Doe>",
      },
    };

    const html = exportService.generateHtmlDocument(mockResume, specialProfile, "modern_standard");
    expect(html).toContain("Jane &amp; John &lt;Doe&gt;");
    expect(html).not.toContain("<Doe>");
  });
});

describe("ATS Export Engine: API Routes", () => {
  beforeEach(async () => {
    mockCookieStore.clear();

    const tailorRepo = getTailorRepo();
    await tailorRepo.saveTailoredResume(mockResume);

    const profileRepo = getProfileRepo();
    await profileRepo.saveProfile(mockProfile);
  });

  it("returns 401 when requesting markdown unauthenticated", async () => {
    const req = new NextRequest("http://localhost:3000/api/export/resume_123/markdown");
    const res = await exportMarkdownHandler(req, { params: Promise.resolve({ id: mockResume.id }) });

    expect(res.status).toBe(401);
  });

  it("returns 404 when requesting markdown for nonexistent resume", async () => {
    const authSession = { userId: "user_export_test", email: "alex.cloud@example.com", name: "Alex" };
    mockCookieStore.set("fitme_session", Buffer.from(JSON.stringify(authSession)).toString("base64url"));

    const req = new NextRequest("http://localhost:3000/api/export/nonexistent/markdown");
    const res = await exportMarkdownHandler(req, { params: Promise.resolve({ id: "nonexistent-id" }) });

    expect(res.status).toBe(404);
  });

  it("downloads markdown attachment with 200 status when authenticated", async () => {
    const authSession = { userId: "user_export_test", email: "alex.cloud@example.com", name: "Alex" };
    mockCookieStore.set("fitme_session", Buffer.from(JSON.stringify(authSession)).toString("base64url"));

    const req = new NextRequest(`http://localhost:3000/api/export/${mockResume.id}/markdown`);
    const res = await exportMarkdownHandler(req, { params: Promise.resolve({ id: mockResume.id }) });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/markdown");
    expect(res.headers.get("Content-Disposition")).toContain(`attachment; filename="tailored-resume-v1.md"`);

    const text = await res.text();
    expect(text).toContain("# Alex Cloud");
    expect(text).toContain("## Work Experience");
  });

  it("returns printable HTML with 200 status when authenticated", async () => {
    const authSession = { userId: "user_export_test", email: "alex.cloud@example.com", name: "Alex" };
    mockCookieStore.set("fitme_session", Buffer.from(JSON.stringify(authSession)).toString("base64url"));

    const req = new NextRequest(`http://localhost:3000/api/export/${mockResume.id}/html?preset=classic_ivy&print=true`);
    const res = await exportHtmlHandler(req, { params: Promise.resolve({ id: mockResume.id }) });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/html");

    const html = await res.text();
    expect(html).toContain('data-preset="classic_ivy"');
    expect(html).toContain("window.print()");
  });
});

