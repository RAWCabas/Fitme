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

export function getAwsRegion(): string {
  return process.env.FITME_AWS_REGION || process.env.AWS_REGION || "ap-southeast-2";
}

export function getAwsCredentials() {
  const accessKeyId = process.env.FITME_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.FITME_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
  if (accessKeyId && secretAccessKey) {
    return { accessKeyId, secretAccessKey };
  }
  return undefined;
}
