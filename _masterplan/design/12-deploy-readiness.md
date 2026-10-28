# Brief 12: Deploy Readiness & Amplify CI/CD

Configure AWS Amplify Hosting build pipeline (`amplify.yml`), production build optimization, environment templates, and deploy readiness verification.

## Read First
- `GEMINI.md`
- `AGENTS.md`
- `_masterplan/architecture/tech-stack.md`
- `_masterplan/architecture/folder-structure.md`

## What to Build

1. **`amplify.yml`**:
   - AWS Amplify build configuration for Next.js 15 App Router:
     - Pre-build phase: `npm ci --cache .npm --prefer-offline`
     - Quality Gate phase: `npm run check` (typecheck + linter + unit/integration tests)
     - Build phase: `npm run build`
     - Artifacts: Next.js standalone and static output (`.next/**/*`)
     - Caching paths: `.next/cache/**/*` and `.npm/**/*`
2. **Production Build Validation**:
   - Run `npm run build` to verify Next.js compiles all dynamic route segments, server components, and client components into a production build with 0 errors.
3. **`tests/deploy-readiness.test.ts`**:
   - Tests validating `GET /api/health` returns version, valid timestamp, and data store status.
   - Tests verifying environment configuration defaults and security boundaries.

## Acceptance Criteria
- [ ] `amplify.yml` passes syntax and specifies Next.js 15 App Router build phases.
- [ ] `npm run build` compiles with 0 errors.
- [ ] `npm run check` passes with 0 lint, type, or test errors.
- [ ] Commit message: `feat(deploy): configure amplify cicd pipeline and production build readiness`
