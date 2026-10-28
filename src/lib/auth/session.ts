import { cookies } from "next/headers";
import { AppError } from "@/lib/errors";

export interface AuthSession {
  userId: string;
  email: string;
  name: string;
}

export const SESSION_COOKIE_NAME = "fitme_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

/**
 * Encodes session data safely for the cookie value.
 */
function encodeSession(session: AuthSession): string {
  const json = JSON.stringify(session);
  return Buffer.from(json, "utf-8").toString("base64url");
}

/**
 * Decodes session data from cookie value.
 */
function decodeSession(value: string): AuthSession | null {
  try {
    const json = Buffer.from(value, "base64url").toString("utf-8");
    const parsed = JSON.parse(json) as AuthSession;
    if (parsed && typeof parsed.userId === "string" && typeof parsed.email === "string") {
      return {
        userId: parsed.userId,
        email: parsed.email,
        name: parsed.name || parsed.email.split("@")[0] || "User",
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Retrieves the current authenticated session from cookies, or null if unauthenticated.
 */
export async function getSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (!sessionCookie?.value) {
    return null;
  }
  return decodeSession(sessionCookie.value);
}

/**
 * Retrieves the current session or throws an unauthorized AppError.
 */
export async function requireSession(): Promise<AuthSession> {
  const session = await getSession();
  if (!session) {
    throw AppError.unauthorized("Authentication required. Please sign in.");
  }
  return session;
}

/**
 * Sets the HttpOnly session cookie.
 */
export async function setSessionCookie(session: AuthSession): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, encodeSession(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
}

/**
 * Clears the session cookie on sign out.
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
