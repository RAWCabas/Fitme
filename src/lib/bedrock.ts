import { z, ZodType, ZodTypeDef } from "zod";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { getAwsRegion, getAwsCredentials } from "./config";
import { AppError } from "./errors";

interface BedrockJsonParams<T> {
  systemPrompt: string;
  userPrompt: string;
  schema: ZodType<T, ZodTypeDef, unknown>;
  fallbackGenerator?: () => T;
}

/**
 * Invokes Google Gemini or Amazon Bedrock (Claude 3.5 Haiku / Nova) for structured JSON generation.
 * Enforces Zod schema validation on the extracted payload.
 */
export async function invokeBedrockJson<T>({
  systemPrompt,
  userPrompt,
  schema,
  fallbackGenerator,
}: BedrockJsonParams<T>): Promise<T> {
  const provider = (process.env.AI_PROVIDER || "").toLowerCase().trim();
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_AI_KEY;
  const credentials = getAwsCredentials();
  const region = getAwsRegion();
  const modelId = process.env.BEDROCK_MODEL_ID || "anthropic.claude-3-5-haiku-20241022-v1:0";

  // Helper for Bedrock execution
  const runBedrock = async (): Promise<T> => {
    if (!credentials) {
      throw new Error("AWS credentials not found for Amazon Bedrock");
    }
    const client = new BedrockRuntimeClient({
      region,
      credentials,
    });

    const isNova = modelId.startsWith("amazon.nova");
    const jsonSystemPrompt = `${systemPrompt}\n\nIMPORTANT: You must respond ONLY with a valid JSON object matching the requested schema. Do not enclose in markdown blocks.`;

    const payload = isNova
      ? {
          system: [{ text: jsonSystemPrompt }],
          messages: [{ role: "user", content: [{ text: userPrompt }] }],
          inferenceConfig: {
            max_new_tokens: 4096,
            temperature: 0.2,
          },
        }
      : {
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: 4096,
          system: jsonSystemPrompt,
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
    const textContent = isNova
      ? parsedBody.output?.message?.content?.[0]?.text || parsedBody.content?.[0]?.text || ""
      : parsedBody.content?.[0]?.text || "";

    const cleanJson = extractJsonSubstring(textContent);
    const rawObj = JSON.parse(cleanJson);
    return schema.parse(rawObj);
  };

  // Helper for Gemini execution
  const runGemini = async (): Promise<T> => {
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY is not set");
    }
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const geminiModel = process.env.GEMINI_MODEL_ID || "gemini-2.0-flash";
    const jsonSystemPrompt = `${systemPrompt}\n\nIMPORTANT: You must respond ONLY with a valid JSON object matching the requested schema. Do not enclose in markdown blocks.`;

    const response = await ai.models.generateContent({
      model: geminiModel,
      contents: userPrompt,
      config: {
        systemInstruction: jsonSystemPrompt,
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const textContent = response.text || "";
    const cleanJson = extractJsonSubstring(textContent);
    const rawObj = JSON.parse(cleanJson);
    return schema.parse(rawObj);
  };

  // 1. Explicit Bedrock Preference (AI_PROVIDER=bedrock)
  if (provider === "bedrock") {
    if (credentials) {
      try {
        return await runBedrock();
      } catch (err) {
        console.warn("Bedrock call failed with AI_PROVIDER=bedrock:", err);
        if (err instanceof z.ZodError) {
          throw AppError.badRequest(`Bedrock output did not match schema: ${err.message}`);
        }
        if (geminiApiKey) {
          try {
            return await runGemini();
          } catch {}
        }
        if (fallbackGenerator) return schema.parse(fallbackGenerator());
        throw err;
      }
    }
  }

  // 2. Explicit Gemini Preference or Default when GEMINI_API_KEY is present
  if (geminiApiKey && provider !== "bedrock") {
    try {
      return await runGemini();
    } catch (err) {
      console.warn("Gemini call failed, attempting Bedrock fallback:", err);
      if (err instanceof z.ZodError) {
        throw AppError.badRequest(`Gemini output did not match schema: ${err.message}`);
      }
      if (credentials) {
        try {
          return await runBedrock();
        } catch {}
      }
      if (fallbackGenerator) return schema.parse(fallbackGenerator());
      throw err;
    }
  }

  // 3. Bedrock when AWS credentials exist without Gemini API key
  if (credentials) {
    try {
      return await runBedrock();
    } catch (err) {
      console.warn("Bedrock call failed:", err);
      if (err instanceof z.ZodError) {
        throw AppError.badRequest(`Bedrock output did not match schema: ${err.message}`);
      }
      if (fallbackGenerator) return schema.parse(fallbackGenerator());
      throw err;
    }
  }

  // Deterministic Fallback Mode for Tests and Offline Dev
  if (fallbackGenerator) {
    const fallbackData = fallbackGenerator();
    return schema.parse(fallbackData);
  }

  throw AppError.internal("No AI provider (Gemini or Amazon Bedrock) is configured and no fallback is available.");
}

export const invokeAiJson = invokeBedrockJson;

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
