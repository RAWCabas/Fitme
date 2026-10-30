import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { StudioClient } from "@/app/(dashboard)/studio/studio-client";
import { Profile } from "@/features/profile/schema";

const mockProfile: Profile = {
  userId: "user_test_ui",
  contact: {
    fullName: "Jane Engineer",
    headline: "Senior Fullstack Engineer",
    email: "jane@example.com",
    phone: "+1 555-0100",
    location: "San Francisco, CA",
    portfolioUrl: "https://jane.dev",
    linkedinUrl: "https://linkedin.com/in/jane",
    githubUrl: "https://github.com/jane",
  },
  experiences: [
    {
      id: "a1b2c3d4-e5f6-47a8-9b01-234567890123",
      company: "Acme Corp",
      role: "Lead Developer",
      location: "San Francisco, CA",
      startDate: "2022-01-01",
      endDate: null,
      isHidden: false,
      bullets: [
        { id: "f1e2d3c4-b5a6-49f8-8e01-234567890123", content: "Built scalable web apps using Next.js and TypeScript", isHidden: false, hasMetrics: true },
      ],
    },
  ],
  projects: [
    {
      id: "b2c3d4e5-f6a7-48b9-bc01-234567890123",
      name: "Cloud Pipeline Tool",
      description: "CLI for cloud deployment automation",
      technologies: ["Node.js", "Docker"],
      liveUrl: "",
      repoUrl: "https://github.com/jane/tool",
      bullets: [],
      isHidden: false,
    },
  ],
  skills: [
    { id: "c3d4e5f6-a7b8-49ca-8d12-345678901234", name: "TypeScript", category: "languages", isHidden: false },
    { id: "d4e5f6a7-b8c9-4adb-9e23-456789012345", name: "Next.js", category: "frameworks", isHidden: false },
  ],
  certifications: [],
  summary: "Experienced Fullstack Engineer building cloud-native apps.",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("Fit Studio UI: StudioClient", () => {
  it("renders the job ingestion form with empty description by default", () => {
    render(<StudioClient profile={mockProfile} />);

    expect(screen.getByText("Tailor Resume to a Job Description")).toBeDefined();
    expect(screen.getByPlaceholderText(/Paste the role responsibilities/i)).toBeDefined();
    expect(screen.getByText("1 Page (Compact)")).toBeDefined();
    expect(screen.getByText("2 Pages (Standard)")).toBeDefined();

    const submitBtn = screen.getByRole("button", { name: /Analyze Fit & Generate Tailored Resume/i }) as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);
  });

  it("enables the submit button when job description is entered", () => {
    render(<StudioClient profile={mockProfile} />);

    const textarea = screen.getByPlaceholderText(/Paste the role responsibilities/i);
    fireEvent.change(textarea, {
      target: { value: "Looking for a Senior TypeScript and Next.js Engineer to build distributed web applications." },
    });

    const submitBtn = screen.getByRole("button", { name: /Analyze Fit & Generate Tailored Resume/i }) as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(false);
  });

  it("allows toggling page length budget", () => {
    render(<StudioClient profile={mockProfile} />);

    const twoPagesBtn = screen.getByText("2 Pages (Standard)");
    fireEvent.click(twoPagesBtn);

    expect(twoPagesBtn.className).toContain("bg-primary");
  });

  it("includes Cabas Executive in the preset dropdown", () => {
    render(<StudioClient profile={mockProfile} />);

    expect(screen.getByText("Cabas Executive (Exact PDF Template)")).toBeDefined();
  });

  it("displays saved resumes in View 1 and switches versions in View 2", () => {
    const mockResume = {
      id: "res-123",
      userId: "user_test_ui",
      jobOpportunityId: "job-123",
      title: "Hardware & Software Engineer",
      versionNumber: 1,
      status: "draft" as const,
      preset: "cabas_executive" as const,
      pageBudget: "1_page" as const,
      fitScore: {
        score: 85,
        matchedCount: 2,
        missingCount: 0,
        keywords: [
          { keyword: "TypeScript", status: "matched" as const, occurrencesInJD: 2, notes: "Direct match" },
        ],
        summaryEvaluation: "Strong Match",
      },
      tailoredSummary: "Experienced engineer",
      tailoredExperiences: mockProfile.experiences,
      tailoredProjects: mockProfile.projects,
      tailoredCertifications: [
        {
          id: "cert-1",
          name: "TESDA Computer Systems Servicing NC II",
          issuer: "TESDA",
          issueDate: "2024-05-15",
          expiryDate: null,
          credentialId: "TESDA-NC2-2024",
          credentialUrl: "",
          hours: "280 Hours",
          isHidden: false,
        },
      ],
      selectedSkills: mockProfile.skills,
      pdfS3Key: null,
      pdfPresignedUrl: null,
      markdownContent: "# Resume",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    const mockJob = {
      id: "job-123",
      userId: "user_test_ui",
      company: "InnovateTech",
      role: "Hardware & Software Engineer",
      location: "Cebu City, Philippines",
      sourceUrl: "",
      rawDescription: "Tech role",
      extractedSkills: ["TypeScript"],
      mustHaves: ["Hardware diagnostics"],
      niceToHaves: [],
      createdAt: "2026-01-01T00:00:00.000Z",
    };

    // When savedResumes is passed, it loads View 2 by default
    render(
      <StudioClient
        profile={mockProfile}
        savedResumes={[mockResume]}
        savedJobs={{ "job-123": mockJob }}
      />
    );

    expect(screen.getAllByText("Hardware & Software Engineer").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("InnovateTech")).toBeDefined();
    expect(screen.getByText("Certifications & Trainings")).toBeDefined();
    expect(screen.getByText("TESDA Computer Systems Servicing NC II")).toBeDefined();

    // Clicking back takes to View 1, where saved resumes list is shown
    const backBtn = screen.getByTitle("Back to input");
    fireEvent.click(backBtn);

    expect(screen.getByText("Saved Tailored Resumes (1)")).toBeDefined();
  });
});
