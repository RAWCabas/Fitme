import { describe, it, expect } from "vitest";
import { z } from "zod";
import { AppError } from "@/lib/errors";
import { errorResponse, jsonResponse } from "@/lib/http";
import { nowIso, todayIso, formatDisplayDate, formatRelativeTime } from "@/lib/dates";
import { getDataStore, getVersion } from "@/lib/config";
import { GET as healthHandler } from "@/app/api/health/route";

describe("Foundation: AppError", () => {
  it("creates custom errors with correct status codes", () => {
    const err = new AppError("Something went wrong", 400);
    expect(err.message).toBe("Something went wrong");
    expect(err.statusCode).toBe(400);
  });

  it("provides standard static helpers", () => {
    expect(AppError.badRequest("Invalid").statusCode).toBe(400);
    expect(AppError.unauthorized().statusCode).toBe(401);
    expect(AppError.forbidden().statusCode).toBe(403);
    expect(AppError.notFound().statusCode).toBe(404);
    expect(AppError.internal().statusCode).toBe(500);
  });
});

describe("Foundation: Date Helpers", () => {
  it("generates valid ISO timestamps and date strings", () => {
    const now = nowIso();
    expect(now).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

    const today = todayIso();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("formats display dates", () => {
    expect(formatDisplayDate("2026-10-29T12:00:00.000Z")).toBe("Oct 29, 2026");
    expect(formatDisplayDate(null)).toBe("");
  });

  it("formats relative times", () => {
    const recent = new Date(Date.now() - 30 * 1000).toISOString();
    expect(formatRelativeTime(recent)).toBe("just now");

    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatRelativeTime(fiveMinAgo)).toBe("5 minutes ago");
  });
});

describe("Foundation: HTTP Response Helpers", () => {
  it("formats success JSON responses", async () => {
    const res = jsonResponse({ hello: "world" }, 201);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toEqual({ hello: "world" });
  });

  it("handles AppError in errorResponse", async () => {
    const res = errorResponse(AppError.notFound("Resource missing"));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({ error: "Resource missing" });
  });

  it("handles ZodError in errorResponse", async () => {
    const testSchema = z.object({ name: z.string().min(3) });
    const parseResult = testSchema.safeParse({ name: "a" });
    if (!parseResult.success) {
      const res = errorResponse(parseResult.error);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("name: String must contain at least 3 character(s)");
    }
  });

  it("handles unknown errors in errorResponse", async () => {
    const res = errorResponse(new Error("Database crash"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Database crash");
  });
});

describe("Foundation: Health Endpoint & Config", () => {
  it("returns default config values", () => {
    expect(getDataStore()).toBe("memory");
    expect(getVersion()).toBe("0.1.0");
  });

  it("responds from GET /api/health with status 200", async () => {
    const res = await healthHandler();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.store).toBe("memory");
    expect(body.version).toBe("0.1.0");
    expect(body.timestamp).toBeDefined();
  });
});
