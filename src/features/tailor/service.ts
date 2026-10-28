import crypto from "crypto";
import { z } from "zod";
import { AppError } from "@/lib/errors";
import { nowIso } from "@/lib/dates";
import { invokeBedrockJson } from "@/lib/bedrock";
import { Profile, WorkExperience, Project, SkillItem } from "@/features/profile/schema";
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
    skills: SkillItem[];
  }): string {
    const { profile, summary, experiences, projects, skills } = params;
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

    let projSec = `## Technical Projects\n`;
    for (const p of projects) {
      projSec += `### ${p.name} (${p.technologies.join(", ")})\n${p.description}\n`;
      for (const b of p.bullets) {
        projSec += `- ${b.content}\n`;
      }
      projSec += `\n`;
    }

    const skillsSec = `## Core Competencies\n${skills.map((s) => s.name).join(", ")}\n`;

    return header + summarySec + expSec + projSec + skillsSec;
  }

  private fallbackParseJd(raw: string): ExtractedJd {
    const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
    const company = lines[0] && lines[0].length < 60 ? lines[0] : "Target Tech Inc.";
    const role = lines[1] && lines[1].length < 80 ? lines[1] : "Senior Full-Stack Engineer";

    const commonSkills = ["TypeScript", "React", "Next.js", "Node.js", "AWS", "DynamoDB", "Docker", "REST APIs", "CI/CD"];
    const detected: string[] = [];
    const lower = raw.toLowerCase();

    for (const s of commonSkills) {
      if (lower.includes(s.toLowerCase())) {
        detected.push(s);
      }
    }

    return {
      company,
      role,
      location: "San Francisco, CA / Remote",
      extractedSkills: detected.length > 0 ? detected : ["TypeScript", "React", "AWS"],
      mustHaves: ["5+ years of software development experience", "Strong background in distributed cloud architectures"],
      niceToHaves: ["Experience with Next.js 15 and serverless deployments"],
    };
  }
}

function escapeRegex(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const tailorService = new TailorService();
