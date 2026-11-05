import { NextRequest } from "next/server";
import { z } from "zod";
import { errorResponse, jsonResponse } from "@/lib/http";
import { cognitoConfirmForgotPassword } from "@/lib/auth/cognito";

const resetPasswordSchema = z.object({
  email: z.string().trim().email("Please provide a valid email address"),
  confirmationCode: z.string().trim().min(1, "Verification code is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, confirmationCode, newPassword } = resetPasswordSchema.parse(body);

    await cognitoConfirmForgotPassword({ email, confirmationCode, newPassword });
    return jsonResponse({
      ok: true,
      message: "Password reset successfully. You can now sign in with your new password.",
    });
  } catch (error) {
    return errorResponse(error);
  }
}
