import { describe, it, expect } from "vitest";
import { GET as healthHandler } from "@/app/api/health/route";
import { getVersion, getDataStore, getAppUrl } from "@/lib/config";

describe("Deploy Readiness: Health & Environment", () => {
  it("returns 200 status with valid system metadata on /api/health", async () => {
    const res = await healthHandler();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.version).toBeDefined();
    expect(body.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(["memory", "dynamo"]).toContain(body.store);
  });

  it("exposes valid semantic version and environment configuration", () => {
    const version = getVersion();
    expect(version).toMatch(/^\d+\.\d+\.\d+/);

    const dataStore = getDataStore();
    expect(["memory", "dynamo"]).toContain(dataStore);

    const appUrl = getAppUrl();
    expect(appUrl.startsWith("http")).toBe(true);
  });
});
