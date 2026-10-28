import { getDataStore } from "@/lib/config";

export const DYNAMO_TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "fitme-main";

/** Single-table key helpers */
export function userPk(userId: string): string {
  return `USER#${userId}`;
}

export function profileSk(): string {
  return "PROFILE";
}

export function jobSk(jobId: string): string {
  return `JOB#${jobId}`;
}

export function resumeSk(jobOpportunityId: string, resumeId: string): string {
  return `RESUME#${jobOpportunityId}#${resumeId}`;
}

export function gsi1Pk(userId: string, status: string): string {
  return `USER#${userId}#STATUS#${status}`;
}

export interface DynamoItem {
  PK: string;
  SK: string;
  GSI1PK?: string;
  GSI1SK?: string;
  entityType: string;
  [key: string]: unknown;
}

export interface IDynamoDocClient {
  get(params: { TableName: string; Key: { PK: string; SK: string } }): Promise<{ Item?: DynamoItem }>;
  put(params: { TableName: string; Item: DynamoItem }): Promise<void>;
  query(params: {
    TableName: string;
    KeyConditionExpression: string;
    ExpressionAttributeValues: Record<string, unknown>;
    ExpressionAttributeNames?: Record<string, string>;
    IndexName?: string;
    ScanIndexForward?: boolean;
  }): Promise<{ Items?: DynamoItem[] }>;
  delete(params: { TableName: string; Key: { PK: string; SK: string } }): Promise<void>;
}

/** In-memory simulated DynamoDB DocumentClient for tests and offline local execution */
export class MemoryDynamoDocClient implements IDynamoDocClient {
  private store = new Map<string, DynamoItem>();

  async get(params: { TableName: string; Key: { PK: string; SK: string } }): Promise<{ Item?: DynamoItem }> {
    const key = `${params.Key.PK}##${params.Key.SK}`;
    const item = this.store.get(key);
    return { Item: item ? JSON.parse(JSON.stringify(item)) : undefined };
  }

  async put(params: { TableName: string; Item: DynamoItem }): Promise<void> {
    const key = `${params.Item.PK}##${params.Item.SK}`;
    this.store.set(key, JSON.parse(JSON.stringify(params.Item)));
  }

  async query(params: {
    TableName: string;
    KeyConditionExpression: string;
    ExpressionAttributeValues: Record<string, unknown>;
    IndexName?: string;
  }): Promise<{ Items?: DynamoItem[] }> {
    const results: DynamoItem[] = [];

    // Query on GSI1
    if (params.IndexName === "GSI1") {
      const targetGsi = params.ExpressionAttributeValues[":gsi1pk"] as string;
      for (const item of this.store.values()) {
        if (item.GSI1PK === targetGsi) {
          results.push(JSON.parse(JSON.stringify(item)));
        }
      }
      return { Items: results };
    }

    // Main table query on PK
    const targetPk = params.ExpressionAttributeValues[":pk"] as string;
    const prefix = params.ExpressionAttributeValues[":skPrefix"] as string | undefined;

    for (const item of this.store.values()) {
      if (item.PK === targetPk) {
        if (!prefix || item.SK.startsWith(prefix)) {
          results.push(JSON.parse(JSON.stringify(item)));
        }
      }
    }

    return { Items: results };
  }

  async delete(params: { TableName: string; Key: { PK: string; SK: string } }): Promise<void> {
    const key = `${params.Key.PK}##${params.Key.SK}`;
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

let activeDocClient: IDynamoDocClient | null = null;

export function getDynamoDocClient(): IDynamoDocClient {
  if (activeDocClient) return activeDocClient;

  // If local memory store is requested, use in-memory Dynamo simulation
  if (getDataStore() !== "dynamo") {
    activeDocClient = new MemoryDynamoDocClient();
    return activeDocClient;
  }

  // AWS DynamoDB SDK initialization
  try {
    /* @vite-ignore */
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");

    const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
    const docClient = DynamoDBDocumentClient.from(ddbClient);

    activeDocClient = {
      async get(params) {
        return await docClient.send(new GetCommand(params));
      },
      async put(params) {
        await docClient.send(new PutCommand(params));
      },
      async query(params) {
        return await docClient.send(new QueryCommand(params));
      },
      async delete(params) {
        await docClient.send(new DeleteCommand(params));
      },
    };
    return activeDocClient;
  } catch {
    // Graceful fallback to memory client if AWS SDK is not installed or configured
    activeDocClient = new MemoryDynamoDocClient();
    return activeDocClient;
  }
}

export function setDynamoDocClient(client: IDynamoDocClient | null): void {
  activeDocClient = client;
}

