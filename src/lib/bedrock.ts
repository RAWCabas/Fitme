import { z, ZodType } from "zod";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { AppError } from "./errors";

interface BedrockJsonParams<T> {
  systemPrompt: string;
  userPrompt: string;
  schema: ZodType<T>;
  fallbackGenerator?: () => T;
}

/**
 * Invokes Amazon Bedrock (Claude 3.5 Haiku) for structured JSON generation.
 * Enforces Zod schema validation on the extracted payload.
 */
export async function invokeBedrockJson<T>({
  systemPrompt,
  userPrompt,
  schema,
  fallbackGenerator,
}: BedrockJsonParams<T>): Promise<T> {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION || "us-east-1";
  const modelId = process.env.BEDROCK_MODEL_ID || "anthropic.claude-3-5-haiku-20241022-v1:0";

  // If AWS credentials are provided, invoke Amazon Bedrock
  if (accessKeyId && secretAccessKey) {
    try {
      const client = new BedrockRuntimeClient({
        region,
        credentials: { accessKeyId, secretAccessKey },
      });

      const payload = {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 4096,
        system: `${systemPrompt}\n\nIMPORTANT: You must respond ONLY with a valid JSON object matching the requested schema. Do not enclose in markdown blocks.`,
        messages: [{ role: "user", content: userPrompt }],
      };

      const command = new InvokeModelCommand({
        modelId,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify(payload),
      });

      const response = await client.send(command);
      const responseBody = new TextDecoder().decode(response.body);
      const parsedBody = JSON.parse(responseBody);
      const textContent = parsedBody.content?.[0]?.text || "";

      const cleanJson = extractJsonSubstring(textContent);
      const rawObj = JSON.parse(cleanJson);
      return schema.parse(rawObj);
    } catch (err) {
      if (err instanceof z.ZodError) {
        throw AppError.badRequest(`AI output did not match expected schema: ${err.message}`);
      }
      console.warn("Bedrock call failed, falling back if available:", err);
    }
  }

  // Deterministic Fallback Mode for Tests and Offline Dev
  if (fallbackGenerator) {
    const fallbackData = fallbackGenerator();
    return schema.parse(fallbackData);
  }

  throw AppError.internal("Amazon Bedrock is not configured and no fallback is available.");
}

/**
 * Extracts a JSON object from raw LLM output even if surrounded by commentary or backticks.
 */
export function extractJsonSubstring(text: string): string {
  const trimmed = text.trim();

  // If already pure JSON
  if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
    return trimmed;
  }

  // Check for ```json ... ``` code blocks
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch && codeBlockMatch[1]) {
    return codeBlockMatch[1].trim();
  }

  // Find first { and last }
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.substring(firstBrace, lastBrace + 1);
  }

  return trimmed;
}
