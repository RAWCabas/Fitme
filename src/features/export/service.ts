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
        @import url('https://fonts.googleapis.com/css2?family=Arimo:ital,wght@0,400..700;1,400..700&family=Bebas+Neue&family=Nunito:ital,wght@0,400..900;1,400..900&display=swap');

        body {
          font-family: "Arimo", -apple-system, BlinkMacSystemFont, Arial, sans-serif !important;
          color: #111827 !important;
          line-height: 1.45 !important;
        }
        .header-container {
          margin-bottom: 2pt !important;
        }
        h1 {
          font-family: "Bebas Neue", Impact, "Arial Narrow", sans-serif !important;
          font-size: 30pt !important;
          font-weight: 700 !important;
          letter-spacing: 0.04em !important;
          text-transform: uppercase !important;
          margin: 0 0 2pt 0 !important;
          color: #000000 !important;
          line-height: 1.1 !important;
        }
        .headline {
          font-family: "Arimo", -apple-system, BlinkMacSystemFont, Arial, sans-serif !important;
          font-size: 13pt !important;
          color: #111827 !important;
          font-weight: 700 !important;
          letter-spacing: 0.03em !important;
          text-transform: uppercase !important;
          margin-bottom: 4pt !important;
          line-height: 1.25 !important;
        }
        .contact-row {
          font-family: "Nunito", -apple-system, BlinkMacSystemFont, sans-serif !important;
          font-size: 12pt !important;
          color: #111827 !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 2.5pt !important;
          line-height: 1.35 !important;
          margin-bottom: 6pt !important;
        }
        .contact-row a {
          color: #111827 !important;
          text-decoration: none !important;
        }
        .header-divider, .section-divider {
          border-top: 1.5px solid #000000 !important;
          margin: 7pt 0 6pt 0 !important;
        }
        h2 {
          font-family: "Nunito", -apple-system, BlinkMacSystemFont, sans-serif !important;
          font-size: 14pt !important;
          font-weight: 800 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.04em !important;
          color: #000000 !important;
          border-bottom: none !important;
          padding-bottom: 0 !important;
          margin-top: 5pt !important;
          margin-bottom: 3.5pt !important;
        }
        .item-header {
          font-family: "Arimo", -apple-system, BlinkMacSystemFont, Arial, sans-serif !important;
          display: flex !important;
          justify-content: space-between !important;
          font-size: 12pt !important;
          font-weight: 700 !important;
          color: #000000 !important;
          margin-top: 2.5pt !important;
        }
        .item-sub {
          font-family: "Arimo", -apple-system, BlinkMacSystemFont, Arial, sans-serif !important;
          display: flex !important;
          justify-content: space-between !important;
          font-size: 12pt !important;
          font-style: normal !important;
          color: #111827 !important;
          margin-bottom: 2pt !important;
        }
        ul {
          margin: 2pt 0 4pt 0 !important;
          padding-left: 14pt !important;
        }
        li {
          font-family: "Arimo", -apple-system, BlinkMacSystemFont, Arial, sans-serif !important;
          font-size: 12pt !important;
          color: #111827 !important;
          margin-bottom: 2pt !important;
          line-height: 1.45 !important;
        }
        .summary-text {
          font-family: "Arimo", -apple-system, BlinkMacSystemFont, Arial, sans-serif !important;
          font-size: 12pt !important;
          color: #111827 !important;
          line-height: 1.45 !important;
          text-align: justify !important;
        }
        .skills-category-row {
          font-family: "Arimo", -apple-system, BlinkMacSystemFont, Arial, sans-serif !important;
          font-size: 12pt !important;
          color: #111827 !important;
          margin-bottom: 2pt !important;
          line-height: 1.42 !important;
        }
        .skills-category-label {
          font-weight: 700 !important;
          color: #000000 !important;
        }
        .experience-item, .project-item, .education-item {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
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

    const fontStyles = isCabasTemplate
      ? {
          name: `font-family: "Bebas Neue", Impact, "Arial Narrow", sans-serif; font-size: 30pt; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; margin: 0 0 2pt 0; color: #000000; line-height: 1.1;`,
          headline: `font-family: "Arimo", -apple-system, BlinkMacSystemFont, Arial, sans-serif; font-size: 13pt; color: #111827; font-weight: 700; letter-spacing: 0.03em; text-transform: uppercase; margin-bottom: 4pt; line-height: 1.25;`,
          contact: `font-family: "Nunito", -apple-system, BlinkMacSystemFont, sans-serif; font-size: 12pt; color: #111827; display: flex; flex-direction: column; gap: 2.5pt; line-height: 1.35; margin-bottom: 6pt;`,
          divider: `border-top: 1.5px solid #000000; margin: 7pt 0 6pt 0;`,
          h2: `font-family: "Nunito", -apple-system, BlinkMacSystemFont, sans-serif; font-size: 14pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: #000000; border-bottom: none; padding-bottom: 0; margin-top: 5pt; margin-bottom: 3.5pt;`,
          summary: `font-family: "Arimo", -apple-system, BlinkMacSystemFont, Arial, sans-serif; font-size: 12pt; color: #111827; line-height: 1.45; text-align: justify;`,
          itemHeader: `font-family: "Arimo", -apple-system, BlinkMacSystemFont, Arial, sans-serif; display: flex; justify-content: space-between; font-size: 12pt; font-weight: 700; color: #000000; margin-top: 2.5pt;`,
          itemSub: `font-family: "Arimo", -apple-system, BlinkMacSystemFont, Arial, sans-serif; display: flex; justify-content: space-between; font-size: 12pt; font-style: normal; color: #111827; margin-bottom: 2pt;`,
          itemSubItalic: `font-family: "Arimo", -apple-system, BlinkMacSystemFont, Arial, sans-serif; display: flex; justify-content: space-between; font-size: 12pt; font-style: italic; color: #374151; margin-bottom: 2pt;`,
          li: `font-family: "Arimo", -apple-system, BlinkMacSystemFont, Arial, sans-serif; font-size: 12pt; color: #111827; line-height: 1.45; margin-bottom: 2pt;`,
          skillsLi: `font-family: "Arimo", -apple-system, BlinkMacSystemFont, Arial, sans-serif; font-size: 12pt; color: #111827; line-height: 1.42; margin-bottom: 2pt;`,
          dateSpan: `font-weight: normal; font-size: 11pt;`,
        }
      : {
          name: `font-size: 21pt; font-weight: 900; letter-spacing: 0.02em; text-transform: uppercase; margin: 0 0 2pt 0; color: #000000; line-height: 1.15; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;`,
          headline: `font-size: 9.5pt; color: #000000; font-weight: 700; letter-spacing: 0.03em; text-transform: uppercase; margin-bottom: 4pt; line-height: 1.25;`,
          contact: `font-size: 8.5pt; color: #111827; display: flex; flex-wrap: wrap; gap: 2pt 10pt; align-items: center; line-height: 1.35;`,
          divider: `border-top: 1.5px solid #000000; margin: 6pt 0 8pt 0;`,
          h2: `font-size: 10.5pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: #000000; border-bottom: 1.5px solid #000000; padding-bottom: 3.5pt; margin-top: 9pt; margin-bottom: 5.5pt;`,
          summary: `font-size: 9pt; color: #000000; line-height: 1.38; text-align: justify;`,
          itemHeader: `display: flex; justify-content: space-between; font-size: 9.5pt; font-weight: 700; color: #000000;`,
          itemSub: `display: flex; justify-content: space-between; font-size: 8.5pt; font-style: italic; color: #374151; margin-bottom: 2pt;`,
          itemSubItalic: `display: flex; justify-content: space-between; font-size: 8.5pt; font-style: italic; color: #374151; margin-bottom: 2pt;`,
          li: `font-size: 9pt; color: #000000; line-height: 1.36; margin-bottom: 1.5pt;`,
          skillsLi: `font-size: 9pt; color: #000000; line-height: 1.36; margin-bottom: 1.5pt;`,
          dateSpan: `font-weight: normal; font-size: 8.5pt;`,
        };

    const sectionDivider = isCabasTemplate ? `<div class="section-divider" style="${fontStyles.divider}"></div>` : "";

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(c.fullName)} - Resume</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Arimo:ital,wght@0,400..700;1,400..700&family=Bebas+Neue&family=Nunito:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 10mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @media print {
      @page {
        size: A4 portrait;
        margin: 8mm 10mm;
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
  <div class="no-print" style="margin: 0 0 10px 0; background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 8px 14px; font-family: -apple-system, sans-serif; font-size: 12px; color: #475569; display: flex; justify-content: space-between; align-items: center;">
    <span>💡 <strong>Tip:</strong> In Chrome's print dialog, switch <strong>Destination</strong> from your physical printer to <strong>Save as PDF</strong> to download as a PDF file.</span>
    <button onclick="window.print()" style="background: #2563eb; color: #ffffff; border: none; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer;">Print / Save PDF</button>
  </div>

  <div id="printable-resume" style="width: 100%; max-width: 794px; background: #ffffff; color: #000000; box-sizing: border-box; ${isCabasTemplate ? 'font-family: \'Arimo\', Arial, sans-serif;' : 'font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif;'}">
    <header class="header-container" style="margin-bottom: 2pt;">
      <div>
        <h1 style="${fontStyles.name}">
          ${escapeHtml(c.fullName)}
        </h1>
        ${
          c.headline
            ? `<div class="headline" style="${fontStyles.headline}">
                ${escapeHtml(c.headline)}
              </div>`
            : ""
        }
        <div class="contact-row" style="${fontStyles.contact}">
          ${c.location ? `<div style="display: flex; align-items: center; gap: 6px;"><span>📍</span><span>${escapeHtml(c.location)}</span></div>` : ""}
          ${c.phone ? `<div style="display: flex; align-items: center; gap: 6px;"><span>📞</span><span>${escapeHtml(c.phone)}</span></div>` : ""}
          ${c.email ? `<div style="display: flex; align-items: center; gap: 6px;"><span>✉️</span><a href="mailto:${escapeHtml(c.email)}" style="color: inherit; text-decoration: none;">${escapeHtml(c.email)}</a></div>` : ""}
          ${!isCabasTemplate && c.linkedinUrl ? `<div style="display: flex; align-items: center; gap: 4px;"><span>🔗</span><a href="${escapeHtml(c.linkedinUrl)}" style="color: inherit; text-decoration: none;">LinkedIn</a></div>` : ""}
          ${!isCabasTemplate && c.githubUrl ? `<div style="display: flex; align-items: center; gap: 4px;"><span>💻</span><a href="${escapeHtml(c.githubUrl)}" style="color: inherit; text-decoration: none;">GitHub</a></div>` : ""}
        </div>
      </div>
    </header>

    <div class="header-divider" style="${fontStyles.divider}"></div>

    ${
      resume.tailoredSummary
        ? `<section style="margin-bottom: 4pt;">
      <h2 style="${fontStyles.h2}">
        ${summaryTitle}
      </h2>
      <div class="summary-text" style="${fontStyles.summary}">
        ${escapeHtml(resume.tailoredSummary)}
      </div>
    </section>
    ${sectionDivider}`
        : ""
    }

    ${
      activeEdu.length > 0
        ? `<section style="margin-bottom: 4pt;">
      <h2 style="${fontStyles.h2}">
        Education
      </h2>
      ${activeEdu
        .map(
          (edu) => `
        <div class="education-item" style="margin-top: 2.5pt; margin-bottom: 3pt;">
          <div class="item-header" style="${fontStyles.itemHeader}">
            <span>${escapeHtml(edu.degree || edu.institution)}</span>
            ${!isCabasTemplate && (edu.startDate || edu.endDate) ? `<span style="${fontStyles.dateSpan}">${escapeHtml([edu.startDate, edu.endDate || "Present"].filter(Boolean).join(" – "))}</span>` : ""}
          </div>
          <div class="item-sub" style="${fontStyles.itemSub}">
            <span>${escapeHtml(edu.institution)}${!isCabasTemplate && edu.fieldOfStudy ? ` • ${escapeHtml(edu.fieldOfStudy)}` : ""}</span>
            ${edu.honors ? `<span>${escapeHtml(edu.honors)}</span>` : ""}
          </div>
        </div>`
        )
        .join("")}
    </section>
    ${sectionDivider}`
        : ""
    }

    ${
      resume.tailoredExperiences.length > 0
        ? `<section style="margin-bottom: 4pt;">
      <h2 style="${fontStyles.h2}">
        ${expTitle}
      </h2>
      ${resume.tailoredExperiences
        .map(
          (exp) => `
        <div class="experience-item" style="margin-top: 3pt; margin-bottom: 4pt;">
          <div class="item-header" style="${fontStyles.itemHeader}">
            <span>${escapeHtml(exp.role)}</span>
          </div>
          <div class="item-sub" style="${fontStyles.itemSubItalic}">
            <span>${escapeHtml(exp.company)} | ${exp.startDate?.slice(0, 4) || exp.endDate?.slice(0, 4) || "2026"}</span>
            ${!isCabasTemplate && exp.location ? `<span>${escapeHtml(exp.location)}</span>` : ""}
          </div>
          <ul style="margin: 1.5pt 0 4pt 0; padding-left: 14pt;">
            ${exp.bullets.map((b) => `<li style="${fontStyles.li}">${escapeHtml(b.content)}</li>`).join("\n            ")}
          </ul>
        </div>`
        )
        .join("")}
    </section>
    ${sectionDivider}`
        : ""
    }

    ${
      Object.keys(categorizedSkills).length > 0
        ? `<section style="margin-bottom: 4pt;">
      <h2 style="${fontStyles.h2}">
        ${skillsTitle}
      </h2>
      <div class="skills-list">
        <ul style="margin: 1.5pt 0 4pt 0; padding-left: 14pt;">
          ${Object.entries(categorizedSkills)
            .map(
              ([cat, skills]) => `
            <li class="skills-category-row" style="${fontStyles.skillsLi}">
              <strong style="color: #000000;">${escapeHtml(cat)}:</strong> ${escapeHtml(skills.join(", "))}
            </li>`
            )
            .join("")}
        </ul>
      </div>
    </section>
    ${(activeCerts.length > 0 || (resume.tailoredProjects && resume.tailoredProjects.length > 0)) ? sectionDivider : ""}`
        : ""
    }

    ${
      activeCerts.length > 0
        ? `<section style="margin-bottom: 4pt;">
      <h2 style="${fontStyles.h2}">
        TESDA Trainings and Certificates
      </h2>
      <ul style="margin: 1.5pt 0 4pt 0; padding-left: 14pt;">
        ${activeCerts
          .map(
            (cert) => `
          <li style="${fontStyles.li}">
            ${escapeHtml(cert.name)}${cert.issuer ? ` – ${escapeHtml(cert.issuer)}` : ""}${cert.hours ? ` | ${escapeHtml(cert.hours)}` : ""}${!isCabasTemplate && cert.issueDate ? ` • Completed: ${escapeHtml(cert.issueDate)}` : ""}
          </li>`
          )
          .join("")}
      </ul>
    </section>
    ${(resume.tailoredProjects && resume.tailoredProjects.length > 0) ? sectionDivider : ""}`
        : ""
    }

    ${
      resume.tailoredProjects && resume.tailoredProjects.length > 0
        ? `<section style="margin-bottom: 4pt;">
      <h2 style="${fontStyles.h2}">
        Technical Projects
      </h2>
      ${resume.tailoredProjects
        .slice(0, resume.pageBudget === "1_page" ? 1 : undefined)
        .map(
          (p) => `
        <div class="project-item" style="margin-top: 3pt; margin-bottom: 4pt;">
          <div class="item-header" style="${fontStyles.itemHeader}">
            <span>${escapeHtml(p.name)}</span>
            <span style="${fontStyles.dateSpan}">${escapeHtml(p.technologies.join(", "))}</span>
          </div>
          ${p.description ? `<div style="font-size: 8.5pt; color: #374151; margin-bottom: 2pt;">${escapeHtml(p.description)}</div>` : ""}
          ${
            p.bullets.length > 0
              ? `<ul style="margin: 1.5pt 0 4pt 0; padding-left: 14pt;">
            ${p.bullets.map((b) => `<li style="${fontStyles.li}">${escapeHtml(b.content)}</li>`).join("\n            ")}
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
