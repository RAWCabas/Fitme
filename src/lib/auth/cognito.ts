import { AppError } from "@/lib/errors";
import { getAwsRegion } from "@/lib/config";
import { AuthSession } from "./session";

interface CognitoAuthParams {
  email: string;
  password: string;
  name?: string;
}

export interface ForgotPasswordResult {
  deliveryMedium: string;
  destination: string;
}

export interface ConfirmForgotPasswordParams {
  email: string;
  confirmationCode: string;
  newPassword: string;
}

/**
 * Authenticates a user against Amazon Cognito User Pool.
 * If Cognito credentials are not configured, falls back to deterministic local authentication for dev/tests.
 */
export async function cognitoSignIn({ email, password }: CognitoAuthParams): Promise<AuthSession> {
  const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  const region = getAwsRegion();

  if (!email || !password) {
    throw AppError.badRequest("Email and password are required");
  }

  // If Cognito credentials are fully configured, authenticate with AWS Cognito
  if (userPoolId && clientId) {
    try {
      const response = await fetch(`https://cognito-idp.${region}.amazonaws.com/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-amz-json-1.1",
          "X-Amz-Target": "AWSCognitoIdentityProviderService.InitiateAuth",
        },
        body: JSON.stringify({
          AuthFlow: "USER_PASSWORD_AUTH",
          ClientId: clientId,
          AuthParameters: {
            USERNAME: email,
            PASSWORD: password,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.message && data.message.includes("USER_PASSWORD_AUTH")) {
          throw AppError.badRequest(
            "USER_PASSWORD_AUTH flow is not enabled for this Cognito App Client. In AWS Console: Cognito User Pool > App clients > Authentication flows > check 'ALLOW_USER_PASSWORD_AUTH' and save changes."
          );
        }
        throw AppError.unauthorized(data.message || "Invalid email or password");
      }

      // Generate deterministic userId from Cognito response or email
      const userId = data.AuthenticationResult?.IdToken
        ? parseSubFromJwt(data.AuthenticationResult.IdToken)
        : `cognito_${Buffer.from(email).toString("hex").slice(0, 16)}`;

      return {
        userId,
        email,
        name: email.split("@")[0],
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw AppError.unauthorized("Authentication failed. Please check your credentials.");
    }
  }

  // Local / Mock Dev Mode: validates format and provides a deterministic session
  if (password.length < 6) {
    throw AppError.badRequest("Password must be at least 6 characters");
  }

  return {
    userId: `dev_user_${Buffer.from(email).toString("hex").slice(0, 12)}`,
    email,
    name: email.split("@")[0],
  };
}

/**
 * Registers a new user with Amazon Cognito User Pool.
 */
export async function cognitoSignUp({ email, password, name }: CognitoAuthParams): Promise<AuthSession> {
  const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  const region = getAwsRegion();

  if (!email || !password) {
    throw AppError.badRequest("Email and password are required");
  }

  if (password.length < 8) {
    throw AppError.badRequest("Password must be at least 8 characters");
  }

  const displayName = name || email.split("@")[0];

  // If Cognito is configured, execute AWS SignUp
  if (userPoolId && clientId) {
    try {
      const response = await fetch(`https://cognito-idp.${region}.amazonaws.com/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-amz-json-1.1",
          "X-Amz-Target": "AWSCognitoIdentityProviderService.SignUp",
        },
        body: JSON.stringify({
          ClientId: clientId,
          Username: email,
          Password: password,
          UserAttributes: [
            { Name: "email", Value: email },
            { Name: "name", Value: displayName },
          ],
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw AppError.badRequest(data.message || "Failed to register user with Cognito");
      }

      return {
        userId: data.UserSub || `cognito_${Buffer.from(email).toString("hex").slice(0, 16)}`,
        email,
        name: displayName,
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw AppError.badRequest("Registration failed with authentication provider");
    }
  }

  // Local / Mock Dev Mode
  return {
    userId: `dev_user_${Buffer.from(email).toString("hex").slice(0, 12)}`,
    email,
    name: displayName,
  };
}

function parseSubFromJwt(token: string): string {
  try {
    const parts = token.split(".");
    if (parts.length >= 2) {
      const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
      return payload.sub || "";
    }
    return "";
  } catch {
    return "";
  }
}

/**
 * Initiates the password recovery flow via Amazon Cognito User Pool.
 * Sends a confirmation code to the user's verified email.
 */
export async function cognitoForgotPassword(email: string): Promise<ForgotPasswordResult> {
  const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  const region = getAwsRegion();

  const trimmedEmail = email?.trim().toLowerCase();
  if (!trimmedEmail) {
    throw AppError.badRequest("Email is required");
  }

  if (userPoolId && clientId) {
    try {
      const response = await fetch(`https://cognito-idp.${region}.amazonaws.com/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-amz-json-1.1",
          "X-Amz-Target": "AWSCognitoIdentityProviderService.ForgotPassword",
        },
        body: JSON.stringify({
          ClientId: clientId,
          Username: trimmedEmail,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.__type === "UserNotFoundException") {
          throw AppError.notFound("No account found with this email address");
        }
        if (data.__type === "LimitExceededException") {
          throw AppError.badRequest("Too many password reset attempts. Please wait a few minutes before trying again.");
        }
        if (data.__type === "InvalidParameterException") {
          throw AppError.badRequest(data.message || "Cannot reset password for this user");
        }
        throw AppError.badRequest(data.message || "Failed to initiate password reset");
      }

      return {
        deliveryMedium: data.CodeDeliveryDetails?.DeliveryMedium || "EMAIL",
        destination: data.CodeDeliveryDetails?.Destination || trimmedEmail,
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw AppError.badRequest("Unable to send recovery code. Please check your email address.");
    }
  }

  // Local / Mock Dev Mode:
  return {
    deliveryMedium: "EMAIL",
    destination: trimmedEmail,
  };
}

/**
 * Confirms the new password with the verification code received via email.
 */
export async function cognitoConfirmForgotPassword({
  email,
  confirmationCode,
  newPassword,
}: ConfirmForgotPasswordParams): Promise<void> {
  const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  const region = getAwsRegion();

  const trimmedEmail = email?.trim().toLowerCase();
  const trimmedCode = confirmationCode?.trim();

  if (!trimmedEmail || !trimmedCode || !newPassword) {
    throw AppError.badRequest("Email, verification code, and new password are required");
  }

  if (newPassword.length < 8) {
    throw AppError.badRequest("Password must be at least 8 characters");
  }

  if (userPoolId && clientId) {
    try {
      const response = await fetch(`https://cognito-idp.${region}.amazonaws.com/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-amz-json-1.1",
          "X-Amz-Target": "AWSCognitoIdentityProviderService.ConfirmForgotPassword",
        },
        body: JSON.stringify({
          ClientId: clientId,
          Username: trimmedEmail,
          ConfirmationCode: trimmedCode,
          Password: newPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.__type === "CodeMismatchException") {
          throw AppError.badRequest("Invalid verification code. Please check your email and try again.");
        }
        if (data.__type === "ExpiredCodeException") {
          throw AppError.badRequest("Verification code has expired. Please request a new one.");
        }
        if (data.__type === "InvalidPasswordException") {
          throw AppError.badRequest(data.message || "Password does not meet complexity requirements.");
        }
        throw AppError.badRequest(data.message || "Failed to reset password");
      }

      return;
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw AppError.badRequest("Failed to reset password. Please try again.");
    }
  }

  // Local / Mock Dev Mode:
  if (trimmedCode.length < 4) {
    throw AppError.badRequest("Verification code must be at least 4 characters");
  }
}

