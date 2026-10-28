# AGENTS.md — rules for any agent working in Fitme

Read `GEMINI.md` and `_masterplan/README.md` before starting any task. These rules are mandatory.
`_masterplan/data-structures/` decides shapes; the current brief in `_masterplan/design/` decides the immediate work.

## The project

**Fitme**: An AI Resume Tailor & Job Application Pipeline.
- **Stack**: Next.js 15 (App Router) + TypeScript, Tailwind CSS + shadcn/ui.
- **Backend / Cloud**: Amazon Cognito (Multi-tenant Auth), Amazon DynamoDB (Single-table repository pattern), Amazon Bedrock (Claude 3.5 Haiku for parsing, ATS scoring & bullet tailoring), Amazon S3 (PDF storage).
- **Hosting**: AWS Amplify with CI/CD.
- **AI Agent Interface**: Model Context Protocol (MCP) server at `/api/mcp` for Claude Desktop / Antigravity / Cursor.
- **Devices**: First-class responsive support for both **Desktop** and **Mobile**.

## Commands

| Command | Does |
| :--- | :--- |
| `npm run dev` | Starts local Next.js dev server at `http://localhost:3000` |
| `npm run check` | Lint + TypeScript typecheck + unit/integration tests. **Must pass before every commit.** |
| `npm run test` | Runs Vitest once |
| `npm run test:watch` | Runs Vitest in watch mode |
| `npm run test:e2e` | Runs Playwright tests against local server |
| `npm run build` | Next.js production build |

## How to work

1. **One brief per task**, taken from `_masterplan/design/` in numerical order.
2. Before modifying code, summarize in 1 paragraph what files you will create or change and why.
3. Run `npm run check` after changes. Fix any failures.
4. Keep git commits semantic and descriptive: `feat(tailor): ATS keyword checklist`, `fix(mobile): fit studio tab toggle`.
5. When something fails twice in the same manner, stop and report the root cause rather than attempting arbitrary rewrites.

## Never

- Never commit AWS keys, secrets, or passwords. All environment variables stay in `.env.local` and `.env.example`.
- Never bypass the `userId` tenant boundary in repositories or services.
- Never write non-responsive UI: all pages must look and function cleanly on mobile ($<768\text{px}$) and desktop ($\ge 1024\text{px}$).
- Never make unvetted direct API calls to Bedrock without wrapping in `src/lib/bedrock.ts` and parsing with Zod.
- Never swallow errors; throw or return typed `AppError` instances with HTTP status codes and user-friendly messages.

## Definition of done (per brief)

- Acceptance criteria from the design brief are fully satisfied.
- Clean responsive rendering verified on desktop and mobile viewports.
- Unit and integration tests cover schemas, services, and API routes.
- `npm run check` passes with 0 lint, type, or test errors.

