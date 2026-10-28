# Design — The Briefs for Coding Agents

Each file `NN-*.md` in this directory is **one self-contained development brief**:

- Contains the exact files to create or touch.
- Contains the exact function signatures and schemas.
- Specifies test cases and acceptance criteria.
- Defines where to stop.

## The Briefs Sequence for Fitme

| Brief | Title | Core Deliverables | Feature |
| :--- | :--- | :--- | :--- |
| `00-scaffold.md` | Scaffold & Quality Gates | Next.js 15, Tailwind v4, shadcn/ui, Vitest, `npm run check` | F-01 |
| `01-foundation.md` | Foundation & Health | AppError, date helpers, memory store factory, `/api/health` | F-01 |
| `02-auth-cognito.md` | Cognito Auth & Shell | Cognito session wrapper, login/register UI, responsive shell | F-01 |
| `03-profile-vault.md` | Master Experience Vault | Profile schemas, repo, service, granular item hide toggles | F-02 |
| `04-mcp-importer.md` | MCP Resume Importer | Bedrock Claude 3.5 Haiku resume parser, `/api/mcp` server | F-03 |
| `05-bedrock-tailor-engine.md` | AI Fit Engine | JD parser, Fit Score calculator, Google XYZ bullet rewriter | F-04, F-05 |
| `06-fit-studio-ui.md` | The Fit Studio UI | Desktop split diff view + Mobile tabbed view + ATS checklist | F-05 |
| `07-ats-export-engine.md` | ATS PDF & Markdown Exports | Clean PDF generator with 3 typography presets & Markdown | F-06 |
| `08-quick-fill-tray.md` | Quick-Fill Clipboard Tray | Desktop slide-out tray + mobile bottom sheet copy actions | F-07 |
| `09-pipeline-dashboard.md` | Dashboard & Version Tracker | Version status lifecycle, follow-up aging alerts | F-08 |
| `10-on-demand-boosters.md` | On-Demand Boosters | Cover letter, outreach note, interview cheat sheet generator | F-09 |
| `11-dynamodb-and-s3.md` | DynamoDB & S3 Persistence | Cloud single-table repositories and S3 presigned PDF links | F-10 |
| `12-deploy-readiness.md` | E2E Testing & Amplify CI/CD | Playwright flows, `amplify.yml`, production readiness | F-10 |

## Execution Protocol

1. Take briefs strictly in numerical order.
2. Read `GEMINI.md`, `AGENTS.md`, and the target brief before beginning.
3. Verify that `npm run check` passes before committing changes.
