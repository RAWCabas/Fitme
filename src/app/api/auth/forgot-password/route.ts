import { NextRequest } from "next/server";
import { z } from "zod";
import { errorResponse, jsonResponse } from "@/lib/http";
import { cognitoForgotPassword } from "@/lib/auth/cognito";

const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Please provide a valid email address"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = forgotPasswordSchema.parse(body);

    const result = await cognitoForgotPassword(email);
    return jsonResponse({
      ok: true,
      message: "Verification code sent to your email",
      destination: result.destination,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

