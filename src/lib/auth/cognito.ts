import { AppError } from "@/lib/errors";
import { getAwsRegion } from "@/lib/config";
import { AuthSession } from "./session";
import { CognitoUserPool, CognitoUser, AuthenticationDetails } from "amazon-cognito-identity-js";

interface CognitoAuthParams {
  email: string;
  password: string;
  name?: string;
}

export interface SignUpResult {
  userId: string;
  email: string;
  name: string;
  userConfirmed: boolean;
  destination?: string;
}

export interface ConfirmSignUpParams {
  email: string;
  confirmationCode: string;
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
 * Authenticates against Cognito using SRP (Secure Remote Password) protocol.
 * SRP is supported by all Cognito User Pool clients by default.
 */
function srpSignIn({
  email,
  password,
  userPoolId,
  clientId,
}: {
  email: string;
  password: string;
  userPoolId: string;
  clientId: string;
}): Promise<{ idToken: string; sub: string; name?: string }> {
  return new Promise((resolve, reject) => {
    const pool = new CognitoUserPool({ UserPoolId: userPoolId, ClientId: clientId });
    const user = new CognitoUser({ Username: email, Pool: pool });
    const authDetails = new AuthenticationDetails({ Username: email, Password: password });

    user.authenticateUser(authDetails, {
      onSuccess: (session) => {
        const idToken = session.getIdToken().getJwtToken();
        const payload = (typeof session.getIdToken().decodePayload === "function"
          ? session.getIdToken().decodePayload()
          : (session.getIdToken() as unknown as { payload?: Record<string, unknown> }).payload) || {};
        const sub = (payload.sub as string) || "";
        const name = ((payload.name || payload.given_name) as string) || "";
        resolve({ idToken, sub, name });
      },
      onFailure: (err) => {
        reject(err);
      },
    });
  });
}

/**
 * Returns the normalized User Pool ID, auto-correcting any letter 'O' vs digit '0' typo.
 */
function getUserPoolId(): string | undefined {
  const poolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
  if (!poolId) return undefined;
  return poolId.trim().replace("VszJLnOHG", "VszJLn0HG");
}

/**
 * Authenticates a user against Amazon Cognito User Pool.
 * Uses SRP authentication to avoid requiring USER_PASSWORD_AUTH enabled on the client.
 */
export async function cognitoSignIn({ email, password }: CognitoAuthParams): Promise<AuthSession> {
  const userPoolId = getUserPoolId();
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;

  const trimmedEmail = email?.trim().toLowerCase();
  if (!trimmedEmail || !password) {
    throw AppError.badRequest("Email and password are required");
  }

  // If Cognito credentials are fully configured, authenticate with AWS Cognito via SRP
  if (userPoolId && clientId) {
    try {
      const { idToken, sub, name: tokenName } = await srpSignIn({
        email: trimmedEmail,
        password,
        userPoolId,
        clientId,
      });

      const claims = idToken ? parseClaimsFromJwt(idToken) : {};
      const userId = sub || claims.sub || (idToken ? parseSubFromJwt(idToken) : `cognito_${Buffer.from(trimmedEmail).toString("hex").slice(0, 16)}`);
      let name = tokenName?.trim() || claims.name?.trim() || trimmedEmail.split("@")[0];
      if (trimmedEmail === "rhinnanthon@gmail.com" && (!tokenName || name === "rhinnanthon")) {
        name = "Rhinn Anthon William D. Cabas";
      }

      return {
        userId,
        email: trimmedEmail,
        name,
      };
    } catch (err: unknown) {
      if (err instanceof AppError) throw err;
      const cognitoErr = err as { name?: string; message?: string };
      if (cognitoErr.name === "UserNotConfirmedException") {
        throw AppError.forbidden(
          "Your account isn't verified yet. Enter the verification code we emailed you to finish."
        );
      }
      if (cognitoErr.name === "NotAuthorizedException") {
        throw AppError.unauthorized("Incorrect email or password.");
      }
      if (cognitoErr.name === "UserNotFoundException") {
        throw AppError.unauthorized("No account found with this email address.");
      }
      throw AppError.unauthorized(cognitoErr.message || "Authentication failed. Please check your credentials.");
    }
  }

  // Local / Mock Dev Mode: validates format and provides a deterministic session
  if (password.length < 6) {
    throw AppError.badRequest("Password must be at least 6 characters");
  }

  const devName = trimmedEmail === "rhinnanthon@gmail.com" ? "Rhinn Anthon William D. Cabas" : trimmedEmail.split("@")[0];
  return {
    userId: `dev_user_${Buffer.from(trimmedEmail).toString("hex").slice(0, 12)}`,
    email: trimmedEmail,
    name: devName,
  };
}

/**
 * Registers a new user with Amazon Cognito User Pool.
 */
export async function cognitoSignUp({ email, password, name }: CognitoAuthParams): Promise<SignUpResult> {
  const userPoolId = getUserPoolId();
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  const region = getAwsRegion();

  const trimmedEmail = email?.trim().toLowerCase();
  if (!trimmedEmail || !password) {
    throw AppError.badRequest("Email and password are required");
  }

  if (password.length < 8) {
    throw AppError.badRequest("Password must be at least 8 characters");
  }

  const displayName = name?.trim() || trimmedEmail.split("@")[0];

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
          Username: trimmedEmail,
          Password: password,
          UserAttributes: [
            { Name: "email", Value: trimmedEmail },
            { Name: "name", Value: displayName },
          ],
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.__type === "InvalidPasswordException") {
          throw AppError.badRequest(
            "Password does not meet policy requirements: Must be at least 8 characters and include uppercase, lowercase, numbers, and symbols (e.g. !@#$%)."
          );
        }
        if (data.__type === "UsernameExistsException") {
          throw AppError.badRequest("An account with this email already exists. Please sign in instead.");
        }
        throw AppError.badRequest(data.message || "Failed to register user with Cognito");
      }

      return {
        userId: data.UserSub || `cognito_${Buffer.from(trimmedEmail).toString("hex").slice(0, 16)}`,
        email: trimmedEmail,
        name: displayName,
        userConfirmed: data.UserConfirmed === true,
        destination: data.CodeDeliveryDetails?.Destination || trimmedEmail,
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw AppError.badRequest("Registration failed with authentication provider");
    }
  }

  // Local / Mock Dev Mode
  return {
    userId: `dev_user_${Buffer.from(trimmedEmail).toString("hex").slice(0, 12)}`,
    email: trimmedEmail,
    name: displayName,
    userConfirmed: true,
  };
}

/**
 * Confirms user registration with confirmation code sent via email.
 */
export async function cognitoConfirmSignUp({
  email,
  confirmationCode,
}: ConfirmSignUpParams): Promise<void> {
  const userPoolId = getUserPoolId();
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  const region = getAwsRegion();

  const trimmedEmail = email?.trim().toLowerCase();
  const trimmedCode = confirmationCode?.trim();

  if (!trimmedEmail || !trimmedCode) {
    throw AppError.badRequest("Email and confirmation code are required");
  }

  if (userPoolId && clientId) {
    try {
      const response = await fetch(`https://cognito-idp.${region}.amazonaws.com/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-amz-json-1.1",
          "X-Amz-Target": "AWSCognitoIdentityProviderService.ConfirmSignUp",
        },
        body: JSON.stringify({
          ClientId: clientId,
          Username: trimmedEmail,
          ConfirmationCode: trimmedCode,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.__type === "CodeMismatchException") {
          throw AppError.badRequest("Invalid confirmation code. Please check your email and try again.");
        }
        if (data.__type === "ExpiredCodeException") {
          throw AppError.badRequest("Confirmation code has expired. Please request a new code.");
        }
        if (data.__type === "NotAuthorizedException" && data.message?.includes("confirmed")) {
          return;
        }
        throw AppError.badRequest(data.message || "Failed to confirm account");
      }

      return;
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw AppError.badRequest("Failed to verify confirmation code");
    }
  }

  // Dev / Mock Mode:
  if (trimmedCode.length < 4) {
    throw AppError.badRequest("Confirmation code must be at least 4 characters");
  }
}

/**
 * Resends user registration confirmation code.
 */
export async function cognitoResendConfirmationCode(email: string): Promise<{ destination: string }> {
  const userPoolId = getUserPoolId();
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
          "X-Amz-Target": "AWSCognitoIdentityProviderService.ResendConfirmationCode",
        },
        body: JSON.stringify({
          ClientId: clientId,
          Username: trimmedEmail,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.__type === "InvalidParameterException" && data.message?.includes("already confirmed")) {
          throw AppError.badRequest("This account is already confirmed. You can sign in directly.");
        }
        throw AppError.badRequest(data.message || "Failed to resend confirmation code");
      }

      return {
        destination: data.CodeDeliveryDetails?.Destination || trimmedEmail,
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw AppError.badRequest("Unable to resend confirmation code");
    }
  }

  // Dev / Mock Mode:
  return { destination: trimmedEmail };
}

function parseClaimsFromJwt(token: string): { sub?: string; name?: string; email?: string } {
  try {
    const parts = token.split(".");
    if (parts.length >= 2) {
      const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
      return {
        sub: payload.sub,
        name: payload.name || payload.given_name,
        email: payload.email,
      };
    }
    return {};
  } catch {
    return {};
  }
}

function parseSubFromJwt(token: string): string {
  return parseClaimsFromJwt(token).sub || "";
}

/**
 * Initiates the password recovery flow via Amazon Cognito User Pool.
 * Sends a confirmation code to the user's verified email.
 */
export async function cognitoForgotPassword(email: string): Promise<ForgotPasswordResult> {
  const userPoolId = getUserPoolId();
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
          if (data.message?.includes("no registered/verified email")) {
            throw AppError.badRequest(
              "This account hasn't been verified yet. Sign in with your email and password and you'll be asked for the verification code."
            );
          }
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
  const userPoolId = getUserPoolId();
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
