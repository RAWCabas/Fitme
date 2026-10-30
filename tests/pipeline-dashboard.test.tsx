import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { PipelineClient } from "@/app/(dashboard)/dashboard/pipeline-client";
import { TailoredResume, JobOpportunity } from "@/features/tailor/schema";

const mockJob: JobOpportunity = {
  id: "job_pipeline_1",
  userId: "user_pipe_test",
  company: "Vercel",
  role: "Senior Frontend Engineer",
  location: "Remote",
  sourceUrl: "https://vercel.com/careers",
  rawDescription: "Looking for a Next.js and React specialist.",
  extractedSkills: ["Next.js", "React", "TypeScript"],
  mustHaves: ["5+ years React experience"],
  niceToHaves: [],
  createdAt: "2026-01-01T00:00:00.000Z",
};

// Create a resume in "sent" status from 10 days ago (aging alert trigger)
const tenDaysAgoIso = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
const twoDaysAgoIso = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

const mockResumes: TailoredResume[] = [
  {
    id: "resume_sent_aging",
    userId: "user_pipe_test",
    jobOpportunityId: "job_pipeline_1",
    title: "Senior React Engineer",
    versionNumber: 1,
    status: "sent",
    preset: "modern_standard",
    pageBudget: "1_page",
    fitScore: {
      score: 88,
      matchedCount: 3,
      missingCount: 0,
      keywords: [],
      summaryEvaluation: "Great match",
    },
    tailoredSummary: "Senior React expert with 6 years experience.",
    tailoredExperiences: [],
    tailoredProjects: [],
    tailoredCertifications: [],
    selectedSkills: [],
    pdfS3Key: null,
    pdfPresignedUrl: null,
    markdownContent: "",
    createdAt: tenDaysAgoIso,
    updatedAt: tenDaysAgoIso,
  },
  {
    id: "resume_draft_recent",
    userId: "user_pipe_test",
    jobOpportunityId: "job_pipeline_1",
    title: "React Lead",
    versionNumber: 2,
    status: "draft",
    preset: "tech_minimalist",
    pageBudget: "1_page",
    fitScore: {
      score: 75,
      matchedCount: 2,
      missingCount: 1,
      keywords: [],
      summaryEvaluation: "Decent match",
    },
    tailoredSummary: "Draft tailored summary.",
    tailoredExperiences: [],
    tailoredProjects: [],
    tailoredCertifications: [],
    selectedSkills: [],
    pdfS3Key: null,
    pdfPresignedUrl: null,
    markdownContent: "",
    createdAt: twoDaysAgoIso,
    updatedAt: twoDaysAgoIso,
  },
];

const mockJobsMap: Record<string, JobOpportunity> = {
  job_pipeline_1: mockJob,
};

describe("Application Pipeline Dashboard", () => {
  it("renders lifecycle metrics and greeting", () => {
    render(<PipelineClient initialResumes={mockResumes} jobs={mockJobsMap} userName="Alex Rivera" />);

    expect(screen.getByText(/Hello, Alex Rivera/i)).toBeDefined();
    // Status counts: 1 Draft, 1 Sent
    expect(screen.getByText("Drafts (1)")).toBeDefined();
    expect(screen.getByText("Sent (1)")).toBeDefined();
    expect(screen.getByText("Interviews (0)")).toBeDefined();
    expect(screen.getByText("Offers (0)")).toBeDefined();
  });

  it("triggers 7-day follow-up aging alert for sent applications", () => {
    render(<PipelineClient initialResumes={mockResumes} jobs={mockJobsMap} userName="Alex Rivera" />);

    expect(screen.getByText(/Follow-Up Reminders/i)).toBeDefined();
    expect(screen.getByText(/You have 1 application waiting in "Sent" status for 7 or more days/i)).toBeDefined();
    expect(screen.getAllByText("Vercel").length).toBeGreaterThan(0);
  });

  it("filters application cards by status", () => {
    render(<PipelineClient initialResumes={mockResumes} jobs={mockJobsMap} userName="Alex Rivera" />);

    // Click Drafts tab
    const draftsTab = screen.getByRole("button", { name: /^Drafts \(1\)$/i });
    fireEvent.click(draftsTab);

    expect(screen.getByText("Draft tailored summary.")).toBeDefined();
    expect(screen.queryByText("Senior React expert with 6 years experience.")).toBeNull();

    // Click Interviews tab (empty)
    const interviewTab = screen.getByRole("button", { name: /^Interviews \(0\)$/i });
    fireEvent.click(interviewTab);

    expect(screen.getByText(/No resumes found in this stage/i)).toBeDefined();
  });

  it("allows updating application lifecycle status", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ...mockResumes[1],
        status: "sent",
      }),
    });

    render(<PipelineClient initialResumes={mockResumes} jobs={mockJobsMap} userName="Alex Rivera" />);

    const selects = screen.getAllByRole("combobox");
    const draftCardSelect = selects[0]; // first card's status selector

    fireEvent.change(draftCardSelect, { target: { value: "sent" } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/tailor/resumes/"),
        expect.objectContaining({ method: "PATCH" })
      );
    });
  });
});
