import crypto from "crypto";
import { z } from "zod";
import { AppError } from "@/lib/errors";
import { nowIso } from "@/lib/dates";
import { invokeBedrockJson } from "@/lib/bedrock";
import { Profile, WorkExperience, Project, Certification, SkillItem } from "@/features/profile/schema";
import { profileService as defaultProfileService, ProfileService } from "@/features/profile/service";
import { getTailorRepo } from "./repo";
import { 
  JobOpportunity, 
  jobOpportunitySchema, 
  TailoredResume, 
  tailoredResumeSchema, 
  FitScore, 
  KeywordMatch, 
  PageBudget, 
  TypographyPreset, 
  ResumeStatus 
} from "./schema";

const extractedJdSchema = z.object({
  company: z.string(),
  role: z.string(),
  location: z.string(),
  extractedSkills: z.array(z.string()),
  mustHaves: z.array(z.string()),
  niceToHaves: z.array(z.string()),
});

type ExtractedJd = z.infer<typeof extractedJdSchema>;

export class TailorService {
  constructor(
    private repo = getTailorRepo(),
    private profService: ProfileService = defaultProfileService
  ) {}

  /**
   * Parses a raw job description using Amazon Bedrock or heuristic fallback.
   */
  async parseJobDescription(userId: string, rawDescription: string, sourceUrl = ""): Promise<JobOpportunity> {
    if (!userId) throw AppError.unauthorized();
    if (!rawDescription || rawDescription.trim().length < 10) {
      throw AppError.badRequest("Please provide a valid job description (at least 10 characters)");
    }

    const systemPrompt = `You are an expert technical recruiter and job description analyzer.
Extract the company name, role title, location, required hard skills, must-have requirements, and nice-to-have qualifications from the job description.
Return ONLY a valid JSON object matching the requested schema.`;

    const extracted = await invokeBedrockJson<ExtractedJd>({
      systemPrompt,
      userPrompt: `Analyze this Job Description:\n\n${rawDescription}`,
      schema: extractedJdSchema,
      fallbackGenerator: () => this.fallbackParseJd(rawDescription),
    });

    const job: JobOpportunity = {
      id: crypto.randomUUID(),
      userId,
      company: extracted.company || "Target Company",
      role: extracted.role || "Software Engineer",
      location: extracted.location || "",
      sourceUrl,
      rawDescription,
      extractedSkills: extracted.extractedSkills || [],
      mustHaves: extracted.mustHaves || [],
      niceToHaves: extracted.niceToHaves || [],
      createdAt: nowIso(),
    };

    const validated = jobOpportunitySchema.parse(job);
    return await this.repo.saveJobOpportunity(validated);
  }

  /**
   * Calculates the ATS Fit Score and Keyword Match Breakdown.
   */
  calculateFitScore(profile: Profile, job: JobOpportunity): FitScore {
    // Collect candidate's visible skills
    const candidateSkills = new Set(
      profile.skills.filter((s) => !s.isHidden).map((s) => s.name.toLowerCase().trim())
    );

    // Collect technologies from visible projects
    profile.projects
      .filter((p) => !p.isHidden)
      .forEach((p) => {
        p.technologies.forEach((t) => candidateSkills.add(t.toLowerCase().trim()));
      });

    // Collect experience text for contextual/transferable matches
    const experienceCorpus = profile.experiences
      .filter((e) => !e.isHidden)
      .flatMap((e) => e.bullets.filter((b) => !b.isHidden).map((b) => b.content.toLowerCase()))
      .join(" ");

    // Collect certifications
    (profile.certifications || [])
      .filter((c) => !c.isHidden)
      .forEach((c) => {
        candidateSkills.add(c.name.toLowerCase().trim());
        if (c.issuer) candidateSkills.add(c.issuer.toLowerCase().trim());
        if (c.hours) candidateSkills.add(c.hours.toLowerCase().trim());
      });

    const keywords: KeywordMatch[] = [];
    let matchedCount = 0;
    let transferableCount = 0;
    let missingCount = 0;

    // Use extractedSkills or mustHaves as keyword targets
    const targetKeywords = job.extractedSkills.length > 0
      ? job.extractedSkills
      : ["TypeScript", "React", "Cloud Architecture", "API Design", "Agile"];

    for (const kw of targetKeywords) {
      const lower = kw.toLowerCase().trim();
      const occurrencesInJD = (job.rawDescription.toLowerCase().match(new RegExp(`\\b${escapeRegex(lower)}\\b`, "g")) || []).length || 1;

      if (candidateSkills.has(lower)) {
        matchedCount++;
        keywords.push({
          keyword: kw,
          status: "matched",
          occurrencesInJD,
          notes: "Direct match in your skills inventory.",
        });
      } else if (experienceCorpus.includes(lower)) {
        transferableCount++;
        keywords.push({
          keyword: kw,
          status: "transferable",
          occurrencesInJD,
          notes: "Mentioned contextually within your work experiences.",
        });
      } else {
        missingCount++;
        keywords.push({
          keyword: kw,
          status: "missing",
          occurrencesInJD,
          notes: "Not explicitly detected in your master vault.",
        });
      }
    }

    const totalKeywords = targetKeywords.length || 1;
    const rawScore = ((matchedCount * 1.0 + transferableCount * 0.5) / totalKeywords) * 100;
    const score = Math.min(100, Math.max(0, Math.round(rawScore)));

    let summaryEvaluation = "";
    if (score >= 80) {
      summaryEvaluation = `Strong Match (${score}%): Your experience closely aligns with the required core stack. Minor additions can maximize ATS pass-through.`;
    } else if (score >= 50) {
      summaryEvaluation = `Moderate Match (${score}%): You possess several transferable skills, but key requirements like ${keywords.filter((k) => k.status === "missing").slice(0, 2).map((k) => k.keyword).join(", ")} should be emphasized.`;
    } else {
      summaryEvaluation = `Growth Fit (${score}%): Significant keyword gaps detected. Consider emphasizing transferable architectural experience.`;
    }

    return {
      score,
      matchedCount,
      missingCount,
      keywords,
      summaryEvaluation,
    };
  }

  /**
   * Generates a tailored resume version matching the target Job Opportunity.
   */
  async tailorResume(
    userId: string,
    jobId: string,
    pageBudget: PageBudget = "1_page",
    preset: TypographyPreset = "modern_standard"
  ): Promise<TailoredResume> {
    const profile = await this.profService.getOrCreateProfile(userId);
    const job = await this.repo.getJobOpportunity(userId, jobId);
    if (!job) throw AppError.notFound("Job opportunity not found");

    // 1. Calculate ATS Fit Score
    const fitScore = this.calculateFitScore(profile, job);

    // 2. Filter out items where isHidden === true
    const activeExperiences = profile.experiences.filter((e) => !e.isHidden);
    const activeProjects = profile.projects.filter((p) => !p.isHidden);
    const activeCertifications = (profile.certifications || []).filter((c) => !c.isHidden);
    const activeSkills = profile.skills.filter((s) => !s.isHidden);

    // 3. Page Budget Curation
    const maxRoles = pageBudget === "1_page" ? 3 : 6;
    const maxBulletsPerRole = pageBudget === "1_page" ? 3 : 5;
    const maxProjects = pageBudget === "1_page" ? 2 : 4;

    const curatedExperiences: WorkExperience[] = activeExperiences.slice(0, maxRoles).map((exp) => ({
      ...exp,
      bullets: exp.bullets
        .filter((b) => !b.isHidden)
        .slice(0, maxBulletsPerRole)
        .map((b) => ({
          ...b,
          // Boost bullet phrasing to align with JD keywords
          content: this.tailorBulletText(b.content, job),
          hasMetrics: true,
        })),
    }));

    const curatedProjects: Project[] = activeProjects.slice(0, maxProjects).map((proj) => ({
      ...proj,
      bullets: proj.bullets.filter((b) => !b.isHidden),
    }));

    // Prioritize skills that match the target JD
    const sortedSkills: SkillItem[] = [...activeSkills].sort((a, b) => {
      const aMatched = fitScore.keywords.some((k) => k.keyword.toLowerCase() === a.name.toLowerCase() && k.status === "matched");
      const bMatched = fitScore.keywords.some((k) => k.keyword.toLowerCase() === b.name.toLowerCase() && k.status === "matched");
      if (aMatched && !bMatched) return -1;
      if (!aMatched && bMatched) return 1;
      return 0;
    });

    // 4. Draft Tailored Summary
    const tailoredSummary = `Results-oriented ${job.role} with demonstrated expertise in ${job.extractedSkills.slice(0, 3).join(", ") || "scalable software engineering"}. Proven track record of delivering high-impact solutions, optimizing system performance, and architecting resilient applications aligned with ${job.company}'s mission.`;

    // 5. Versioning
    const previousVersions = await this.repo.listTailoredResumes(userId, jobId);
    const versionNumber = previousVersions.length + 1;

    // 6. Generate Markdown representation
    const markdownContent = this.generateMarkdown({
      profile,
      summary: tailoredSummary,
      experiences: curatedExperiences,
      projects: curatedProjects,
      certifications: activeCertifications,
      skills: sortedSkills,
    });

    const tailoredResume: TailoredResume = {
      id: crypto.randomUUID(),
      userId,
      jobOpportunityId: jobId,
      versionNumber,
      status: "draft",
      preset,
      pageBudget,
      fitScore,
      tailoredSummary,
      tailoredExperiences: curatedExperiences,
      tailoredProjects: curatedProjects,
      tailoredCertifications: activeCertifications,
      selectedSkills: sortedSkills,
      pdfS3Key: null,
      pdfPresignedUrl: null,
      markdownContent,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    const validated = tailoredResumeSchema.parse(tailoredResume);
    return await this.repo.saveTailoredResume(validated);
  }

  /**
   * Boosts a weak bullet point into the Google XYZ formula:
   * "Accomplished [X] as measured by [Y] by doing [Z]"
   */
  async boostBulletWithMetrics(bullet: string, metricsContext: string): Promise<string> {
    if (!bullet.trim()) throw AppError.badRequest("Bullet cannot be empty");

    const systemPrompt = `You are a resume enhancement coach specializing in Google's XYZ formula:
"Accomplished [X] as measured by [Y] by doing [Z]".
Rewrite the provided bullet point into a punchy, metric-driven statement incorporating the user's provided numbers/context.
Start with a strong action verb (e.g. Engineered, Spearheaded, Architected, Accelerated). Return ONLY the rewritten bullet string.`;

    try {
      const response = await invokeBedrockJson({
        systemPrompt,
        userPrompt: `Original Bullet: "${bullet}"\nMetrics & Impact Context: "${metricsContext}"`,
        schema: z.object({ boostedBullet: z.string() }),
        fallbackGenerator: () => ({
          boostedBullet: `Architected and optimized core service, improving performance by ${metricsContext || "30%"} through targeted refactoring.`,
        }),
      });

      return response.boostedBullet;
    } catch {
      return `Spearheaded core feature implementation, delivering ${metricsContext || "measurable gains"} while adhering to best practices.`;
    }
  }

  /**
   * Updates the lifecycle status of a tailored resume.
   */
  async updateResumeStatus(userId: string, id: string, status: ResumeStatus): Promise<TailoredResume> {
    return await this.repo.updateResumeStatus(userId, id, status);
  }

  private tailorBulletText(original: string, job: JobOpportunity): string {
    // If the bullet already has strong metrics, preserve it
    if (/\d+%|\$\d+|\d+x/i.test(original)) {
      return original;
    }
    const targetSkill = job.extractedSkills[0];
    if (targetSkill && !original.toLowerCase().includes(targetSkill.toLowerCase())) {
      return `${original}, leveraging ${targetSkill} for enhanced reliability`;
    }
    return original;
  }

  private generateMarkdown(params: {
    profile: Profile;
    summary: string;
    experiences: WorkExperience[];
    projects: Project[];
    certifications?: Certification[];
    skills: SkillItem[];
  }): string {
    const { profile, summary, experiences, projects, certifications, skills } = params;
    const c = profile.contact;

    const header = `# ${c.fullName}\n${c.headline ? `*${c.headline}*\n` : ""}${c.email} | ${c.phone} | ${c.location}\n${c.linkedinUrl} | ${c.githubUrl}\n\n`;
    const summarySec = `## Professional Summary\n${summary}\n\n`;

    let expSec = `## Work Experience\n`;
    for (const exp of experiences) {
      expSec += `### ${exp.role} — ${exp.company}\n*${exp.startDate || "N/A"} – ${exp.endDate || "Present"} | ${exp.location}*\n`;
      for (const b of exp.bullets) {
        expSec += `- ${b.content}\n`;
      }
      expSec += `\n`;
    }

    let projSec = "";
    if (projects.length > 0) {
      projSec = `## Technical Projects\n`;
      for (const p of projects) {
        projSec += `### ${p.name} (${p.technologies.join(", ")})\n${p.description}\n`;
        for (const b of p.bullets) {
          projSec += `- ${b.content}\n`;
        }
        projSec += `\n`;
      }
    }

    let certSec = "";
    if (certifications && certifications.length > 0) {
      certSec = `## Trainings and Certificates\n`;
      for (const cert of certifications) {
        certSec += `- ${cert.name}${cert.issuer ? ` – ${cert.issuer}` : ""}${cert.hours ? ` | ${cert.hours}` : ""}\n`;
      }
      certSec += `\n`;
    }

    const skillsSec = `## Core Competencies\n${skills.map((s) => s.name).join(", ")}\n`;

    return header + summarySec + expSec + projSec + certSec + skillsSec;
  }

  private fallbackParseJd(raw: string): ExtractedJd {
    const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
    const lower = raw.toLowerCase();

    // 1. Role Detection
    let role = "Technical Specialist / Engineer";
    const roleMatch = raw.match(/(?:role|position|job title|title|hiring for|looking for(?: an?|:)?)\s*[:\-–]?\s*([^\n\r,.]+)/i);
    if (roleMatch && roleMatch[1]?.trim().length > 2 && roleMatch[1].trim().length < 60) {
      role = roleMatch[1].trim();
    } else {
      const candidateRoles = [
        "Computer Engineer", "IT Technical Support", "Technical Support Specialist",
        "Systems & Network Engineer", "Network Engineer", "Hardware Support Specialist",
        "Embedded Systems Engineer", "Edge AI Specialist", "Software Engineer",
        "Frontend Developer", "Backend Developer", "Full Stack Developer", "Data Analyst"
      ];
      for (const r of candidateRoles) {
        if (lower.includes(r.toLowerCase())) {
          role = r;
          break;
        }
      }
      if (role === "Technical Specialist / Engineer" && lines[0] && lines[0].length < 60 && !lines[0].toLowerCase().includes("description")) {
        role = lines[0];
      }
    }

    // 2. Company Detection
    let company = "Target Company";
    const compMatch = raw.match(/(?:company|organization|at|about)\s*[:\-–]?\s*([A-Z][A-Za-z0-9&., ]{2,40})/);
    if (compMatch && compMatch[1]?.trim() && !compMatch[1].toLowerCase().includes("job") && !compMatch[1].toLowerCase().includes("the")) {
      company = compMatch[1].trim();
    } else if (lines.length > 1 && lines[0].length < 40 && lines[0] !== role) {
      company = lines[0];
    }

    // 3. Location Detection
    let location = "Cebu, Philippines / Remote";
    const locMatch = raw.match(/(?:location|site|based in|workplace)\s*[:\-–]?\s*([^\n\r,.]+)/i);
    if (locMatch && locMatch[1]?.trim()) {
      location = locMatch[1].trim();
    } else if (lower.includes("remote")) {
      location = "Remote";
    } else if (lower.includes("cebu")) {
      location = "Cebu, Philippines";
    }

    // 4. Comprehensive Skill Taxonomy Scanner (IT, Hardware, Networking, Software, Embedded)
    const taxonomy = [
      "Hardware Maintenance", "PC Assembly", "Hardware Diagnostics", "Peripheral Setup",
      "LAN/WAN", "TCP/IP", "Wi-Fi & Router Configuration", "Network Troubleshooting",
      "DNS", "DHCP", "VPN", "Systems Troubleshooting", "Printer/Scanner Setup",
      "Computer Systems Servicing", "Technical Support", "IT Support",
      "Windows", "Windows Server", "Linux", "Ubuntu", "MacOS",
      "Microsoft Office", "Google Workspace", "Arduino IDE", "VS Code",
      "Autodesk Fusion 360", "Adobe Photoshop", "Illustrator", "Premiere Pro",
      "Edge AI", "Embedded Programming", "Edge Impulse", "Machine Learning", "IoT", "Internet of Things",
      "Java", "C/C++", "C++", "C", "Python", "JavaScript", "TypeScript", "HTML/CSS", "HTML", "CSS", "SQL",
      "AWS", "DynamoDB", "React", "Next.js", "Node.js", "Docker", "Git", "REST APIs", "CI/CD",
      "Problem-Solving", "Troubleshooting", "Team Collaboration", "Customer Satisfaction", "Data Analysis"
    ];

    const detected: string[] = [];
    for (const skill of taxonomy) {
      const regex = new RegExp(`\\b${escapeRegex(skill)}\\b`, "i");
      if (regex.test(raw)) {
        detected.push(skill);
      }
    }

    // 5. Must-Haves Extraction (Direct from text lines or bullet points, NO FAKE 5+ YEARS!)
    const mustHaves: string[] = [];
    const niceToHaves: string[] = [];

    for (const line of lines) {
      const trimmed = line.replace(/^[•\-*–\d.)\s]+/, "").trim();
      if (trimmed.length < 15 || trimmed.length > 200) continue;
      const lowerLine = trimmed.toLowerCase();

      if (
        lowerLine.includes("experience") ||
        lowerLine.includes("proficien") ||
        lowerLine.includes("bachelor") ||
        lowerLine.includes("degree") ||
        lowerLine.includes("graduate") ||
        lowerLine.includes("knowledge") ||
        lowerLine.includes("ability to") ||
        lowerLine.includes("responsible for") ||
        lowerLine.includes("skills in") ||
        lowerLine.includes("troubleshoot") ||
        lowerLine.includes("hardware") ||
        lowerLine.includes("network")
      ) {
        if (mustHaves.length < 4 && !mustHaves.includes(trimmed)) {
          mustHaves.push(trimmed);
        } else if (niceToHaves.length < 3 && !niceToHaves.includes(trimmed)) {
          niceToHaves.push(trimmed);
        }
      }
    }

    if (mustHaves.length === 0) {
      if (detected.length > 0) {
        mustHaves.push(`Demonstrated hands-on experience or training with ${detected.slice(0, 3).join(", ")}`);
        mustHaves.push("Strong diagnostic problem-solving and technical troubleshooting capabilities");
      } else {
        mustHaves.push("Relevant education or accredited training in Computer Engineering, IT, or related field");
        mustHaves.push("Solid foundation in technical support, hardware setup, and systems diagnostics");
      }
    }

    if (niceToHaves.length === 0) {
      if (detected.length > 3) {
        niceToHaves.push(`Familiarity with ${detected.slice(3, 6).join(", ")}`);
      } else {
        niceToHaves.push("Good communication skills and ability to collaborate across technical teams");
      }
    }

    return {
      company,
      role,
      location,
      extractedSkills: detected.length > 0 ? detected : ["Hardware Diagnostics", "Troubleshooting", "Technical Support"],
      mustHaves,
      niceToHaves,
    };
  }
}

function escapeRegex(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const tailorService = new TailorService();
