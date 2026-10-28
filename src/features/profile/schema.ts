import { z } from "zod";

const text = (max: number) => z.string().trim().max(max);
const isoDateOrNull = z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/).nullable();

/** Contact and Personal Details */
export const contactInfoSchema = z.strictObject({
  fullName: text(120).min(1, "Full name is required"),
  headline: text(160).default(""),
  email: z.string().email("Valid email required"),
  phone: text(40).default(""),
  location: text(120).default(""),
  portfolioUrl: z.union([z.literal(""), z.string().url()]).default(""),
  linkedinUrl: z.union([z.literal(""), z.string().url()]).default(""),
  githubUrl: z.union([z.literal(""), z.string().url()]).default(""),
});

/** Single Bullet Point with Granular Hide Toggle */
export const bulletPointSchema = z.strictObject({
  id: z.string().uuid(),
  content: text(1000).min(1, "Bullet content cannot be empty"),
  isHidden: z.boolean().default(false), // Item-level visibility toggle
  hasMetrics: z.boolean().default(false),
});

/** Work Experience Item */
export const workExperienceSchema = z.strictObject({
  id: z.string().uuid(),
  company: text(120).min(1, "Company is required"),
  role: text(120).min(1, "Role title is required"),
  location: text(120).default(""),
  startDate: isoDateOrNull.default(null),
  endDate: isoDateOrNull.default(null), // null indicates "Present"
  bullets: z.array(bulletPointSchema).default([]),
  isHidden: z.boolean().default(false), // Toggle entire role
});

/** Project Item */
export const projectSchema = z.strictObject({
  id: z.string().uuid(),
  name: text(120).min(1, "Project name is required"),
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
  name: text(50).min(1, "Skill name is required"),
  category: skillCategorySchema,
  isHidden: z.boolean().default(false),
});

/** Complete Master Profile */
export const profileSchema = z.strictObject({
  userId: z.string().min(1),
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
export type SkillCategory = z.infer<typeof skillCategorySchema>;
export type SkillItem = z.infer<typeof skillItemSchema>;
export type Profile = z.infer<typeof profileSchema>;
