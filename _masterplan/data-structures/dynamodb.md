# DynamoDB Single-Table Design

Fitme uses a single DynamoDB table (`fitme-main`) with on-demand capacity, partitioned strictly by `userId` to ensure complete multi-tenant data isolation.

---

## Keys & Table Structure

| Primary Key | Type | Description |
| :--- | :--- | :--- |
| **PK** (Partition Key) | `String` | `USER#<cognito_sub>` |
| **SK** (Sort Key) | `String` | Entity discriminator + ID |

### Global Secondary Indexes (GSI1)

Used for cross-entity lifecycle querying (e.g., retrieving all active applications across statuses or fetching aging applications):

- **GSI1PK:** `USER#<cognito_sub>#STATUS#<status>`
- **GSI1SK:** `<updatedAt>`

---

## Entity Mappings

| Entity | PK | SK | Description / Access Pattern |
| :--- | :--- | :--- | :--- |
| **Master Profile** | `USER#<userId>` | `PROFILE` | Fast single-item read for the user's master experience vault. |
| **Job Opportunity** | `USER#<userId>` | `JOB#<jobId>` | Stored JD and extracted metadata. |
| **Tailored Resume** | `USER#<userId>` | `RESUME#<jobId>#<versionId>` | Specific tailored resume version with its fit score and content. |
| **Booster Content** | `USER#<userId>` | `BOOSTER#<resumeId>` | Optional generated cover letters, cheat sheets, outreach notes. |
| **Application Note** | `USER#<userId>` | `NOTE#<jobId>#<createdAt>` | Status changes and manual application notes. |

---

## Common Query Patterns

1. **Load Master Profile:**
   `GetItem(PK = "USER#<userId>", SK = "PROFILE")`
2. **List All Resumes / Applications for User:**
   `Query(PK = "USER#<userId>", SK begins_with "RESUME#")`
3. **List Resumes by Status (e.g., all `interview` or `sent`):**
   `Query(GSI1PK = "USER#<userId>#STATUS#sent", ScanIndexForward = false)`
4. **Load Specific Tailored Version:**
   `GetItem(PK = "USER#<userId>", SK = "RESUME#<jobId>#<versionId>")`

