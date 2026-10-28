# Folder Structure

Fitme uses a feature-based folder architecture inside `src/`. Business logic is strictly separated into domain features, each owning its Zod schemas, repository interfaces, and services.

```
src/
├── app/                              # Next.js App Router (Pages, Layouts, API Routes)
│   ├── (auth)/                       # Authentication routes (login, register, forgot-password)
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/                  # Authenticated app shell
│   │   ├── layout.tsx                # Desktop nav + Mobile bottom bar
│   │   ├── page.tsx                  # Dashboard & Pipeline Overview
│   │   ├── vault/                    # Master Experience Vault page
│   │   ├── studio/                   # The Fit Studio (new tailor / edit tailor)
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── applications/             # Applications list & details
│   │   │   └── [id]/page.tsx
│   │   └── settings/page.tsx
│   ├── api/                          # Backend API endpoints
│   │   ├── auth/                     # Auth callbacks / token handling
│   │   ├── profile/                  # Master profile CRUD
│   │   ├── tailor/                   # Fit Engine & Bedrock triggers
│   │   ├── applications/             # Application lifecycle CRUD
│   │   ├── export/                   # PDF & Markdown generation
│   │   ├── mcp/route.ts              # Model Context Protocol server endpoint
│   │   └── health/route.ts           # System health check
│   ├── globals.css                   # Tailwind styles
│   └── layout.tsx                    # Root layout
│
├── features/                         # Domain Features (Business Logic Layer)
│   ├── profile/                      # Master Experience Vault
│   │   ├── schema.ts                 # Zod schemas (Profile, Experience, Project, Skill)
│   │   ├── repo.ts                   # ProfileRepo interface & memory/dynamo implementations
│   │   ├── service.ts                # Profile service (CRUD, item visibility toggles)
│   │   └── components/               # Experience cards, hide toggles, metric booster
│   │
│   ├── tailor/                       # AI Fit Engine & Tailoring Studio
│   │   ├── schema.ts                 # Zod schemas (JobOpportunity, TailoredResume, FitScore)
│   │   ├── service.ts                # Bedrock prompt orchestration & tailoring logic
│   │   ├── repo.ts                   # TailoredResumeRepo interface & implementations
│   │   └── components/               # Studio split view, mobile tabs, diff viewer, keyword checklist
│   │
│   ├── applications/                 # Application Pipeline & Tracking
│   │   ├── schema.ts                 # Zod schemas (Application, Status, Lifecycle Notes)
│   │   ├── repo.ts                   # ApplicationRepo interface
│   │   ├── service.ts                # Status transitions, follow-up aging logic
│   │   └── components/               # Kanban board, status pills, aging badges
│   │
│   ├── export/                       # PDF & Markdown Generation
│   │   ├── pdf-template.tsx          # React-PDF ATS templates (Modern, Classic, Minimalist)
│   │   ├── markdown-generator.ts     # Clean Markdown formatter
│   │   └── service.ts                # S3 upload & presigned URL delivery
│   │
│   └── quick-fill/                   # Quick-Fill Clipboard Tray
│       ├── components/               # Desktop slide-out tray & mobile bottom sheet
│       └── service.ts                # Snippet formatting helpers
│
├── lib/                              # Shared Infrastructure & Utilities
│   ├── auth/                         # Cognito JWT verification & session resolution
│   │   ├── cognito.ts
│   │   └── session.ts
│   ├── bedrock.ts                    # Amazon Bedrock client & structured invocation wrapper
│   ├── s3.ts                         # S3 client & presigned URL generators
│   ├── dynamodb.ts                   # DynamoDB client & single-table query helpers
│   ├── dates.ts                      # Date/time formatting helpers (Intl en-US / ISO)
│   ├── errors.ts                     # AppError class and HTTP error mapper
│   └── utils.ts                      # shadcn cn() utility
│
└── components/                       # Shared UI Components (shadcn/ui primitives)
    └── ui/                           # Button, Dialog, Input, Tabs, Sheet, Badge, etc.
```

## Layering Rules

1. **Client Components (`"use client"`)** never call DynamoDB, S3, or Bedrock directly. They invoke Server Actions or fetch `/api/*`.
2. **Route Handlers and Server Actions** receive requests, resolve the authenticated `userId`, and delegate immediately to a domain `service`.
3. **Services** take inputs, validate with Zod, enforce business rules (e.g., metric calculations, tenant boundaries), and call repositories or AWS wrappers.
4. **Repositories** are interface-driven (`ProfileRepo`, `ApplicationRepo`, `TailorRepo`) with two interchangeable implementations:
   - `MemoryRepo`: Fast, deterministic in-memory store for unit tests and local mock development.
   - `DynamoRepo`: Production-grade single-table DynamoDB queries scoped to `userId`.

