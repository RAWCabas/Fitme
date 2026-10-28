import { NextRequest } from "next/server";
import { z } from "zod";
import { errorResponse, jsonResponse } from "@/lib/http";
import { cognitoSignUp } from "@/lib/auth/cognito";
import { setSessionCookie } from "@/lib/auth/session";

const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Please provide a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name } = registerSchema.parse(body);

    const session = await cognitoSignUp({ email, password, name });
    await setSessionCookie(session);

    return jsonResponse({ user: session }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}

