import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "./errors";

/**
 * Uniform success JSON response helper.
 */
export function jsonResponse<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}

/**
 * Standardized error handler converting AppError and ZodError to wire format:
 * { "error": "<message>" }
 */
export function errorResponse(error: unknown): NextResponse<{ error: string }> {
  if (error instanceof AppError) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode });
  }

  if (error instanceof ZodError) {
    const firstIssue = error.issues[0];
    const message = firstIssue
      ? `${firstIssue.path.length ? `${firstIssue.path.join(".")}: ` : ""}${firstIssue.message}`
      : "Invalid input data";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
