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
    const eduList = (resume.tailoredEducation && resume.tailoredEducation.length > 0)
      ? resume.tailoredEducation
      : (profile.education || []);
    const activeEdu = eduList.filter((e) => !e.isHidden);
    if (activeEdu.length > 0) {
      lines.push("## Education");
      for (const edu of activeEdu) {
        const title = edu.degree ? `${edu.degree} — ${edu.institution}` : edu.institution;
        lines.push(`### ${title}`);
        const dateStr = [edu.startDate, edu.endDate || "Present"].filter(Boolean).join(" – ");
        const subStr = [dateStr, edu.fieldOfStudy, edu.honors].filter(Boolean).join(" | ");
        if (subStr) lines.push(`*${subStr}*`);
        lines.push("");
      }
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
          line-height: 1.42;
        }
        .header-container {
          margin-bottom: 4pt;
        }
        h1 {
          font-size: 21pt;
          font-weight: 900;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          margin: 0 0 3pt 0;
          color: #111827;
          line-height: 1.15;
        }
        .headline {
          font-size: 9.5pt;
          color: #111827;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-bottom: 4pt;
          line-height: 1.25;
        }
        .contact-row {
          font-size: 8.5pt;
          color: #374151;
          display: flex;
          flex-wrap: wrap;
          gap: 2pt 10pt;
          align-items: center;
          line-height: 1.3;
        }
        .contact-row a {
          color: #374151;
          text-decoration: none;
        }
        .header-divider {
          border-bottom: 1.5px solid #111827;
          margin: 6pt 0 8pt 0;
        }
        h2 {
          font-size: 10.5pt;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #111827;
          border-bottom: 1.5px solid #111827;
          padding-bottom: 3.5pt;
          margin-top: 9pt;
          margin-bottom: 5.5pt;
        }
        .item-header {
          display: flex;
          justify-content: space-between;
          font-size: 9.5pt;
          font-weight: 700;
          color: #111827;
          margin-top: 3.5pt;
        }
        .item-sub {
          display: flex;
          justify-content: space-between;
          font-size: 9pt;
          font-style: italic;
          color: #374151;
          margin-bottom: 2pt;
        }
        ul {
          margin: 2pt 0 4pt 0;
          padding-left: 14pt;
        }
        li {
          font-size: 9pt;
          color: #1f2937;
          margin-bottom: 2pt;
          line-height: 1.38;
        }
        .summary-text {
          font-size: 9pt;
          color: #1f2937;
          line-height: 1.42;
          text-align: justify;
        }
        .skills-category-row {
          font-size: 9pt;
          color: #1f2937;
          margin-bottom: 2.5pt;
          line-height: 1.35;
        }
        .skills-category-label {
          font-weight: 700;
          color: #111827;
        }
        .experience-item, .project-item, .education-item {
          page-break-inside: avoid;
          break-inside: avoid;
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

    const eduList = (resume.tailoredEducation && resume.tailoredEducation.length > 0)
      ? resume.tailoredEducation
      : (profile.education || []);
    const activeEdu = eduList.filter((e) => !e.isHidden);

    const isCabasTemplate = isRhinn || preset === "cabas_executive";
    const expTitle = isCabasTemplate ? "Research & Professional Experience" : "Work Experience";
    const skillsTitle = isCabasTemplate ? "Technical Skills" : "Core Competencies";
    const summaryTitle = isCabasTemplate ? "Professional Profile" : "Professional Summary";

    const activePresetCss = presetStyles[preset] || presetStyles.modern_standard;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(c.fullName)} - Resume</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 11mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 8mm 11mm;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @media print {
      @page {
        size: A4 portrait;
        margin: 8mm 11mm;
      }
      body {
        padding: 0 !important;
        margin: 0 !important;
      }
      .no-print {
        display: none !important;
      }
      a {
        text-decoration: none;
        color: inherit;
      }
    }
    ${activePresetCss}
  </style>
</head>
<body data-preset="${preset}">
  <style>
    ${activePresetCss}
  </style>
  <div class="no-print" style="margin: -7mm -9mm 6mm -9mm; background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 8px 14px; font-family: -apple-system, sans-serif; font-size: 12px; color: #475569; display: flex; justify-content: space-between; align-items: center;">
    <span>💡 <strong>Tip:</strong> In Chrome's print dialog, switch <strong>Destination</strong> from your physical printer to <strong>Save as PDF</strong> to download as a PDF file.</span>
    <button onclick="window.print()" style="background: #2563eb; color: #ffffff; border: none; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer;">Print / Save PDF</button>
  </div>

  <div id="printable-resume" style="width: 100%; max-width: 794px; background: #ffffff; color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; box-sizing: border-box;">
    <header class="header-container" style="margin-bottom: 2pt;">
      <div>
        <h1 style="font-size: 21pt; font-weight: 900; letter-spacing: 0.02em; text-transform: uppercase; margin: 0 0 2pt 0; color: #000000; line-height: 1.15; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          ${escapeHtml(c.fullName)}
        </h1>
        ${
          c.headline
            ? `<div class="headline" style="font-size: 9.5pt; color: #000000; font-weight: 700; letter-spacing: 0.03em; text-transform: uppercase; margin-bottom: 4pt; line-height: 1.25;">
                ${escapeHtml(c.headline)}
              </div>`
            : ""
        }
        <div class="contact-row" style="font-size: 8.5pt; color: #111827; display: flex; flex-wrap: wrap; gap: 2pt 10pt; align-items: center; line-height: 1.35;">
          ${c.location ? `<div style="display: flex; align-items: center; gap: 4px;"><span>📍</span><span>${escapeHtml(c.location)}</span></div>` : ""}
          ${c.phone ? `<div style="display: flex; align-items: center; gap: 4px;"><span>📞</span><span>${escapeHtml(c.phone)}</span></div>` : ""}
          ${c.email ? `<div style="display: flex; align-items: center; gap: 4px;"><span>✉️</span><a href="mailto:${escapeHtml(c.email)}" style="color: #111827; text-decoration: none;">${escapeHtml(c.email)}</a></div>` : ""}
          ${c.linkedinUrl ? `<div style="display: flex; align-items: center; gap: 4px;"><span>🔗</span><a href="${escapeHtml(c.linkedinUrl)}" style="color: #111827; text-decoration: none;">LinkedIn</a></div>` : ""}
          ${c.githubUrl ? `<div style="display: flex; align-items: center; gap: 4px;"><span>💻</span><a href="${escapeHtml(c.githubUrl)}" style="color: #111827; text-decoration: none;">GitHub</a></div>` : ""}
        </div>
      </div>
    </header>

    <div class="header-divider" style="border-top: 1.5px solid #000000; margin: 6pt 0 8pt 0;"></div>

    ${
      resume.tailoredSummary
        ? `<section style="margin-bottom: 5pt;">
      <h2 style="font-size: 10.5pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: #000000; border-bottom: 1.5px solid #000000; padding-bottom: 3.5pt; margin-top: 9pt; margin-bottom: 5.5pt;">
        ${summaryTitle}
      </h2>
      <div class="summary-text" style="font-size: 9pt; color: #000000; line-height: 1.38; text-align: justify;">
        ${escapeHtml(resume.tailoredSummary)}
      </div>
    </section>`
        : ""
    }

    ${
      activeEdu.length > 0
        ? `<section style="margin-bottom: 5pt;">
      <h2 style="font-size: 10.5pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: #000000; border-bottom: 1.5px solid #000000; padding-bottom: 3.5pt; margin-top: 9pt; margin-bottom: 5.5pt;">
        Education
      </h2>
      ${activeEdu
        .map(
          (edu) => `
        <div class="education-item" style="margin-top: 2.5pt; margin-bottom: 3pt;">
          <div class="item-header" style="display: flex; justify-content: space-between; font-size: 9.5pt; font-weight: 700; color: #000000;">
            <span>${escapeHtml(edu.degree || edu.institution)}</span>
            ${(edu.startDate || edu.endDate) ? `<span style="font-weight: normal; font-size: 8.5pt;">${escapeHtml([edu.startDate, edu.endDate || "Present"].filter(Boolean).join(" – "))}</span>` : ""}
          </div>
          <div class="item-sub" style="display: flex; justify-content: space-between; font-size: 9pt; color: #1f2937;">
            <span>${escapeHtml(edu.institution)}${edu.fieldOfStudy ? ` • ${escapeHtml(edu.fieldOfStudy)}` : ""}</span>
            ${edu.honors ? `<span>${escapeHtml(edu.honors)}</span>` : ""}
          </div>
        </div>`
        )
        .join("")}
    </section>`
        : ""
    }

    ${
      resume.tailoredExperiences.length > 0
        ? `<section style="margin-bottom: 5pt;">
      <h2 style="font-size: 10.5pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: #000000; border-bottom: 1.5px solid #000000; padding-bottom: 3.5pt; margin-top: 9pt; margin-bottom: 5.5pt;">
        ${expTitle}
      </h2>
      ${resume.tailoredExperiences
        .map(
          (exp) => `
        <div class="experience-item" style="margin-top: 3pt; margin-bottom: 4pt;">
          <div class="item-header" style="display: flex; justify-content: space-between; font-size: 9.5pt; font-weight: 700; color: #000000;">
            <span>${escapeHtml(exp.role)}</span>
          </div>
          <div class="item-sub" style="display: flex; justify-content: space-between; font-size: 8.5pt; font-style: italic; color: #374151; margin-bottom: 2pt;">
            <span>${escapeHtml(exp.company)} | ${exp.startDate?.slice(0, 4) || exp.endDate?.slice(0, 4) || "2026"}</span>
            <span>${escapeHtml(exp.location || "")}</span>
          </div>
          <ul style="margin: 1.5pt 0 4pt 0; padding-left: 14pt;">
            ${exp.bullets.map((b) => `<li style="font-size: 9pt; color: #000000; line-height: 1.36; margin-bottom: 1.5pt;">${escapeHtml(b.content)}</li>`).join("\n            ")}
          </ul>
        </div>`
        )
        .join("")}
    </section>`
        : ""
    }

    ${
      Object.keys(categorizedSkills).length > 0
        ? `<section style="margin-bottom: 5pt;">
      <h2 style="font-size: 10.5pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: #000000; border-bottom: 1.5px solid #000000; padding-bottom: 3.5pt; margin-top: 9pt; margin-bottom: 5.5pt;">
        ${skillsTitle}
      </h2>
      <div class="skills-list">
        <ul style="margin: 1.5pt 0 4pt 0; padding-left: 14pt;">
          ${Object.entries(categorizedSkills)
            .map(
              ([cat, skills]) => `
            <li class="skills-category-row" style="font-size: 9pt; color: #000000; line-height: 1.36; margin-bottom: 1.5pt;">
              <strong style="color: #000000;">${escapeHtml(cat)}:</strong> ${escapeHtml(skills.join(", "))}
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
        ? `<section style="margin-bottom: 5pt;">
      <h2 style="font-size: 10.5pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: #000000; border-bottom: 1.5px solid #000000; padding-bottom: 3.5pt; margin-top: 9pt; margin-bottom: 5.5pt;">
        TESDA Trainings and Certificates
      </h2>
      <ul style="margin: 1.5pt 0 4pt 0; padding-left: 14pt;">
        ${activeCerts
          .map(
            (cert) => `
          <li style="font-size: 9pt; color: #000000; line-height: 1.36; margin-bottom: 1.5pt;">
            ${escapeHtml(cert.name)}${cert.issuer ? ` – ${escapeHtml(cert.issuer)}` : ""}${cert.hours ? ` | ${escapeHtml(cert.hours)}` : ""}${cert.issueDate ? ` • Completed: ${escapeHtml(cert.issueDate)}` : ""}
          </li>`
          )
          .join("")}
      </ul>
    </section>`
        : ""
    }

    ${
      resume.tailoredProjects && resume.tailoredProjects.length > 0
        ? `<section style="margin-bottom: 5pt;">
      <h2 style="font-size: 10.5pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: #000000; border-bottom: 1.5px solid #000000; padding-bottom: 3.5pt; margin-top: 9pt; margin-bottom: 5.5pt;">
        Technical Projects
      </h2>
      ${resume.tailoredProjects
        .slice(0, resume.pageBudget === "1_page" ? 1 : undefined)
        .map(
          (p) => `
        <div class="project-item" style="margin-top: 3pt; margin-bottom: 4pt;">
          <div class="item-header" style="display: flex; justify-content: space-between; font-size: 9.5pt; font-weight: 700; color: #000000;">
            <span>${escapeHtml(p.name)}</span>
            <span style="font-weight: normal; font-size: 8.5pt;">${escapeHtml(p.technologies.join(", "))}</span>
          </div>
          ${p.description ? `<div style="font-size: 8.5pt; color: #374151; margin-bottom: 2pt;">${escapeHtml(p.description)}</div>` : ""}
          ${
            p.bullets.length > 0
              ? `<ul style="margin: 1.5pt 0 4pt 0; padding-left: 14pt;">
            ${p.bullets.map((b) => `<li style="font-size: 9pt; color: #000000; line-height: 1.36; margin-bottom: 1.5pt;">${escapeHtml(b.content)}</li>`).join("\n            ")}
          </ul>`
              : ""
          }
        </div>`
        )
        .join("")}
    </section>`
        : ""
    }
  </div>
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
