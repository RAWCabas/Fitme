import { Profile } from "@/features/profile/schema";
import { TailoredResume, TypographyPreset } from "@/features/tailor/schema";

export class ExportService {
  /**
   * Generates clean, machine-readable standard ATS Markdown.
   */
  generateMarkdown(resume: TailoredResume, profile: Profile): string {
    const c = profile.contact;
    const lines: string[] = [];

    // Header
    lines.push(`# ${c.fullName}`);
    if (c.headline) {
      lines.push(`*${c.headline}*`);
    }

    const contactParts: string[] = [c.email];
    if (c.phone) contactParts.push(c.phone);
    if (c.location) contactParts.push(c.location);
    lines.push(contactParts.join(" | "));

    const linkParts: string[] = [];
    if (c.linkedinUrl) linkParts.push(c.linkedinUrl);
    if (c.githubUrl) linkParts.push(c.githubUrl);
    if (c.portfolioUrl) linkParts.push(c.portfolioUrl);
    if (linkParts.length > 0) {
      lines.push(linkParts.join(" | "));
    }
    lines.push("");

    // Professional Summary
    if (resume.tailoredSummary) {
      lines.push("## Professional Summary");
      lines.push(resume.tailoredSummary);
      lines.push("");
    }

    // Work Experience
    if (resume.tailoredExperiences.length > 0) {
      lines.push("## Work Experience");
      for (const exp of resume.tailoredExperiences) {
        lines.push(`### ${exp.role} — ${exp.company}`);
        const dateStr = `${exp.startDate || "N/A"} – ${exp.endDate || "Present"}`;
        const locStr = exp.location ? ` | ${exp.location}` : "";
        lines.push(`*${dateStr}${locStr}*`);
        for (const bullet of exp.bullets) {
          lines.push(`- ${bullet.content}`);
        }
        lines.push("");
      }
    }

    // Technical Projects
    if (resume.tailoredProjects.length > 0) {
      lines.push("## Technical Projects");
      for (const proj of resume.tailoredProjects) {
        const techStr = proj.technologies.length > 0 ? ` (${proj.technologies.join(", ")})` : "";
        lines.push(`### ${proj.name}${techStr}`);
        if (proj.description) {
          lines.push(proj.description);
        }
        for (const bullet of proj.bullets) {
          lines.push(`- ${bullet.content}`);
        }
        lines.push("");
      }
    }

    // Core Competencies / Skills
    if (resume.selectedSkills.length > 0) {
      lines.push("## Core Competencies");
      lines.push(resume.selectedSkills.map((s) => s.name).join(", "));
      lines.push("");
    }

    return lines.join("\n");
  }

  /**
   * Generates a single-column, machine-readable ATS printable HTML document
   * supporting modern_standard, classic_ivy, and tech_minimalist presets.
   */
  generateHtmlDocument(
    resume: TailoredResume,
    profile: Profile,
    preset: TypographyPreset = "modern_standard"
  ): string {
    const c = profile.contact;

    const presetStyles: Record<TypographyPreset, string> = {
      modern_standard: `
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          color: #111827;
          line-height: 1.5;
        }
        h1 {
          font-size: 20pt;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin-bottom: 2pt;
          text-align: center;
        }
        .headline {
          font-size: 10.5pt;
          color: #374151;
          font-weight: 600;
          text-align: center;
          margin-bottom: 4pt;
        }
        .contact-row {
          text-align: center;
          font-size: 8.5pt;
          color: #4b5563;
          margin-bottom: 14pt;
        }
        .contact-row a {
          color: #4b5563;
          text-decoration: none;
        }
        h2 {
          font-size: 10pt;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #111827;
          border-bottom: 1.5px solid #d1d5db;
          padding-bottom: 2pt;
          margin-top: 10pt;
          margin-bottom: 6pt;
        }
        .item-header {
          display: flex;
          justify-content: space-between;
          font-size: 9.5pt;
          font-weight: 700;
          color: #111827;
          margin-top: 5pt;
        }
        .item-sub {
          display: flex;
          justify-content: space-between;
          font-size: 8.5pt;
          color: #4b5563;
          margin-bottom: 3pt;
        }
        ul {
          margin: 0;
          padding-left: 14pt;
        }
        li {
          font-size: 9pt;
          color: #1f2937;
          margin-bottom: 2pt;
        }
        .summary-text {
          font-size: 9pt;
          color: #1f2937;
          line-height: 1.45;
        }
        .skills-list {
          font-size: 9pt;
          color: #1f2937;
        }
      `,
      classic_ivy: `
        body {
          font-family: "Garamond", "Georgia", "Baskerville", "Times New Roman", serif;
          color: #1c1917;
          line-height: 1.45;
        }
        h1 {
          font-size: 22pt;
          font-weight: normal;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          text-align: center;
          margin-bottom: 3pt;
        }
        .headline {
          font-size: 10.5pt;
          font-style: italic;
          text-align: center;
          margin-bottom: 4pt;
        }
        .contact-row {
          text-align: center;
          font-size: 9pt;
          color: #44403c;
          margin-bottom: 16pt;
        }
        .contact-row a {
          color: #44403c;
          text-decoration: none;
        }
        h2 {
          font-size: 10.5pt;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          border-bottom: 1px solid #78716c;
          padding-bottom: 1pt;
          margin-top: 10pt;
          margin-bottom: 6pt;
        }
        .item-header {
          display: flex;
          justify-content: space-between;
          font-size: 10pt;
          font-weight: bold;
          margin-top: 5pt;
        }
        .item-sub {
          display: flex;
          justify-content: space-between;
          font-size: 9pt;
          font-style: italic;
          color: #44403c;
          margin-bottom: 3pt;
        }
        ul {
          margin: 0;
          padding-left: 15pt;
        }
        li {
          font-size: 9.5pt;
          color: #1c1917;
          margin-bottom: 2pt;
        }
        .summary-text {
          font-size: 9.5pt;
          color: #1c1917;
          line-height: 1.4;
        }
        .skills-list {
          font-size: 9.5pt;
          color: #1c1917;
        }
      `,
      tech_minimalist: `
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #0f172a;
          line-height: 1.5;
        }
        h1 {
          font-size: 19pt;
          font-weight: 800;
          letter-spacing: -0.03em;
          margin-bottom: 2pt;
        }
        .headline {
          font-size: 10pt;
          font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
          color: #2563eb;
          font-weight: 500;
          margin-bottom: 4pt;
        }
        .contact-row {
          font-size: 8.5pt;
          font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
          color: #64748b;
          margin-bottom: 14pt;
        }
        .contact-row a {
          color: #64748b;
          text-decoration: none;
        }
        h2 {
          font-size: 9pt;
          font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #2563eb;
          border-bottom: 1px dashed #cbd5e1;
          padding-bottom: 2pt;
          margin-top: 10pt;
          margin-bottom: 6pt;
        }
        .item-header {
          display: flex;
          justify-content: space-between;
          font-size: 9.5pt;
          font-weight: 700;
          color: #0f172a;
          margin-top: 5pt;
        }
        .item-sub {
          display: flex;
          justify-content: space-between;
          font-size: 8pt;
          font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
          color: #64748b;
          margin-bottom: 3pt;
        }
        ul {
          margin: 0;
          padding-left: 14pt;
        }
        li {
          font-size: 8.5pt;
          color: #334155;
          margin-bottom: 2pt;
        }
        .summary-text {
          font-size: 8.5pt;
          color: #334155;
          line-height: 1.45;
        }
        .skills-list {
          font-size: 8.5pt;
          font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
          color: #334155;
        }
      `,
    };

    const contactParts: string[] = [c.email];
    if (c.phone) contactParts.push(c.phone);
    if (c.location) contactParts.push(c.location);
    if (c.linkedinUrl) contactParts.push(`<a href="${c.linkedinUrl}">LinkedIn</a>`);
    if (c.githubUrl) contactParts.push(`<a href="${c.githubUrl}">GitHub</a>`);
    if (c.portfolioUrl) contactParts.push(`<a href="${c.portfolioUrl}">Portfolio</a>`);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(c.fullName)} - Resume</title>
  <style>
    @page {
      margin: 0.5in 0.5in;
      size: letter;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 0.4in;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
      a {
        text-decoration: none;
        color: inherit;
      }
    }
    ${presetStyles[preset] || presetStyles.modern_standard}
  </style>
</head>
<body data-preset="${preset}">
  <header>
    <h1>${escapeHtml(c.fullName)}</h1>
    ${c.headline ? `<div class="headline">${escapeHtml(c.headline)}</div>` : ""}
    <div class="contact-row">
      ${contactParts.join(" &nbsp;•&nbsp; ")}
    </div>
  </header>

  ${
    resume.tailoredSummary
      ? `<section>
    <h2>Professional Summary</h2>
    <div class="summary-text">${escapeHtml(resume.tailoredSummary)}</div>
  </section>`
      : ""
  }

  ${
    resume.tailoredExperiences.length > 0
      ? `<section>
    <h2>Work Experience</h2>
    ${resume.tailoredExperiences
      .map(
        (exp) => `
      <div class="experience-item">
        <div class="item-header">
          <span>${escapeHtml(exp.role)}</span>
          <span>${escapeHtml(exp.company)}</span>
        </div>
        <div class="item-sub">
          <span>${exp.startDate || "N/A"} – ${exp.endDate || "Present"}</span>
          <span>${escapeHtml(exp.location || "")}</span>
        </div>
        <ul>
          ${exp.bullets.map((b) => `<li>${escapeHtml(b.content)}</li>`).join("\n          ")}
        </ul>
      </div>`
      )
      .join("")}
  </section>`
      : ""
  }

  ${
    resume.tailoredProjects.length > 0
      ? `<section>
    <h2>Technical Projects</h2>
    ${resume.tailoredProjects
      .map(
        (p) => `
      <div class="project-item">
        <div class="item-header">
          <span>${escapeHtml(p.name)}</span>
          <span style="font-weight: normal; font-size: 8.5pt;">${escapeHtml(p.technologies.join(", "))}</span>
        </div>
        ${p.description ? `<div style="font-size: 8.5pt; color: #4b5563; margin-bottom: 2pt;">${escapeHtml(p.description)}</div>` : ""}
        ${
          p.bullets.length > 0
            ? `<ul>
          ${p.bullets.map((b) => `<li>${escapeHtml(b.content)}</li>`).join("\n          ")}
        </ul>`
            : ""
        }
      </div>`
      )
      .join("")}
  </section>`
      : ""
  }

  ${
    resume.selectedSkills.length > 0
      ? `<section>
    <h2>Core Competencies</h2>
    <div class="skills-list">
      ${resume.selectedSkills.map((s) => escapeHtml(s.name)).join(" • ")}
    </div>
  </section>`
      : ""
  }
</body>
</html>`;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export const exportService = new ExportService();

