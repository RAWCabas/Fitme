import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  cognitoSignIn,
  cognitoSignUp,
  cognitoForgotPassword,
  cognitoConfirmForgotPassword,
} from "@/lib/auth/cognito";
import { POST as loginHandler } from "@/app/api/auth/login/route";
import { POST as registerHandler } from "@/app/api/auth/register/route";
import { POST as logoutHandler } from "@/app/api/auth/logout/route";
import { GET as meHandler } from "@/app/api/auth/me/route";
import { POST as forgotPasswordHandler } from "@/app/api/auth/forgot-password/route";
import { POST as resetPasswordHandler } from "@/app/api/auth/reset-password/route";

// Mock next/headers cookies
const mockCookieStore = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      const val = mockCookieStore.get(name);
      return val ? { name, value: val } : undefined;
    },
    set: (name: string, value: string) => {
      mockCookieStore.set(name, value);
    },
    delete: (name: string) => {
      mockCookieStore.delete(name);
    },
  }),
}));

describe("Auth: Cognito Service", () => {
  it("authenticates valid credentials in dev mode", async () => {
    const session = await cognitoSignIn({
      email: "test@example.com",
      password: "secretpassword123",
    });

    expect(session.email).toBe("test@example.com");
    expect(session.userId).toBeDefined();
    expect(session.userId.startsWith("dev_user_")).toBe(true);
  });

  it("rejects invalid passwords in dev mode", async () => {
    await expect(
      cognitoSignIn({ email: "test@example.com", password: "123" })
    ).rejects.toThrow("Password must be at least 6 characters");
  });

  it("registers a new user in dev mode", async () => {
    const session = await cognitoSignUp({
      name: "Taylor Swift",
      email: "taylor@example.com",
      password: "password1234",
    });

    expect(session.name).toBe("Taylor Swift");
    expect(session.email).toBe("taylor@example.com");
    expect(session.userId).toBeDefined();
  });

  it("rejects registration with short password", async () => {
    await expect(
      cognitoSignUp({
        name: "Short Pass",
        email: "short@example.com",
        password: "short",
      })
    ).rejects.toThrow("Password must be at least 8 characters");
  });
  it("initiates password recovery in dev mode", async () => {
    const res = await cognitoForgotPassword("user@fitme.dev");
    expect(res.deliveryMedium).toBe("EMAIL");
    expect(res.destination).toBe("user@fitme.dev");
  });

  it("confirms password reset with valid code and password in dev mode", async () => {
    await expect(
      cognitoConfirmForgotPassword({
        email: "user@fitme.dev",
        confirmationCode: "123456",
        newPassword: "newsecurepassword123",
      })
    ).resolves.toBeUndefined();
  });

  it("rejects password reset with short password", async () => {
    await expect(
      cognitoConfirmForgotPassword({
        email: "user@fitme.dev",
        confirmationCode: "123456",
        newPassword: "short",
      })
    ).rejects.toThrow("Password must be at least 8 characters");
  });
});

describe("Auth: API Route Handlers", () => {
  it("rejects login with malformed email", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "not-an-email", password: "password123" }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Please provide a valid email");
  });

  it("successfully logs in and creates a session cookie", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "user@fitme.dev", password: "validpassword123" }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.email).toBe("user@fitme.dev");
    expect(mockCookieStore.has("fitme_session")).toBe(true);
  });

  it("returns current user session via GET /api/auth/me", async () => {
    const res = await meHandler();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.email).toBe("user@fitme.dev");
  });

  it("clears session on logout", async () => {
    const res = await logoutHandler();
    expect(res.status).toBe(200);
    expect(mockCookieStore.has("fitme_session")).toBe(false);

    // Subsequent /api/auth/me should answer 401
    const meRes = await meHandler();
    expect(meRes.status).toBe(401);
  });

  it("handles forgot-password route with valid and invalid email", async () => {
    // Malformed email
    const badReq = new NextRequest("http://localhost:3000/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email: "invalid-email" }),
    });
    const badRes = await forgotPasswordHandler(badReq);
    expect(badRes.status).toBe(400);

    // Valid email
    const goodReq = new NextRequest("http://localhost:3000/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email: "valid@example.com" }),
    });
    const goodRes = await forgotPasswordHandler(goodReq);
    expect(goodRes.status).toBe(200);
    const body = await goodRes.json();
    expect(body.ok).toBe(true);
    expect(body.message).toContain("Verification code sent");
  });

  it("handles reset-password route with valid and invalid parameters", async () => {
    // Invalid: missing code
    const missingCodeReq = new NextRequest("http://localhost:3000/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({
        email: "valid@example.com",
        confirmationCode: "",
        newPassword: "newpassword123",
      }),
    });
    const missingCodeRes = await resetPasswordHandler(missingCodeReq);
    expect(missingCodeRes.status).toBe(400);

    // Invalid: password too short
    const shortPassReq = new NextRequest("http://localhost:3000/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({
        email: "valid@example.com",
        confirmationCode: "123456",
        newPassword: "short",
      }),
    });
    const shortPassRes = await resetPasswordHandler(shortPassReq);
    expect(shortPassRes.status).toBe(400);

    // Valid
    const validReq = new NextRequest("http://localhost:3000/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({
        email: "valid@example.com",
        confirmationCode: "123456",
        newPassword: "brandnewpassword123",
      }),
    });
    const validRes = await resetPasswordHandler(validReq);
    expect(validRes.status).toBe(200);
    const validBody = await validRes.json();
    expect(validBody.ok).toBe(true);
  });
});

