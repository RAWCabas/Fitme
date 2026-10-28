# Brief 00: Scaffold & Quality Gates

Initialize the Fitme repository with Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Vitest, and configure the mandatory `npm run check` pipeline.

## Read First
- `GEMINI.md`
- `AGENTS.md`
- `_masterplan/architecture/tech-stack.md`
- `_masterplan/architecture/folder-structure.md`

## What to Build

1. Initialize Next.js 15 with App Router, TypeScript, ESLint, and Tailwind CSS in `C:\Fitme`.
2. Configure `package.json` scripts:
   - `"dev"`: `"next dev"`
   - `"build"`: `"next build"`
   - `"test"`: `"vitest run"`
   - `"test:watch"`: `"vitest"`
   - `"check"`: `"tsc --noEmit && eslint . && vitest run"`
3. Install and configure Vitest with React Testing Library.
4. Set up base `tsconfig.json` with strict mode and `@/*` path alias mapping to `src/*`.
5. Set up `.env.example` mirroring `architecture/tech-stack.md`.
6. Create base directory structure matching `architecture/folder-structure.md`.

## Files to Create / Touch
- `package.json`
- `tsconfig.json`
- `vitest.config.ts`
- `tailwind.config.ts` (or CSS v4 theme config)
- `.env.example`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/lib/utils.ts`

## Acceptance Criteria
- [ ] `npm run check` runs typecheck, lint, and tests, exiting with 0 errors.
- [ ] Next.js app builds cleanly with `npm run build`.
- [ ] Base folder structure created in `src/`.
- [ ] Commit message: `chore(scaffold): initialize fitme with nextjs 15 and quality gates`

