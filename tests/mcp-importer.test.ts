import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { extractJsonSubstring } from "@/lib/bedrock";
import { parseResumeWithBedrock, fallbackParseResume } from "@/features/mcp/resume-extractor";
import { POST as mcpHandler } from "@/app/api/mcp/route";
import { getProfileRepo, MemoryProfileRepo } from "@/features/profile/repo";

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => undefined,
    set: () => {},
    delete: () => {},
  }),
}));

describe("Bedrock: JSON Extractor Helper", () => {
  it("extracts clean JSON directly", () => {
    const raw = '{"hello":"world"}';
    expect(extractJsonSubstring(raw)).toBe('{"hello":"world"}');
  });

  it("extracts JSON inside markdown code blocks", () => {
    const raw = '```json\n{"score": 95, "matched": true}\n```';
    expect(extractJsonSubstring(raw)).toBe('{"score": 95, "matched": true}');
  });

  it("extracts JSON surrounded by conversation text", () => {
    const raw = 'Here is your structured output:\n{"name": "Claude"}\nHope this helps!';
    expect(extractJsonSubstring(raw)).toBe('{"name": "Claude"}');
  });
});

describe("Resume Extractor: Bedrock & Fallback", () => {
  const sampleResume = `
Alex Rivera
Senior Cloud Engineer | alex.rivera@example.com | (555) 234-5678 | Seattle, WA
https://linkedin.com/in/alexrivera | https://github.com/alexrivera

SUMMARY
Results-oriented cloud architect with 6+ years designing AWS serverless systems and Next.js applications.

EXPERIENCE
Amazon Web Services - Senior Solutions Architect
2022 - Present
- Architected enterprise DynamoDB architectures reducing p99 read latency by 42%
- Built scalable event-driven systems using Lambda, EventBridge, and SQS

PROJECTS
Fitme - AI Resume Tailor
- Next.js 15, TypeScript, Tailwind CSS, DynamoDB, Bedrock
- Automatic ATS keyword scoring and resume PDF generation

SKILLS
TypeScript, React, Next.js, Node.js, Python, AWS, DynamoDB, Docker, Git
`;

  it("extracts structured resume data", async () => {
    const extracted = fallbackParseResume(sampleResume);
    expect(extracted.contact.email).toBe("alex.rivera@example.com");
    expect(extracted.experiences).toHaveLength(1);
    expect(extracted.experiences[0].company).toBe("Acme Corp");
    expect(extracted.projects).toHaveLength(1);
    expect(extracted.skills.length).toBeGreaterThan(0);
  });

  it("executes parseResumeWithBedrock cleanly", async () => {
    const extracted = await parseResumeWithBedrock(sampleResume);
    expect(extracted.contact.email).toBeDefined();
    expect(extracted.experiences).toBeInstanceOf(Array);
  });
});

describe("MCP Endpoint: /api/mcp", () => {
  beforeEach(() => {
    const repo = getProfileRepo() as MemoryProfileRepo;
    if (typeof repo.clear === "function") {
      repo.clear();
    }
  });

  it("answers initialize protocol", async () => {
    const req = new NextRequest("http://localhost:3000/api/mcp", {
      method: "POST",
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
      }),
    });

    const res = await mcpHandler(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.result.serverInfo.name).toBe("fitme-mcp-server");
  });

  it("lists available MCP tools", async () => {
    const req = new NextRequest("http://localhost:3000/api/mcp", {
      method: "POST",
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
      }),
    });

    const res = await mcpHandler(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    const toolNames = body.result.tools.map((t: { name: string }) => t.name);
    expect(toolNames).toContain("fitme_import_resume");
    expect(toolNames).toContain("fitme_get_profile");
  });

  it("executes fitme_import_resume and populates Master Vault", async () => {
    const sampleText = `
Jane Doe
jane.doe@example.com
Software Developer with experience in React and TypeScript.
`;

    const req = new NextRequest("http://localhost:3000/api/mcp", {
      method: "POST",
      headers: {
        authorization: "Bearer fitme-local-mcp-secret",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: {
          name: "fitme_import_resume",
          arguments: { rawText: sampleText },
        },
      }),
    });

    const res = await mcpHandler(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.result.structuredContent.success).toBe(true);
    expect(body.result.structuredContent.importedRoles).toBeGreaterThanOrEqual(1);

    // Call fitme_get_profile to verify persistence in user's vault
    const getProfileReq = new NextRequest("http://localhost:3000/api/mcp", {
      method: "POST",
      headers: {
        authorization: "Bearer fitme-local-mcp-secret",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 4,
        method: "tools/call",
        params: {
          name: "fitme_get_profile",
          arguments: {},
        },
      }),
    });

    const getProfileRes = await mcpHandler(getProfileReq);
    expect(getProfileRes.status).toBe(200);
    const getProfileBody = await getProfileRes.json();
    expect(getProfileBody.result.structuredContent.experiences).toHaveLength(1);
  });
});
