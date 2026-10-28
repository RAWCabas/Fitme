import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { QuickFillTray } from "@/components/quick-fill-tray";
import { Profile } from "@/features/profile/schema";

const mockProfile: Profile = {
  userId: "user_tray_test",
  contact: {
    fullName: "Morgan Developer",
    headline: "Principal Systems Engineer",
    email: "morgan@example.com",
    phone: "+1 (555) 345-6789",
    location: "Seattle, WA",
    portfolioUrl: "https://morgandev.io",
    linkedinUrl: "https://linkedin.com/in/morgandev",
    githubUrl: "https://github.com/morgandev",
  },
  experiences: [
    {
      id: "1fa85f64-5717-4562-b3fc-2c963f66afa1",
      company: "CloudScale Inc.",
      role: "Lead Architect",
      location: "Seattle, WA",
      startDate: "2021-01-01",
      endDate: null,
      isHidden: false,
      bullets: [
        {
          id: "2fa85f64-5717-4562-b3fc-2c963f66afa2",
          content: "Built high-speed caching proxy handling 100k requests/sec.",
          isHidden: false,
          hasMetrics: true,
        },
      ],
    },
  ],
  projects: [],
  skills: [
    { id: "3fa85f64-5717-4562-b3fc-2c963f66afa3", name: "TypeScript", category: "languages", isHidden: false },
    { id: "4fa85f64-5717-4562-b3fc-2c963f66afa4", name: "Next.js", category: "frameworks", isHidden: false },
  ],
  summary: "Results-driven principal engineer specializing in low-latency systems.",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("Quick-Fill Clipboard Tray", () => {
  const writeTextMock = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });
  });

  it("renders the floating Quick-Fill trigger button by default", () => {
    render(<QuickFillTray profile={mockProfile} />);

    const triggerBtn = screen.getByRole("button", { name: /Open Quick-Fill Application Clipboard Tray/i });
    expect(triggerBtn).toBeDefined();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens the drawer when clicking the floating trigger", () => {
    render(<QuickFillTray profile={mockProfile} />);

    const triggerBtn = screen.getByRole("button", { name: /Open Quick-Fill Application Clipboard Tray/i });
    fireEvent.click(triggerBtn);

    expect(screen.getByRole("dialog")).toBeDefined();
    expect(screen.getByText("Quick-Fill Tray")).toBeDefined();
    expect(screen.getByText("Morgan Developer")).toBeDefined();
    expect(screen.getByText("morgan@example.com")).toBeDefined();
  });

  it("copies contact info to clipboard when clicked", async () => {
    render(<QuickFillTray profile={mockProfile} />);

    fireEvent.click(screen.getByRole("button", { name: /Open Quick-Fill Application Clipboard Tray/i }));

    const fullNameItem = screen.getByText("Morgan Developer");
    fireEvent.click(fullNameItem);

    expect(writeTextMock).toHaveBeenCalledWith("Morgan Developer");
    await waitFor(() => {
      expect(screen.getByText("Copied")).toBeDefined();
    });
  });

  it("navigates across tabs: Bullets, Skills, and Summary", async () => {
    render(<QuickFillTray profile={mockProfile} />);

    fireEvent.click(screen.getByRole("button", { name: /Open Quick-Fill Application Clipboard Tray/i }));

    // Bullets tab
    fireEvent.click(screen.getByRole("button", { name: /Bullets/i }));
    expect(screen.getByText(/Built high-speed caching proxy/i)).toBeDefined();

    // Skills tab
    fireEvent.click(screen.getByRole("button", { name: /Skills/i }));
    expect(screen.getByText(/Copy Comma-Separated/i)).toBeDefined();
    expect(screen.getByText("TypeScript, Next.js")).toBeDefined();

    // Summary tab
    fireEvent.click(screen.getByRole("button", { name: /Summary/i }));
    expect(screen.getByText(/Results-driven principal engineer/i)).toBeDefined();
  });

  it("closes the drawer when clicking the close button", () => {
    render(<QuickFillTray profile={mockProfile} />);

    fireEvent.click(screen.getByRole("button", { name: /Open Quick-Fill Application Clipboard Tray/i }));
    expect(screen.getByRole("dialog")).toBeDefined();

    const closeBtn = screen.getByRole("button", { name: /Close Quick-Fill Tray/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

