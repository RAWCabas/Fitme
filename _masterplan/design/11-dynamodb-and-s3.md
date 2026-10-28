# Brief 11: DynamoDB & S3 Persistence

Implement the single-table DynamoDB repositories (`fitme-main`) with strict Cognito `USER#<userId>` partition isolation and Amazon S3 presigned PDF storage, with seamless runtime switching based on `DATA_STORE=dynamo|memory`.

## Read First
- `GEMINI.md`
- `AGENTS.md`
- `_masterplan/data-structures/dynamodb.md`
- `_masterplan/architecture/tech-stack.md` § 3 (Data & Storage Architecture)

## What to Build

1. **`src/lib/dynamodb.ts`**:
   - DynamoDB client wrapper with safe dynamic import and DocumentClient marshaling.
   - Key formatting helpers (`userPk`, `profileSk`, `jobSk`, `resumeSk`, `gsi1Pk`).
   - Mock DynamoDB Document client for testing and offline environments.
2. **`src/lib/s3.ts`**:
   - S3 client wrapper for presigned upload and download URLs (`getUploadPresignedUrl`, `getDownloadPresignedUrl`).
   - Graceful offline fallback.
3. **`src/features/profile/dynamo-repo.ts`**:
   - `DynamoProfileRepo` implementing `ProfileRepo`:
     - `getProfile(userId: string): Promise<Profile | null>`
     - `saveProfile(profile: Profile): Promise<Profile>`
4. **`src/features/tailor/dynamo-repo.ts`**:
   - `DynamoTailorRepo` implementing `TailorRepo`:
     - `saveJobOpportunity`, `getJobOpportunity`
     - `saveTailoredResume`, `getTailoredResume`, `listTailoredResumes`, `updateResumeStatus`
     - Maps to `PK = USER#<userId>`, `SK = JOB#<jobId>` / `RESUME#<jobOpportunityId>#<id>`, and GSI1 for status querying.
5. **Update Repository Factories**:
   - `src/features/profile/repo.ts`: Return `DynamoProfileRepo` when `getDataStore() === "dynamo"`.
   - `src/features/tailor/repo.ts`: Return `DynamoTailorRepo` when `getDataStore() === "dynamo"`.
6. **`tests/dynamo-persistence.test.ts`**:
   - Unit tests for key helpers and entity transformations.
   - Tests verifying `DynamoProfileRepo` and `DynamoTailorRepo` enforce multi-tenant `USER#<userId>` boundaries and round-trip domain entities through DynamoDB item schemas.

## Acceptance Criteria
- [ ] DynamoDB schema matches `_masterplan/data-structures/dynamodb.md` strictly (`PK = USER#<userId>`).
- [ ] All queries preserve tenant isolation (no cross-user scans or leakage).
- [ ] S3 presigned URL helpers handle uploads and downloads.
- [ ] `npm run check` passes with 0 lint, type, or test errors.
- [ ] Semantic commit message: `feat(aws): implement dynamodb single-table repositories and s3 presigned storage`

