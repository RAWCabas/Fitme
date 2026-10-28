# GEMINI.md

You are building Fitme: an AI Resume Tailor & Job Application Pipeline.
Read this file at the start of every chat, before anything else.

## What decides, in this order

1. **`_masterplan/data-structures/`** decides every **shape**: field names, types, enums, bounds,
   keys, table schemas, repository interfaces, request/response bodies, MCP tool payloads.
   If the code and this folder disagree, this folder is right.
2. **`_masterplan/design/<the brief you were given>`** decides **what to build now and how**:
   which files, which steps, which tests, where to stop.
3. **`AGENTS.md`** decides how to work: commands, conventions, quality gates, the never-list.
4. The rest of **`_masterplan/`** (architecture, testing, mcp, aws, security) is reference
   background that briefs point you to.
5. **The code already in the repo**: follow its patterns where the plan is silent.
6. **Habits / prior knowledge** come **last**. When habit and the plan differ (field name,
   folder structure, library), the plan wins.

## The contracts you never break

| Between | The contract | Defined in |
| :--- | :--- | :--- |
| Every part | One Zod schema per entity; every type is `z.infer`/`z.input` of it | `data-structures/domain-types.md` → `src/features/<feature>/schema.ts` |
| UI ↔ API | JSON bodies and responses match schemas; errors as `{ "error": "<sentence>" }` | `data-structures/domain-types.md` § the wire |
| Route / MCP tool ↔ service | Services take `unknown` or authenticated session input and parse with Zod schemas; routes never validate independently | `architecture/folder-structure.md` § the service |
| Service ↔ repo | Repository interfaces (`ProfileRepo`, `ApplicationRepo`, etc.) take and return complete domain records | `architecture/folder-structure.md` § repository interfaces |
| Repo ↔ DynamoDB | Tenant isolation via `PK = USER#<userId>`; sort keys match access patterns | `data-structures/dynamodb.md` |
| AI calls ↔ Bedrock | Amazon Bedrock (Claude 3.5 Haiku) wrapped in `src/lib/bedrock.ts`; structured JSON output validated through Zod | `architecture/tech-stack.md` § Bedrock |
| Everything ↔ time | Dates `YYYY-MM-DD`, times ISO UTC with milliseconds, via `src/lib/dates.ts` | `data-structures/domain-types.md` § dates |

### So, always
- **Import** schemas and types from `src/features/<feature>/schema.ts`. Never re-declare entity types inline.
- **Copy** schemas from `_masterplan/data-structures/domain-types.md` exactly: field names, validation constraints, and defaults.
- **Keep data tenant-isolated**: Every DynamoDB read/write must use the authenticated Cognito `userId`.
- **Go through the layers**: Route / Server Action / MCP Tool → Service → Repository. Never skip a layer.
- **Support both Desktop & Mobile**: All UI components must use responsive Tailwind breakpoints (`md:`, `lg:`), ensuring mobile layouts have proper touch targets and tabbed/drawer navigation.

### And never
- Never hardcode user IDs, AWS credentials, or secrets in code or git.
- Never add, remove, or rename entity fields without updating `_masterplan/data-structures/`.
- Never call DynamoDB or Bedrock directly from a client component or route handler.
- Never skip, disable, or delete a test to make a check pass.

