import { 
  JobOpportunity, 
  jobOpportunitySchema, 
  TailoredResume, 
  tailoredResumeSchema, 
  ResumeStatus 
} from "./schema";
import { TailorRepo } from "./repo";
import { AppError } from "@/lib/errors";
import { nowIso } from "@/lib/dates";
import { 
  getDynamoDocClient, 
  DYNAMO_TABLE_NAME, 
  userPk, 
  jobSk, 
  resumeSk, 
  gsi1Pk, 
  DynamoItem 
} from "@/lib/dynamodb";

export class DynamoTailorRepo implements TailorRepo {
  constructor(private tableName = DYNAMO_TABLE_NAME) {}

  async saveJobOpportunity(job: JobOpportunity): Promise<JobOpportunity> {
    const docClient = getDynamoDocClient();
    const validated = jobOpportunitySchema.parse(job);

    const item: DynamoItem = {
      PK: userPk(validated.userId),
      SK: jobSk(validated.id),
      entityType: "JOB",
      ...validated,
    };

    await docClient.put({
      TableName: this.tableName,
      Item: item,
    });

    return validated;
  }

  async getJobOpportunity(userId: string, id: string): Promise<JobOpportunity | null> {
    const docClient = getDynamoDocClient();
    const result = await docClient.get({
      TableName: this.tableName,
      Key: {
        PK: userPk(userId),
        SK: jobSk(id),
      },
    });

    if (!result.Item) return null;

    const { PK, SK, entityType, GSI1PK, GSI1SK, ...domainData } = result.Item;
    void PK; void SK; void entityType; void GSI1PK; void GSI1SK;

    return jobOpportunitySchema.parse(domainData);
  }

  async saveTailoredResume(resume: TailoredResume): Promise<TailoredResume> {
    const docClient = getDynamoDocClient();
    const validated = tailoredResumeSchema.parse(resume);

    const item: DynamoItem = {
      PK: userPk(validated.userId),
      SK: resumeSk(validated.jobOpportunityId, validated.id),
      GSI1PK: gsi1Pk(validated.userId, validated.status),
      GSI1SK: validated.updatedAt,
      entityType: "RESUME",
      ...validated,
    };

    await docClient.put({
      TableName: this.tableName,
      Item: item,
    });

    return validated;
  }

  async getTailoredResume(userId: string, id: string): Promise<TailoredResume | null> {
    const docClient = getDynamoDocClient();
    const cleanId = id.trim();
    const hyphenId = cleanId.replace(/\s+/g, "-");

    const queryResult = await docClient.query({
      TableName: this.tableName,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
      ExpressionAttributeValues: {
        ":pk": userPk(userId),
        ":skPrefix": "RESUME#",
      },
    });

    if (!queryResult.Items || queryResult.Items.length === 0) return null;

    const matched = queryResult.Items.find((item) => item.id === cleanId || item.id === hyphenId);
    if (!matched) return null;

    const { PK, SK, entityType, GSI1PK, GSI1SK, ...domainData } = matched;
    void PK; void SK; void entityType; void GSI1PK; void GSI1SK;

    return tailoredResumeSchema.parse(domainData);
  }

  async listTailoredResumes(userId: string, jobId?: string): Promise<TailoredResume[]> {
    const docClient = getDynamoDocClient();
    const queryResult = await docClient.query({
      TableName: this.tableName,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
      ExpressionAttributeValues: {
        ":pk": userPk(userId),
        ":skPrefix": jobId ? `RESUME#${jobId}#` : "RESUME#",
      },
    });

    if (!queryResult.Items) return [];

    const resumes: TailoredResume[] = queryResult.Items.map((item) => {
      const { PK, SK, entityType, GSI1PK, GSI1SK, ...domainData } = item;
      void PK; void SK; void entityType; void GSI1PK; void GSI1SK;
      return tailoredResumeSchema.parse(domainData);
    });

    return resumes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async updateResumeStatus(userId: string, id: string, status: ResumeStatus): Promise<TailoredResume> {
    const resume = await this.getTailoredResume(userId, id);
    if (!resume) throw AppError.notFound("Tailored resume not found");

    resume.status = status;
    resume.updatedAt = nowIso();

    return await this.saveTailoredResume(resume);
  }

  async deleteTailoredResume(userId: string, id: string): Promise<void> {
    const docClient = getDynamoDocClient();
    const resume = await this.getTailoredResume(userId, id);
    if (!resume) return;

    await docClient.delete({
      TableName: this.tableName,
      Key: {
        PK: userPk(userId),
        SK: resumeSk(resume.jobOpportunityId, resume.id),
      },
    });
  }
}

