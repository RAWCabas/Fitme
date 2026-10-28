import packageJson from "../../package.json";

export type DataStoreType = "memory" | "dynamo";

export function getDataStore(): DataStoreType {
  const store = process.env.DATA_STORE?.toLowerCase();
  return store === "dynamo" ? "dynamo" : "memory";
}

export function getVersion(): string {
  return packageJson.version || "0.1.0";
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

