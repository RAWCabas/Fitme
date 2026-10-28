import { NextRequest } from "next/server";
import { z } from "zod";
import { errorResponse, jsonResponse } from "@/lib/http";
import { cognitoSignIn } from "@/lib/auth/cognito";
import { setSessionCookie } from "@/lib/auth/session";

const loginSchema = z.object({
  email: z.string().trim().email("Please provide a valid email"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = loginSchema.parse(body);

    const session = await cognitoSignIn({ email, password });
    await setSessionCookie(session);

    return jsonResponse({ user: session });
  } catch (error) {
    return errorResponse(error);
  }
}

