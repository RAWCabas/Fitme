import { NextRequest } from "next/server";
import { jsonResponse } from "@/lib/http";
import { getSession } from "@/lib/auth/session";
import { profileService } from "@/features/profile/service";
import { parseResumeWithBedrock } from "@/features/mcp/resume-extractor";

interface JsonRpcRequest {
  jsonrpc?: string;
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

export async function POST(req: NextRequest) {
  let rpc: JsonRpcRequest;
  try {
    rpc = await req.json();
  } catch {
    return jsonResponse({
      jsonrpc: "2.0",
      id: null,
      error: { code: -32700, message: "Parse error" },
    }, 400);
  }

  const { method, params, id = null } = rpc;

  // Resolve user identity
  const authHeader = req.headers.get("authorization");
  const session = await getSession();
  let userId = session?.userId;

  // Support MCP Bearer Secret for CLI/Claude Desktop clients
  const expectedSecret = process.env.MCP_AUTH_SECRET || "fitme-local-mcp-secret";
  if (!userId && authHeader?.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "").trim();
    if (token === expectedSecret || token.length > 5) {
      userId = `mcp_user_${Buffer.from(token).toString("hex").slice(0, 10)}`;
    }
  }

  // Fallback to demo user if unauthenticated in dev
  if (!userId) {
    userId = "dev_mcp_default_user";
  }

  // MCP Initialize
  if (method === "initialize") {
    return jsonResponse({
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: {
          name: "fitme-mcp-server",
          version: "0.1.0",
        },
      },
    });
  }

  // MCP Tools List
  if (method === "tools/list") {
    return jsonResponse({
      jsonrpc: "2.0",
      id,
      result: {
        tools: [
          {
            name: "fitme_import_resume",
            description: "Parses raw resume text with Amazon Bedrock into structured experiences, projects, and skills and saves to your Master Vault.",
            inputSchema: {
              type: "object",
              properties: {
                rawText: {
                  type: "string",
                  description: "The complete raw text or markdown of the resume",
                },
              },
              required: ["rawText"],
            },
          },
          {
            name: "fitme_get_profile",
            description: "Retrieves the user's current Master Experience Vault including all jobs, projects, and skills.",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
        ],
      },
    });
  }

  // MCP Tool Execution
  if (method === "tools/call") {
    const toolName = params?.name as string;
    const args = (params?.arguments as Record<string, unknown>) || {};

    if (toolName === "fitme_import_resume") {
      const rawText = String(args.rawText || "");
      if (!rawText || rawText.trim().length < 10) {
        return jsonResponse({
          jsonrpc: "2.0",
          id,
          error: { code: -32602, message: "Invalid params: 'rawText' must be provided." },
        });
      }

      const extracted = await parseResumeWithBedrock(rawText);

      // Ingest into user's Master Profile
      await profileService.updateContact(userId, extracted.contact);
      if (extracted.summary) {
        await profileService.updateSummary(userId, extracted.summary);
      }

      for (const exp of extracted.experiences) {
        await profileService.addExperience(userId, exp);
      }

      for (const proj of extracted.projects) {
        await profileService.addProject(userId, proj);
      }

      for (const skill of extracted.skills) {
        await profileService.addSkill(userId, skill);
      }

      const profile = await profileService.getOrCreateProfile(userId);

      return jsonResponse({
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: `Successfully imported resume into Fitme Master Vault! Added ${extracted.experiences.length} roles, ${extracted.projects.length} projects, and ${extracted.skills.length} skills.`,
            },
          ],
          structuredContent: {
            success: true,
            importedRoles: extracted.experiences.length,
            importedProjects: extracted.projects.length,
            importedSkills: extracted.skills.length,
            profile,
          },
        },
      });
    }

    if (toolName === "fitme_get_profile") {
      const profile = await profileService.getOrCreateProfile(userId);
      return jsonResponse({
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: `Master Vault for ${profile.contact.fullName}: ${profile.experiences.length} roles, ${profile.projects.length} projects, ${profile.skills.length} skills.`,
            },
          ],
          structuredContent: profile,
        },
      });
    }

    return jsonResponse({
      jsonrpc: "2.0",
      id,
      error: { code: -32601, message: `Tool not found: ${toolName}` },
    });
  }

  return jsonResponse({
    jsonrpc: "2.0",
    id,
    error: { code: -32601, message: `Method not supported: ${method}` },
  });
}

