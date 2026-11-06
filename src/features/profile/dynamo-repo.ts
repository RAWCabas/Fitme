import crypto from "crypto";
import { Profile, profileSchema } from "./schema";
import { ProfileRepo } from "./repo";
import { 
  getDynamoDocClient, 
  DYNAMO_TABLE_NAME, 
  userPk, 
  profileSk, 
  DynamoItem 
} from "@/lib/dynamodb";

function toUuid(id?: unknown): string {
  if (typeof id === "string") {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(id)) return id;
  }
  return crypto.randomUUID();
}

function normalizeLegacyProfileData(raw: Record<string, unknown>): Record<string, unknown> {
  const experiences = Array.isArray(raw.experiences)
    ? raw.experiences.map((exp: Record<string, unknown>) => ({
        ...exp,
        id: toUuid(exp.id),
        bullets: Array.isArray(exp.bullets)
          ? exp.bullets.map((b: Record<string, unknown>) => ({ ...b, id: toUuid(b.id) }))
          : [],
      }))
    : [];

  const projects = Array.isArray(raw.projects)
    ? raw.projects.map((proj: Record<string, unknown>) => ({
        ...proj,
        id: toUuid(proj.id),
        bullets: Array.isArray(proj.bullets)
          ? proj.bullets.map((b: Record<string, unknown>) => ({ ...b, id: toUuid(b.id) }))
          : [],
      }))
    : [];

  const skills = Array.isArray(raw.skills)
    ? raw.skills.map((skill: Record<string, unknown>) => ({
        ...skill,
        id: toUuid(skill.id),
      }))
    : [];

  const education = Array.isArray(raw.education)
    ? raw.education.map((edu: Record<string, unknown>) => ({
        ...edu,
        id: toUuid(edu.id),
      }))
    : [];

  const certifications = Array.isArray(raw.certifications)
    ? raw.certifications.map((cert: Record<string, unknown>) => ({
        ...cert,
        id: toUuid(cert.id),
      }))
    : [];

  const hiddenContactFields = Array.isArray(raw.hiddenContactFields)
    ? raw.hiddenContactFields
    : [];

  return {
    ...raw,
    experiences,
    projects,
    skills,
    education,
    certifications,
    hiddenContactFields,
  };
}

export class DynamoProfileRepo implements ProfileRepo {
  constructor(private tableName = DYNAMO_TABLE_NAME) {}

  async getProfile(userId: string): Promise<Profile | null> {
    const docClient = getDynamoDocClient();
    const result = await docClient.get({
      TableName: this.tableName,
      Key: {
        PK: userPk(userId),
        SK: profileSk(),
      },
    });

    if (!result.Item) return null;

    // Strip DynamoDB key attributes before parsing domain schema
    const { PK, SK, entityType, GSI1PK, GSI1SK, ...domainData } = result.Item;
    void PK; void SK; void entityType; void GSI1PK; void GSI1SK;

    const normalized = normalizeLegacyProfileData(domainData);
    return profileSchema.parse(normalized);
  }

  async saveProfile(profile: Profile): Promise<Profile> {
    const docClient = getDynamoDocClient();
    const validated = profileSchema.parse(profile);

    const item: DynamoItem = {
      PK: userPk(validated.userId),
      SK: profileSk(),
      entityType: "PROFILE",
      ...validated,
    };

    await docClient.put({
      TableName: this.tableName,
      Item: item,
    });

    return validated;
  }
}

