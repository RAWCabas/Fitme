import { AppError } from "@/lib/errors";
import { AuthSession } from "./session";

interface CognitoAuthParams {
  email: string;
  password: string;
  name?: string;
}

/**
 * Authenticates a user against Amazon Cognito User Pool.
 * If Cognito credentials are not configured, falls back to deterministic local authentication for dev/tests.
 */
export async function cognitoSignIn({ email, password }: CognitoAuthParams): Promise<AuthSession> {
  const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  const region = process.env.AWS_REGION || "us-east-1";

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
  const region = process.env.AWS_REGION || "us-east-1";

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

