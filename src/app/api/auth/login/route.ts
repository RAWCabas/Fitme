import { NextRequest } from "next/server";
import { z } from "zod";
import { errorResponse, jsonResponse } from "@/lib/http";
import { cognitoSignIn } from "@/lib/auth/cognito";
import { setSessionCookie } from "@/lib/auth/session";
import { profileService } from "@/features/profile/service";

const loginSchema = z.object({
  email: z.string().trim().email("Please provide a valid email"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = loginSchema.parse(body);

    const session = await cognitoSignIn({ email, password });

    // Look up DynamoDB profile to ensure full registered name is retained in session
    try {
      const profile = await profileService.getOrCreateProfile(session.userId, session.email, session.name);
      if (profile?.contact?.fullName && profile.contact.fullName !== "Candidate") {
        session.name = profile.contact.fullName;
      }
    } catch (profileErr) {
      console.warn("Could not retrieve profile during login:", profileErr);
    }

    await setSessionCookie(session);

    return jsonResponse({ user: session });
  } catch (error) {
    return errorResponse(error);
  }
}

