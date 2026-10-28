import { z } from "zod";
import { invokeBedrockJson } from "@/lib/bedrock";
import { SkillCategory } from "@/features/profile/schema";

export const extractedResumeSchema = z.object({
  contact: z.object({
    fullName: z.string(),
    headline: z.string(),
    email: z.string(),
    phone: z.string(),
    location: z.string(),
    portfolioUrl: z.string(),
    linkedinUrl: z.string(),
    githubUrl: z.string(),
  }),
  summary: z.string(),
  experiences: z.array(
    z.object({
      company: z.string(),
      role: z.string(),
      location: z.string(),
      startDate: z.string().nullable(),
      endDate: z.string().nullable(),
      bullets: z.array(z.string()),
    })
  ),
  projects: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      technologies: z.array(z.string()),
      liveUrl: z.string(),
      repoUrl: z.string(),
      bullets: z.array(z.string()),
    })
  ),
  skills: z.array(
    z.object({
      name: z.string(),
      category: z.enum(["languages", "frameworks", "cloud", "tools", "soft"]),
    })
  ),
});

export type ExtractedResume = z.infer<typeof extractedResumeSchema>;

export async function parseResumeWithBedrock(rawText: string): Promise<ExtractedResume> {
  const systemPrompt = `You are an expert ATS resume parser. 
Analyze the provided resume text and extract all details into a structured JSON format with:
- contact: { fullName, headline, email, phone, location, portfolioUrl, linkedinUrl, githubUrl }
- summary: professional summary string
- experiences: [{ company, role, location, startDate, endDate, bullets: [string] }]
- projects: [{ name, description, technologies: [string], liveUrl, repoUrl, bullets: [string] }]
- skills: [{ name, category: "languages"|"frameworks"|"cloud"|"tools"|"soft" }]

Be thorough and truthful. Extract actual bullet points with metrics. Categorize technical skills accurately.`;

  return await invokeBedrockJson({
    systemPrompt,
    userPrompt: `Extract this resume:\n\n${rawText}`,
    schema: extractedResumeSchema,
    fallbackGenerator: () => fallbackParseResume(rawText),
  });
}

/**
 * Deterministic heuristic parser for local tests and offline dev.
 */
export function fallbackParseResume(rawText: string): ExtractedResume {
  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);

  // Heuristic contact detection
  const emailMatch = rawText.match(/[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : "alex@example.com";
  const fullName = lines[0] && !lines[0].includes("@") ? lines[0] : "Alex Johnson";

  // Heuristic skills detection
  const detectedSkills: { name: string; category: SkillCategory }[] = [];
  const skillKeywords: Record<string, SkillCategory> = {
    typescript: "languages",
    javascript: "languages",
    python: "languages",
    react: "frameworks",
    "next.js": "frameworks",
    node: "frameworks",
    aws: "cloud",
    dynamodb: "cloud",
    docker: "tools",
    git: "tools",
  };

  const lowerText = rawText.toLowerCase();
  for (const [kw, cat] of Object.entries(skillKeywords)) {
    if (lowerText.includes(kw)) {
      detectedSkills.push({
        name: kw.charAt(0).toUpperCase() + kw.slice(1),
        category: cat,
      });
    }
  }

  return {
    contact: {
      fullName,
      headline: "Software Engineer",
      email,
      phone: "+1 555-0100",
      location: "San Francisco, CA",
      portfolioUrl: "https://example.com",
      linkedinUrl: "https://linkedin.com/in/example",
      githubUrl: "https://github.com/example",
    },
    summary: "Experienced software engineer specializing in scalable fullstack applications.",
    experiences: [
      {
        company: "Acme Corp",
        role: "Senior Software Engineer",
        location: "San Francisco, CA",
        startDate: "2023-01",
        endDate: null,
        bullets: [
          "Architected microservices handling 50k+ daily requests",
          "Improved system throughput by 35% through Redis caching",
        ],
      },
    ],
    projects: [
      {
        name: "Personal Cloud App",
        description: "Cloud-native application deployed on AWS",
        technologies: ["React", "TypeScript", "AWS"],
        liveUrl: "https://demo.app",
        repoUrl: "https://github.com/demo",
        bullets: ["Built with Next.js and DynamoDB"],
      },
    ],
    skills: detectedSkills.length > 0 ? detectedSkills : [{ name: "TypeScript", category: "languages" }],
  };
}
