import { NextRequest } from "next/server";
import { z } from "zod";
import { errorResponse, jsonResponse } from "@/lib/http";
import { cognitoConfirmSignUp } from "@/lib/auth/cognito";

const confirmSignUpSchema = z.object({
  email: z.string().trim().email("Please provide a valid email address"),
  confirmationCode: z.string().trim().min(1, "Verification code is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, confirmationCode } = confirmSignUpSchema.parse(body);

    await cognitoConfirmSignUp({ email, confirmationCode });

    return jsonResponse({
      ok: true,
      message: "Account confirmed successfully! You can now sign in.",
    });
  } catch (error) {
    return errorResponse(error);
  }
}

