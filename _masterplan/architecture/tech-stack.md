# Tech Stack

The technology stack for Fitme, chosen for speed, developer ergonomics, multi-tenancy, and cloud-native cost efficiency.

---

## 1. Frontend & Application Layer
- **Framework:** Next.js 15 (App Router, React 19, Server Components & Server Actions).
- **Language:** TypeScript 5.x (Strict mode enabled, no `any`).
- **Styling:** Tailwind CSS v4 + `shadcn/ui` (accessible Radix UI primitives, Lucide icons).
- **Responsive Target:** Mobile (<768px), Tablet (768px-1024px), Desktop (>1024px).
- **Resume Rendering:** `@react-pdf/renderer` for deterministic ATS PDF generation + `@tailwindcss/typography` for Markdown preview.

## 2. Authentication & Multi-Tenancy
- **Service:** Amazon Cognito User Pools.
- **Tenant Key:** `userId = session.sub`.
- **Session Management:** Secure HttpOnly session tokens or Cognito refresh tokens.
- **Multi-tenant Guarantee:** Every repository query/mutation includes `userId` in the partition key.

## 3. Database & Storage
- **Primary Database:** Amazon DynamoDB (Single-table design with on-demand billing).
- **Local / Test Database:** In-memory repository implementation adhering strictly to domain repository interfaces.
- **File Storage:** Amazon S3 with presigned upload/download URLs for generated PDFs and original uploaded resumes.

## 4. AI & LLM Engine
- **Provider:** Amazon Bedrock.
- **Model:** Anthropic Claude 3.5 Haiku (`anthropic.claude-3-5-haiku-20241022-v1:0`).
  - *Rationale:* Extremely low latency (~1s), low token cost ($0.80 / 1M input, $4.00 / 1M output), exceptional instruction-following for JSON schema extraction and bullet-point rewriting.
- **Client Wrapper:** `src/lib/bedrock.ts` utilizing `@aws-sdk/client-bedrock-runtime` with JSON output schemas validated by Zod.

## 5. Agent Integration (MCP)
- **Protocol:** Model Context Protocol (MCP) stream over HTTP at `/api/mcp`.
- **Payloads:** Strict JSON adhering to Zod schemas.

## 6. Hosting & CI/CD
- **Platform:** AWS Amplify Hosting (Next.js SSR support).
- **Testing:** Vitest (unit & integration tests) + Playwright (end-to-end user flows).
- **Quality Gate:** `npm run check` (typecheck + ESLint + Vitest) must pass before commits.

## 7. Environment Variables (`.env.example`)

```bash
# AWS Core
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# Amazon Cognito
NEXT_PUBLIC_COGNITO_USER_POOL_ID=
NEXT_PUBLIC_COGNITO_CLIENT_ID=
COGNITO_CLIENT_SECRET=

# DynamoDB
DYNAMODB_TABLE_NAME=fitme-main
DATA_STORE=memory # 'memory' for local tests, 'dynamo' for cloud

# Amazon S3
S3_RESUME_BUCKET=fitme-resumes-storage

# Amazon Bedrock
BEDROCK_MODEL_ID=anthropic.claude-3-5-haiku-20241022-v1:0

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
MCP_AUTH_SECRET=fitme-local-mcp-secret
```

