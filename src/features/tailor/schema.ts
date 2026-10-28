import { z } from "zod";
import { workExperienceSchema, projectSchema, skillItemSchema } from "@/features/profile/schema";

const text = (max: number) => z.string().trim().max(max);

export const RESUME_STATUSES = ["draft", "sent", "interview", "job_offer", "rejected"] as const;
export const TYPOGRAPHY_PRESETS = ["modern_standard", "classic_ivy", "tech_minimalist"] as const;
export const PAGE_BUDGETS = ["1_page", "2_pages"] as const;

export const resumeStatusSchema = z.enum(RESUME_STATUSES);
export const typographyPresetSchema = z.enum(TYPOGRAPHY_PRESETS);
export const pageBudgetSchema = z.enum(PAGE_BUDGETS);

export type ResumeStatus = z.infer<typeof resumeStatusSchema>;
export type TypographyPreset = z.infer<typeof typographyPresetSchema>;
export type PageBudget = z.infer<typeof pageBudgetSchema>;

/** Extracted Job Description Analysis from Bedrock */
export const jobOpportunitySchema = z.strictObject({
  id: z.string().uuid(),
  userId: z.string().min(1),
  company: text(120).min(1, "Company name is required"),
  role: text(120).min(1, "Role title is required"),
  location: text(120).default(""),
  sourceUrl: z.union([z.literal(""), z.string().url()]).default(""),
  rawDescription: z.string().min(10, "Job description is too short"),
  extractedSkills: z.array(text(50)).default([]),
  mustHaves: z.array(text(200)).default([]),
  niceToHaves: z.array(text(200)).default([]),
  createdAt: z.string().datetime(),
});

export type JobOpportunity = z.infer<typeof jobOpportunitySchema>;

/** Keyword Matching Breakdown */
export const keywordMatchSchema = z.strictObject({
  keyword: z.string(),
  status: z.enum(["matched", "transferable", "missing"]),
  occurrencesInJD: z.number().int().default(1),
  notes: z.string().default(""),
});

/** Fit Score Breakdown */
export const fitScoreSchema = z.strictObject({
  score: z.number().min(0).max(100),
  matchedCount: z.number().int(),
  missingCount: z.number().int(),
  keywords: z.array(keywordMatchSchema),
  summaryEvaluation: z.string(),
});

export type KeywordMatch = z.infer<typeof keywordMatchSchema>;
export type FitScore = z.infer<typeof fitScoreSchema>;

/** Tailored Resume Record */
export const tailoredResumeSchema = z.strictObject({
  id: z.string().uuid(),
  userId: z.string().min(1),
  jobOpportunityId: z.string().uuid(),
  versionNumber: z.number().int().positive().default(1),
  status: resumeStatusSchema.default("draft"),
  preset: typographyPresetSchema.default("modern_standard"),
  pageBudget: pageBudgetSchema.default("1_page"),
  fitScore: fitScoreSchema,
  tailoredSummary: text(1500),
  tailoredExperiences: z.array(workExperienceSchema),
  tailoredProjects: z.array(projectSchema),
  selectedSkills: z.array(skillItemSchema),
  pdfS3Key: z.string().nullable().default(null),
  pdfPresignedUrl: z.string().nullable().default(null),
  markdownContent: z.string().default(""),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type TailoredResume = z.infer<typeof tailoredResumeSchema>;

/** Optional On-Demand Boosters */
export const onDemandBoosterSchema = z.strictObject({
  coverLetter: z.string().nullable().default(null),
  recruiterOutreach: z.string().nullable().default(null),
  interviewCheatSheet: z.strictObject({
    predictedQuestions: z.array(z.strictObject({
      question: z.string(),
      context: z.string(),
      suggestedApproach: z.string(),
    })),
    talkingPointsForGaps: z.array(z.string()),
    questionsToAskInterviewer: z.array(z.string()),
  }).nullable().default(null),
  followUpEmail: z.string().nullable().default(null),
});

export type OnDemandBoosters = z.infer<typeof onDemandBoosterSchema>;
