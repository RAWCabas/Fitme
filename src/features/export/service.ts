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

    // Education
    const isRhinn = c.fullName.toLowerCase().includes("rhinn") || c.email.toLowerCase().includes("rhinn");
    if (isRhinn) {
      lines.push("## Education");
      lines.push("### Bachelor of Science in Computer Engineering");
      lines.push("*Cebu Technological University- Main Campus*");
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
    if (resume.tailoredProjects && resume.tailoredProjects.length > 0) {
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
    if (resume.selectedSkills && resume.selectedSkills.length > 0) {
      lines.push("## Core Competencies");
      lines.push(resume.selectedSkills.map((s) => s.name).join(", "));
      lines.push("");
    }

    // Certifications
    const certs = resume.tailoredCertifications || profile.certifications || [];
    const activeCerts = certs.filter((cert) => !cert.isHidden);
    if (activeCerts.length > 0) {
      lines.push("## Trainings and Certificates");
      for (const cert of activeCerts) {
        lines.push(`- ${cert.name}${cert.issuer ? ` – ${cert.issuer}` : ""}${cert.hours ? ` | ${cert.hours}` : ""}`);
      }
      lines.push("");
    }

    return lines.join("\n");
  }

  /**
   * Generates a single-column, machine-readable ATS printable HTML document
   * supporting modern_standard, classic_ivy, tech_minimalist, and cabas_executive presets.
   */
  generateHtmlDocument(
    resume: TailoredResume,
    profile: Profile,
    preset: TypographyPreset = "modern_standard"
  ): string {
    const c = profile.contact;
    const isRhinn = c.fullName.toLowerCase().includes("rhinn") || c.email.toLowerCase().includes("rhinn");

    const presetStyles: Record<TypographyPreset, string> = {
      modern_standard: `
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          color: #111827;
          line-height: 1.45;
        }
        .header-container {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 6pt;
        }
        h1 {
          font-size: 20pt;
          font-weight: 800;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          margin: 0 0 3pt 0;
          color: #0f172a;
        }
        .headline {
          font-size: 9.5pt;
          color: #1e293b;
          font-weight: 700;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          margin-bottom: 5pt;
        }
        .contact-row {
          font-size: 8.5pt;
          color: #334155;
          margin-bottom: 2pt;
          display: flex;
          flex-direction: column;
          gap: 2pt;
        }
        .contact-row a {
          color: #334155;
          text-decoration: none;
        }
        .header-divider {
          border-bottom: 2.5px solid #0f172a;
          margin: 8pt 0 10pt 0;
        }
        h2 {
          font-size: 10pt;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #0f172a;
          border-bottom: 1.5px solid #0f172a;
          padding-bottom: 2pt;
          margin-top: 10pt;
          margin-bottom: 5pt;
        }
        .item-header {
          display: flex;
          justify-content: space-between;
          font-size: 9.5pt;
          font-weight: 700;
          color: #0f172a;
          margin-top: 4pt;
        }
        .item-sub {
          display: flex;
          justify-content: space-between;
          font-size: 8.5pt;
          font-style: italic;
          color: #475569;
          margin-bottom: 2pt;
        }
        ul {
          margin: 2pt 0 6pt 0;
          padding-left: 14pt;
        }
        li {
          font-size: 8.5pt;
          color: #1e293b;
          margin-bottom: 2pt;
          line-height: 1.4;
        }
        .summary-text {
          font-size: 8.5pt;
          color: #1e293b;
          line-height: 1.45;
          text-align: justify;
        }
        .skills-category-row {
          font-size: 8.5pt;
          color: #1e293b;
          margin-bottom: 3pt;
          line-height: 1.4;
        }
        .skills-category-label {
          font-weight: 700;
          color: #0f172a;
        }
      `,
      cabas_executive: `
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          color: #111827;
          line-height: 1.4;
        }
        .header-container {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 4pt;
        }
        h1 {
          font-size: 22pt;
          font-weight: 900;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          margin: 0 0 3pt 0;
          color: #111827;
        }
        .headline {
          font-size: 9.5pt;
          color: #111827;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-bottom: 5pt;
        }
        .contact-row {
          font-size: 8.5pt;
          color: #374151;
          margin-bottom: 2pt;
          display: flex;
          flex-direction: column;
          gap: 2pt;
        }
        .contact-row a {
          color: #374151;
          text-decoration: none;
        }
        .header-divider {
          border-bottom: 2.5px solid #111827;
          margin: 8pt 0 10pt 0;
        }
        h2 {
          font-size: 10pt;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #111827;
          border-bottom: 2px solid #111827;
          padding-bottom: 1.5pt;
          margin-top: 9pt;
          margin-bottom: 5pt;
        }
        .item-header {
          display: flex;
          justify-content: space-between;
          font-size: 9.5pt;
          font-weight: 700;
          color: #111827;
          margin-top: 4pt;
        }
        .item-sub {
          display: flex;
          justify-content: space-between;
          font-size: 8.5pt;
          font-style: italic;
          color: #4b5563;
          margin-bottom: 2pt;
        }
        ul {
          margin: 2pt 0 5pt 0;
          padding-left: 14pt;
        }
        li {
          font-size: 8.5pt;
          color: #1f2937;
          margin-bottom: 2pt;
          line-height: 1.38;
        }
        .summary-text {
          font-size: 8.5pt;
          color: #1f2937;
          line-height: 1.4;
          text-align: justify;
        }
        .skills-category-row {
          font-size: 8.5pt;
          color: #1f2937;
          margin-bottom: 3pt;
          line-height: 1.4;
        }
        .skills-category-label {
          font-weight: 700;
          color: #111827;
        }
      `,
      classic_ivy: `
        body {
          font-family: "Garamond", "Georgia", "Baskerville", "Times New Roman", serif;
          color: #1c1917;
          line-height: 1.45;
        }
        .header-container {
          text-align: center;
          margin-bottom: 6pt;
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
          margin-bottom: 12pt;
        }
        .contact-row a {
          color: #44403c;
          text-decoration: none;
        }
        .header-divider {
          display: none;
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
          font-size: 9pt;
          color: #1c1917;
          margin-bottom: 2pt;
        }
        .summary-text {
          font-size: 9pt;
          color: #1c1917;
          line-height: 1.4;
        }
        .skills-category-row {
          font-size: 9pt;
          color: #1c1917;
          margin-bottom: 3pt;
        }
        .skills-category-label {
          font-weight: bold;
        }
      `,
      tech_minimalist: `
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #0f172a;
          line-height: 1.45;
        }
        .header-container {
          margin-bottom: 6pt;
        }
        h1 {
          font-size: 19pt;
          font-weight: 800;
          letter-spacing: -0.03em;
          margin-bottom: 2pt;
        }
        .headline {
          font-size: 9.5pt;
          color: #0284c7;
          font-weight: 600;
          margin-bottom: 4pt;
        }
        .contact-row {
          font-size: 8.5pt;
          color: #64748b;
          font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
          margin-bottom: 10pt;
        }
        .contact-row a {
          color: #0284c7;
          text-decoration: none;
        }
        .header-divider {
          border-bottom: 1.5px solid #e2e8f0;
          margin: 6pt 0 8pt 0;
        }
        h2 {
          font-size: 9pt;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #0284c7;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 2pt;
          margin-top: 9pt;
          margin-bottom: 5pt;
        }
        .item-header {
          display: flex;
          justify-content: space-between;
          font-size: 9pt;
          font-weight: 600;
          color: #0f172a;
          margin-top: 4pt;
        }
        .item-sub {
          display: flex;
          justify-content: space-between;
          font-size: 8pt;
          color: #64748b;
          margin-bottom: 2pt;
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
        .skills-category-row {
          font-size: 8.5pt;
          font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
          color: #334155;
          margin-bottom: 2pt;
        }
        .skills-category-label {
          font-weight: bold;
          color: #0284c7;
        }
      `,
    };

    // Build categorized skills
    const categorizedSkills: Record<string, string[]> = {};
    if (isRhinn) {
      categorizedSkills["Hardware & IT Support"] = [
        "PC assembly",
        "hardware diagnostics & maintenance",
        "OS installation (Windows)",
        "printer/scanner setup",
      ];
      categorizedSkills["Networking"] = [
        "LAN/WAN fundamentals",
        "TCP/IP",
        "Wi-Fi & router configuration",
        "network troubleshooting",
      ];
      categorizedSkills["Software & Tools"] = [
        "Microsoft Office (Word, Excel, PowerPoint)",
        "Google Workspace",
        "Arduino IDE",
        "VS Code",
      ];
      categorizedSkills["Programming & CAD"] = [
        "Java (TESDA NC III)",
        "C/C++ basics",
        "HTML/CSS",
        "Autodesk Fusion 360",
      ];
      categorizedSkills["Design Suite"] = [
        "Adobe Photoshop",
        "Illustrator",
        "Premiere Pro",
      ];
    } else {
      for (const skill of resume.selectedSkills) {
        const catName =
          skill.category === "languages"
            ? "Programming & Languages"
            : skill.category === "frameworks"
            ? "Frameworks & Libraries"
            : skill.category === "cloud"
            ? "Cloud & Systems"
            : skill.category === "tools"
            ? "Tools & Platforms"
            : "Core Strengths";
        if (!categorizedSkills[catName]) categorizedSkills[catName] = [];
        categorizedSkills[catName].push(skill.name);
      }
    }

    const certs = resume.tailoredCertifications || profile.certifications || [];
    const activeCerts = certs.filter((cert) => !cert.isHidden);

    const isCabasTemplate = isRhinn || preset === "cabas_executive";
    const expTitle = isCabasTemplate ? "Research & Professional Experience" : "Work Experience";
    const skillsTitle = isCabasTemplate ? "Technical Skills" : "Core Competencies";
    const summaryTitle = isCabasTemplate ? "Professional Profile" : "Professional Summary";

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(c.fullName)} - Resume</title>
  <style>
    @page {
      margin: 0.4in 0.45in;
      size: letter;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 0.35in 0.45in;
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
  <header class="header-container">
    <div>
      <h1>${escapeHtml(c.fullName)}</h1>
      ${c.headline ? `<div class="headline">${escapeHtml(c.headline)}</div>` : ""}
      <div class="contact-row">
        ${c.location ? `<span>📍 ${escapeHtml(c.location)}</span>` : ""}
        ${c.phone ? `<span>📞 ${escapeHtml(c.phone)}</span>` : ""}
        ${c.email ? `<span>✉️ <a href="mailto:${escapeHtml(c.email)}">${escapeHtml(c.email)}</a></span>` : ""}
        ${c.linkedinUrl ? `<span>🔗 <a href="${escapeHtml(c.linkedinUrl)}">LinkedIn</a></span>` : ""}
        ${c.githubUrl ? `<span>💻 <a href="${escapeHtml(c.githubUrl)}">GitHub</a></span>` : ""}
      </div>
    </div>
  </header>

  <div class="header-divider"></div>

  ${
    resume.tailoredSummary
      ? `<section>
    <h2>${summaryTitle}</h2>
    <div class="summary-text">${escapeHtml(resume.tailoredSummary)}</div>
  </section>`
      : ""
  }

  ${
    isRhinn
      ? `<section>
    <h2>Education</h2>
    <div class="education-item">
      <div class="item-header">
        <span>Bachelor of Science in Computer Engineering</span>
      </div>
      <div class="item-sub">
        <span>Cebu Technological University- Main Campus</span>
      </div>
    </div>
  </section>`
      : ""
  }

  ${
    resume.tailoredExperiences.length > 0
      ? `<section>
    <h2>${expTitle}</h2>
    ${resume.tailoredExperiences
      .map(
        (exp) => `
      <div class="experience-item">
        <div class="item-header">
          <span>${escapeHtml(exp.role)}</span>
        </div>
        <div class="item-sub">
          <span>${escapeHtml(exp.company)} | ${exp.startDate?.slice(0, 4) || exp.endDate?.slice(0, 4) || "2026"}</span>
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
    Object.keys(categorizedSkills).length > 0
      ? `<section>
    <h2>${skillsTitle}</h2>
    <div class="skills-list">
      <ul>
        ${Object.entries(categorizedSkills)
          .map(
            ([cat, skills]) => `
          <li class="skills-category-row">
            <span class="skills-category-label">${escapeHtml(cat)}:</span> ${escapeHtml(skills.join(", "))}
          </li>`
          )
          .join("")}
      </ul>
    </div>
  </section>`
      : ""
  }

  ${
    activeCerts.length > 0
      ? `<section>
    <h2>TESDA Trainings and Certificates</h2>
    <ul>
      ${activeCerts
        .map(
          (cert) => `
        <li>
          <strong>${escapeHtml(cert.name)}</strong>${cert.issuer ? ` – ${escapeHtml(cert.issuer)}` : ""}${cert.hours ? ` | ${escapeHtml(cert.hours)}` : ""}
        </li>`
        )
        .join("")}
    </ul>
  </section>`
      : ""
  }

  ${
    resume.tailoredProjects && resume.tailoredProjects.length > 0
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
