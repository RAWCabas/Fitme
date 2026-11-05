/**
 * One-off tenant data migration: copies every item from one USER# partition to another.
 *
 * Usage (dry run is the default; the source is NEVER deleted):
 *   node --env-file=.env.local scripts/migrate-user-data.mjs --from dev_user_7268696e6e61 --to <cognito-sub>
 *   node --env-file=.env.local scripts/migrate-user-data.mjs --from ... --to ... --apply
 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const args = process.argv.slice(2);
const get = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};
const from = get("--from");
const to = get("--to");
const apply = args.includes("--apply");

if (!from || !to || from === to) {
  console.error("Usage: --from <oldUserId> --to <newUserId> [--apply]");
  process.exit(1);
}

const table = process.env.DYNAMODB_TABLE_NAME;
const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));

const oldPk = `USER#${from}`;
const newPk = `USER#${to}`;

const items = [];
let key;
do {
  const res = await client.send(
    new QueryCommand({
      TableName: table,
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: { ":pk": oldPk },
      ExclusiveStartKey: key,
    })
  );
  items.push(...(res.Items ?? []));
  key = res.LastEvaluatedKey;
} while (key);

console.log(`${apply ? "APPLY" : "DRY RUN"}: ${items.length} item(s) under ${oldPk} -> ${newPk}`);

for (const item of items) {
  const copy = { ...item, PK: newPk, userId: to };
  if (typeof copy.GSI1PK === "string") {
    copy.GSI1PK = copy.GSI1PK.replace(oldPk, newPk);
  }
  console.log(` - ${item.SK}`);
  if (apply) {
    await client.send(new PutCommand({ TableName: table, Item: copy }));
  }
}

console.log(apply ? "Done. Source items were left in place as a backup." : "Nothing written. Re-run with --apply.");

