import { z } from "zod";
import { AppError } from "@/lib/errors";
import { invokeBedrockJson } from "@/lib/bedrock";
import { getTailorRepo } from "@/features/tailor/repo";
import { profileService as defaultProfileService, ProfileService } from "@/features/profile/service";
import { TailoredResume, JobOpportunity } from "@/features/tailor/schema";
import { Profile } from "@/features/profile/schema";

export interface InterviewCheatSheet {
  predictedQuestions: {
    question: string;
    context: string;
    suggestedApproach: string;
  }[];
  talkingPointsForGaps: string[];
  questionsToAskInterviewer: string[];
}

const cheatSheetSchema = z.object({
  predictedQuestions: z.array(
    z.object({
      question: z.string(),
      context: z.string(),
      suggestedApproach: z.string(),
    })
  ),
  talkingPointsForGaps: z.array(z.string()),
  questionsToAskInterviewer: z.array(z.string()),
});

export class BoosterService {
  constructor(
    private getRepo = getTailorRepo,
    private profService: ProfileService = defaultProfileService
  ) {}

  private async getContext(userId: string, resumeId: string): Promise<{
    resume: TailoredResume;
    job: JobOpportunity;
    profile: Profile;
  }> {
    const repo = this.getRepo();
    const resume = await repo.getTailoredResume(userId, resumeId);
    if (!resume) throw AppError.notFound("Tailored resume not found");

    const job = await repo.getJobOpportunity(userId, resume.jobOpportunityId);
    if (!job) throw AppError.notFound("Target job opportunity not found");

    const profile = await this.profService.getOrCreateProfile(userId);
    return { resume, job, profile };
  }

  /**
   * Generates a tailored 3-paragraph Cover Letter strictly adhering to verified facts.
   */
  async generateCoverLetter(userId: string, resumeId: string): Promise<string> {
    const { resume, job, profile } = await this.getContext(userId, resumeId);

    const systemPrompt = `You are an elite executive career advisor and cover letter writer.
Write a compelling, concise 3-paragraph cover letter tailored specifically to the target company and role.
STRICT TRUTHFULNESS RULE:
- Only reference companies, job titles, technologies, and achievements that exist in the candidate's verified experiences.
- Never hallucinate unlisted employers or credentials.
Format output as a JSON object with a single string field: "coverLetter".`;

    const userPrompt = `
Candidate Name: ${profile.contact.fullName}
Target Company: ${job.company}
Target Role: ${job.role}
Job Requirements: ${job.mustHaves.join("; ")}
Candidate Summary: ${resume.tailoredSummary}
Key Experiences:
${resume.tailoredExperiences.map((e) => `- ${e.role} at ${e.company}: ${e.bullets.map((b) => b.content).join(" ")}`).join("\n")}
Candidate Skills: ${resume.selectedSkills.map((s) => s.name).join(", ")}
`;

    const response = await invokeBedrockJson<{ coverLetter: string }>({
      systemPrompt,
      userPrompt,
      schema: z.object({ coverLetter: z.string() }),
      fallbackGenerator: () => ({
        coverLetter: this.fallbackCoverLetter(profile, job, resume),
      }),
    });

    return response.coverLetter;
  }

  /**
   * Generates a concise (<100 words) high-conversion LinkedIn connection/InMail note.
   */
  async generateRecruiterOutreach(userId: string, resumeId: string): Promise<string> {
    const { resume, job, profile } = await this.getContext(userId, resumeId);

    const systemPrompt = `You are an expert technical recruiter outreach coach.
Generate a punchy, professional, and friendly LinkedIn recruiter outreach note (<100 words).
Focus on candidate's exact match with the target role and highlight their top verified achievement.
Format output as a JSON object with a single string field: "recruiterOutreach".`;

    const userPrompt = `
Candidate Name: ${profile.contact.fullName}
Target Company: ${job.company}
Target Role: ${job.role}
Top Matching Skills: ${resume.fitScore.keywords.filter((k) => k.status === "matched").map((k) => k.keyword).join(", ")}
Summary: ${resume.tailoredSummary}
`;

    const response = await invokeBedrockJson<{ recruiterOutreach: string }>({
      systemPrompt,
      userPrompt,
      schema: z.object({ recruiterOutreach: z.string() }),
      fallbackGenerator: () => ({
        recruiterOutreach: `Hi! I noticed ${job.company}'s opening for ${job.role} and wanted to connect. With hands-on experience in ${resume.selectedSkills.slice(0, 3).map((s) => s.name).join(", ")}, I've recently delivered measurable outcomes in similar distributed environments. I'd love to share my tailored resume if you're open to a brief chat!`,
      }),
    });

    return response.recruiterOutreach;
  }

  /**
   * Generates a gap-based Interview Cheat Sheet with STAR-method talking points for missing skills.
   */
  async generateInterviewCheatSheet(userId: string, resumeId: string): Promise<InterviewCheatSheet> {
    const { resume, job } = await this.getContext(userId, resumeId);

    const missingOrTransferable = resume.fitScore.keywords.filter((k) => k.status !== "matched");

    const systemPrompt = `You are a Principal Engineering Interview Coach.
Generate a tailored interview cheat sheet with:
1. 3 predicted technical and behavioral questions specific to the role and candidate's background.
2. Concrete STAR-method talking points addressing missing or transferable skill gaps.
3. 2 thoughtful, high-signal questions the candidate can ask the interviewer.
Format output as JSON matching the schema.`;

    const userPrompt = `
Target Company: ${job.company}
Target Role: ${job.role}
Missing or Transferable Skills: ${missingOrTransferable.map((k) => `${k.keyword} (${k.status})`).join(", ") || "None"}
Candidate Verified Skills: ${resume.selectedSkills.map((s) => s.name).join(", ")}
Candidate Experiences:
${resume.tailoredExperiences.map((e) => `- ${e.role} at ${e.company}`).join("\n")}
`;

    const response = await invokeBedrockJson<InterviewCheatSheet>({
      systemPrompt,
      userPrompt,
      schema: cheatSheetSchema,
      fallbackGenerator: () => this.fallbackCheatSheet(job, resume),
    });

    return response;
  }

  /**
   * Generates a polite follow-up email for applications pending response.
   */
  async generateFollowUpEmail(userId: string, resumeId: string): Promise<string> {
    const { resume, job, profile } = await this.getContext(userId, resumeId);

    return `Subject: Following up on application for ${job.role} — ${profile.contact.fullName}

Dear Hiring Team at ${job.company},

I hope this note finds you well.

I am following up on my recent application for the ${job.role} position at ${job.company}. Having followed your team's work, I remain very enthusiastic about contributing to your goals, especially leveraging my background in ${resume.selectedSkills.slice(0, 2).map((s) => s.name).join(" and ")}.

Please let me know if there are any additional details or work samples I can provide to assist in your review. I look forward to the possibility of connecting.

Warm regards,

${profile.contact.fullName}
${profile.contact.phone || ""}
${profile.contact.email}
${profile.contact.linkedinUrl || ""}`;
  }

  private fallbackCoverLetter(profile: Profile, job: JobOpportunity, resume: TailoredResume): string {
    const topExp = resume.tailoredExperiences[0];
    const topBullet = topExp?.bullets[0]?.content || "delivered high-impact software solutions";

    return `Dear Hiring Manager at ${job.company},

I am writing to express my enthusiastic interest in the ${job.role} position at ${job.company}. With a proven background in software engineering and cloud infrastructure, I am eager to bring my expertise in ${resume.selectedSkills.slice(0, 3).map((s) => s.name).join(", ")} to your team.

In my recent work as ${topExp?.role || "Engineer"} at ${topExp?.company || "my previous team"}, I ${topBullet.toLowerCase()}. This experience directly matches your technical requirements, particularly around ${job.mustHaves[0] || "scalable cloud systems"}.

I admire ${job.company}'s focus and would welcome the opportunity to discuss how my verified background aligns with your vision. Thank you for your time and consideration.

Sincerely,
${profile.contact.fullName}`;
  }

  private fallbackCheatSheet(job: JobOpportunity, resume: TailoredResume): InterviewCheatSheet {
    const missing = resume.fitScore.keywords.filter((k) => k.status === "missing");
    const gapPoints = missing.length > 0
      ? missing.map((m) => `For ${m.keyword}: Emphasize quick ramp-up speed and show parallel depth in ${resume.selectedSkills[0]?.name || "core engineering principles"}, citing how you learned similar frameworks in under 2 weeks.`)
      : ["Highlight proven track record of delivering end-to-end cloud architectures under production deadlines."];

    return {
      predictedQuestions: [
        {
          question: `Can you walk us through how you would architect a scalable system at ${job.company}?`,
          context: `Targeting core responsibilities for ${job.role}.`,
          suggestedApproach: "Use STAR method: explain architecture tradeoffs, caching layers, and reliability considerations.",
        },
        {
          question: "Describe a project where you had to quickly master an unfamiliar technology under tight constraints.",
          context: "Assessing adaptability and addressing potential skill gaps.",
          suggestedApproach: "Reference a verified Vault project, explaining the rapid learning curve and measurable outcome.",
        },
        {
          question: "How do you approach code reviews and architectural consensus within an engineering team?",
          context: "Assessing engineering culture and communication.",
          suggestedApproach: "Highlight empathetic feedback, automated linting/CI checks, and collaborative RFCs.",
        },
      ],
      talkingPointsForGaps: gapPoints,
      questionsToAskInterviewer: [
        `What are the most critical technical milestones for the ${job.role} in the first 90 days?`,
        `How does the engineering team at ${job.company} balance feature delivery speed with architectural debt?`,
      ],
    };
  }
}

export const boosterService = new BoosterService();
