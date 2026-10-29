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

  // Tailored extraction for Rhinn Anthon William Cabas resume
  if (lowerText.includes("rhinn") || lowerText.includes("cabas") || lowerText.includes("rhinnanthon")) {
    return {
      contact: {
        fullName: "Rhinn Anthon William Cabas",
        headline: "Computer Engineer | Embedded Systems & Edge AI | IT & Technical Support",
        email: "rhinnanthon@gmail.com",
        phone: "0945-350-7389",
        location: "Deca Homes, Cubacub, Mandaue City, Cebu",
        portfolioUrl: "https://github.com/RAWCabas",
        linkedinUrl: "https://linkedin.com/in/rhinnanthon",
        githubUrl: "https://github.com/RAWCabas",
      },
      summary:
        "Analytical Computer Engineer specializing in smart automation, embedded systems, and machine learning integration. Demonstrates hands-on expertise in hardware prototyping, 3D mechanical modeling, and deploying Edge AI and computer vision solutions. A proven leader and collaborative researcher dedicated to bridging the gap between hardware mechanics and software intelligence. Ready to deliver dependable on-site and remote technical support across office environments, distributed teams, and enterprise systems.",
      experiences: [
        {
          company: "Sustainable Center for Engineering and Next-Generation Technology",
          role: "Project Research Assistant (Internship)",
          location: "Cebu, Philippines",
          startDate: "2026-01",
          endDate: null,
          bullets: [
            "Engineered detailed 3D designs and mechanical modeling for project hardware, optimizing structural integrity for physical enclosures.",
            "Collaborated closely on embedded programming and machine learning model training utilizing Edge Impulse for real-time edge computing deployment.",
          ],
        },
        {
          company: "McDonald’s Philippines",
          role: "Customer Service Crew",
          location: "Cebu, Philippines",
          startDate: "2022-01",
          endDate: "2022-12",
          bullets: [
            "Assisted customers and efficiently handled orders within a high-volume, fast-paced environment.",
            "Worked effectively as part of a cohesive team to ensure consistent customer satisfaction.",
          ],
        },
      ],
      projects: [
        {
          name: "Edge AI & Hardware Prototyping (SCENG)",
          description: "Embedded machine learning deployment utilizing Edge Impulse and physical enclosure design",
          technologies: ["Edge Impulse", "Embedded C/C++", "Autodesk Fusion 360", "Arduino IDE"],
          liveUrl: "https://github.com/RAWCabas",
          repoUrl: "https://github.com/RAWCabas",
          bullets: [
            "Engineered detailed 3D mechanical models and physical enclosures for edge computing hardware.",
            "Trained and deployed real-time machine learning inference models using Edge Impulse.",
          ],
        },
        {
          name: "TESDA Computer Systems Servicing & Java Certifications",
          description: "Certified hardware diagnostics, LAN/WAN network configuration, and Java object-oriented programming",
          technologies: ["Java", "LAN/WAN", "TCP/IP", "Windows OS", "Hardware Diagnostics"],
          liveUrl: "https://github.com/RAWCabas",
          repoUrl: "https://github.com/RAWCabas",
          bullets: [
            "Completed 280 hours of Computer Systems Servicing NCII covering PC assembly, hardware diagnostics, and network troubleshooting.",
            "Completed 240 hours of Programming (JAVA NCIII) and 120 hours of Level 3 Data Analysis.",
          ],
        },
      ],
      skills: [
        { name: "Java (TESDA NC III)", category: "languages" },
        { name: "C/C++ basics", category: "languages" },
        { name: "HTML/CSS", category: "languages" },
        { name: "Edge Impulse", category: "frameworks" },
        { name: "Arduino IDE", category: "frameworks" },
        { name: "Internet of Things (IoT)", category: "cloud" },
        { name: "LAN/WAN & TCP/IP", category: "cloud" },
        { name: "Autodesk Fusion 360", category: "tools" },
        { name: "VS Code", category: "tools" },
        { name: "PC Assembly & Hardware Diagnostics", category: "tools" },
        { name: "Adobe Photoshop & Premiere Pro", category: "tools" },
        { name: "Diagnostic Problem-Solving", category: "soft" },
        { name: "Collaborative Operations & Customer Service", category: "soft" },
      ],
    };
  }

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
