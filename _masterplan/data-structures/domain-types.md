# Domain Types

The authoritative Zod schemas for Fitme. All code imports types and validators from here.

---

## 1. Master Experience Vault (`src/features/profile/schema.ts`)

```ts
import { z } from "zod";

const text = (max: number) => z.string().trim().max(max);
const isoDateOrNull = z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/).nullable();

/** Contact and Personal Details */
export const contactInfoSchema = z.strictObject({
  fullName: text(120).min(1),
  headline: text(160).default(""),
  email: z.string().email(),
  phone: text(40).default(""),
  location: text(120).default(""),
  portfolioUrl: z.union([z.literal(""), z.string().url()]).default(""),
  linkedinUrl: z.union([z.literal(""), z.string().url()]).default(""),
  githubUrl: z.union([z.literal(""), z.string().url()]).default(""),
});

/** Single Bullet Point with Granular Hide Toggle */
export const bulletPointSchema = z.strictObject({
  id: z.string().uuid(),
  content: text(1000).min(1),
  isHidden: z.boolean().default(false), // Item-level visibility toggle
  hasMetrics: z.boolean().default(false),
});

/** Work Experience Item */
export const workExperienceSchema = z.strictObject({
  id: z.string().uuid(),
  company: text(120).min(1),
  role: text(120).min(1),
  location: text(120).default(""),
  startDate: isoDateOrNull,
  endDate: isoDateOrNull, // null indicates "Present"
  bullets: z.array(bulletPointSchema).default([]),
  isHidden: z.boolean().default(false), // Toggle entire role
});

/** Project Item */
export const projectSchema = z.strictObject({
  id: z.string().uuid(),
  name: text(120).min(1),
  description: text(500).default(""),
  technologies: z.array(text(40)).default([]),
  liveUrl: z.union([z.literal(""), z.string().url()]).default(""),
  repoUrl: z.union([z.literal(""), z.string().url()]).default(""),
  bullets: z.array(bulletPointSchema).default([]),
  isHidden: z.boolean().default(false), // Toggle entire project
});

/** Skills by Category */
export const skillCategorySchema = z.enum(["languages", "frameworks", "cloud", "tools", "soft"]);

export const skillItemSchema = z.strictObject({
  id: z.string().uuid(),
  name: text(50).min(1),
  category: skillCategorySchema,
  isHidden: z.boolean().default(false),
});

/** Complete Master Profile */
export const profileSchema = z.strictObject({
  userId: z.string().min(1), // Amazon Cognito sub
  contact: contactInfoSchema,
  experiences: z.array(workExperienceSchema).default([]),
  projects: z.array(projectSchema).default([]),
  skills: z.array(skillItemSchema).default([]),
  summary: text(2000).default(""),
  updatedAt: z.string().datetime(),
});

export type ContactInfo = z.infer<typeof contactInfoSchema>;
export type BulletPoint = z.infer<typeof bulletPointSchema>;
export type WorkExperience = z.infer<typeof workExperienceSchema>;
export type Project = z.infer<typeof projectSchema>;
export type SkillItem = z.infer<typeof skillItemSchema>;
export type Profile = z.infer<typeof profileSchema>;
```

---

## 2. Job Opportunity & Ingestion (`src/features/tailor/schema.ts`)

```ts
/** Extracted Job Description Analysis from Bedrock */
export const jobOpportunitySchema = z.strictObject({
  id: z.string().uuid(),
  userId: z.string().min(1),
  company: text(120).min(1),
  role: text(120).min(1),
  location: text(120).default(""),
  sourceUrl: z.union([z.literal(""), z.string().url()]).default(""),
  rawDescription: z.string().min(10),
  extractedSkills: z.array(text(50)).default([]),
  mustHaves: z.array(text(200)).default([]),
  niceToHaves: z.array(text(200)).default([]),
  createdAt: z.string().datetime(),
});

export type JobOpportunity = z.infer<typeof jobOpportunitySchema>;
```

---

## 3. Tailored Resume & Fit Score (`src/features/tailor/schema.ts`)

```ts
export const RESUME_STATUSES = ["draft", "sent", "interview", "job_offer", "rejected"] as const;
export const TYPOGRAPHY_PRESETS = ["modern_standard", "classic_ivy", "tech_minimalist"] as const;
export const PAGE_BUDGETS = ["1_page", "2_pages"] as const;

export const resumeStatusSchema = z.enum(RESUME_STATUSES);
export const typographyPresetSchema = z.enum(TYPOGRAPHY_PRESETS);
export const pageBudgetSchema = z.enum(PAGE_BUDGETS);

export type ResumeStatus = z.infer<typeof resumeStatusSchema>;
export type TypographyPreset = z.infer<typeof typographyPresetSchema>;
export type PageBudget = z.infer<typeof pageBudgetSchema>;

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

export type KeywordMatch = z.infer<typeof keywordMatchSchema>;
export type FitScore = z.infer<typeof fitScoreSchema>;
export type TailoredResume = z.infer<typeof tailoredResumeSchema>;
```

---

## 4. Optional On-Demand Boosters (`src/features/tailor/schema.ts`)

```ts
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
```

---

## 5. Wire Contracts & Invariants

| Contract | Rule |
| :--- | :--- |
| **API Responses** | Direct domain JSON entities or lists; errors formatted as `{ "error": "<message>" }` with proper HTTP codes. |
| **Cognito Scoping** | Every read/write operation asserts `record.userId === session.userId`. No cross-tenant access. |
| **Dates** | ISO-8601 (`YYYY-MM-DD` for calendar dates, UTC timestamps for audit fields). UI formats locally via `src/lib/dates.ts`. |
| **Immutability of Sent Resumes** | When `status` changes from `draft` to `sent`, the snapshot is preserved to maintain application fidelity. |

