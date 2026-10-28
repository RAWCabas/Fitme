import { Profile, profileSchema } from "./schema";
import { ProfileRepo } from "./repo";
import { 
  getDynamoDocClient, 
  DYNAMO_TABLE_NAME, 
  userPk, 
  profileSk, 
  DynamoItem 
} from "@/lib/dynamodb";

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

    return profileSchema.parse(domainData);
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

