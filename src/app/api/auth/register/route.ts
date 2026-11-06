import { NextRequest } from "next/server";
import { z } from "zod";
import { errorResponse, jsonResponse } from "@/lib/http";
import { cognitoSignUp } from "@/lib/auth/cognito";
import { setSessionCookie } from "@/lib/auth/session";
import { isPasswordValid, PASSWORD_POLICY_MESSAGE } from "@/lib/auth/password-policy";
import { profileService } from "@/features/profile/service";

const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Please provide a valid email"),
  password: z.string().refine(isPasswordValid, PASSWORD_POLICY_MESSAGE),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name } = registerSchema.parse(body);

    const result = await cognitoSignUp({ email, password, name });

    // Seed profile in DynamoDB with their registered name
    try {
      await profileService.getOrCreateProfile(result.userId, result.email, name);
    } catch (e) {
      console.warn("Could not pre-seed profile during registration:", e);
    }

    if (result.userConfirmed) {
      const session = {
        userId: result.userId,
        email: result.email,
        name: result.name,
      };
      await setSessionCookie(session);
      return jsonResponse({ user: session, userConfirmed: true }, 201);
    }

    return jsonResponse(
      {
        ok: true,
        userConfirmed: false,
        email: result.email,
        destination: result.destination,
        message: "Verification code sent to your email. Please confirm your account.",
      },
      201
    );
  } catch (error) {
    return errorResponse(error);
  }
}
