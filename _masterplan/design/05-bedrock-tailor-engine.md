# Brief 05: AI Fit Engine

Implement the AI Fit Engine: domain schemas for Job Opportunities and Tailored Resumes, ATS keyword match checklist, Fit Score calculation (0–100%), Google XYZ bullet rewriter, Bedrock JD parsing, and repository persistence.

## Read First
- `GEMINI.md`
- `AGENTS.md`
- `_masterplan/data-structures/domain-types.md` § Job Opportunity & Tailored Resume
- `_masterplan/architecture/tech-stack.md` § Bedrock

## What to Build

1. **`src/features/tailor/schema.ts`**:
   - Exact schemas from `domain-types.md`:
     - `jobOpportunitySchema`
     - `keywordMatchSchema`
     - `fitScoreSchema`
     - `tailoredResumeSchema`
     - `onDemandBoosterSchema`
     - Status enums (`draft`, `sent`, `interview`, `job_offer`, `rejected`).
     - Typography presets (`modern_standard`, `classic_ivy`, `tech_minimalist`).
     - Page budgets (`1_page`, `2_pages`).
2. **`src/features/tailor/repo.ts`**:
   - `TailorRepo` interface & `MemoryTailorRepo` store for jobs and tailored resumes.
3. **`src/features/tailor/service.ts`**:
   - `parseJobDescription(userId, rawDescription, sourceUrl)`
   - `calculateFitScore(profile, job)`: Computes ATS match %, keyword occurrences, and missing skills.
   - `tailorResume(userId, jobId, pageBudget, preset)`:
     - Filters out items where `isHidden: true` from the Master Profile.
     - Selects top relevant experiences & projects according to page budget (1 vs 2 pages).
     - Rewrites bullets using Bedrock into Google XYZ format (`Accomplished [X] as measured by [Y] by doing [Z]`).
     - Drafts a tailored professional summary.
     - Persists and returns the `TailoredResume`.
   - `boostBulletWithMetrics(bullet, metricsContext)`: Individual bullet optimizer.
   - `updateResumeStatus(userId, resumeId, status)`: Updates lifecycle status.
4. **API Route Handlers**:
   - `POST /api/tailor/parse-jd`
   - `POST /api/tailor/generate`
   - `POST /api/tailor/boost-bullet`
   - `GET /api/tailor/resumes`
   - `GET /api/tailor/resumes/[id]`
   - `PATCH /api/tailor/resumes/[id]/status`
5. **Tests (`tests/fit-engine.test.ts`)**:
   - Unit tests covering JD parsing, ATS Fit Score calculation, Google XYZ bullet rewriting, page budget filtering, and status updates.

## Files to Create
- `_masterplan/design/05-bedrock-tailor-engine.md`
- `src/features/tailor/schema.ts`
- `src/features/tailor/repo.ts`
- `src/features/tailor/service.ts`
- `src/app/api/tailor/parse-jd/route.ts`
- `src/app/api/tailor/generate/route.ts`
- `src/app/api/tailor/boost-bullet/route.ts`
- `src/app/api/tailor/resumes/route.ts`
- `src/app/api/tailor/resumes/[id]/route.ts`
- `src/app/api/tailor/resumes/[id]/status/route.ts`
- `tests/fit-engine.test.ts`

## Acceptance Criteria
- [ ] Schemas adhere strictly to `_masterplan/data-structures/domain-types.md`.
- [ ] Fit Score accurately reports matched, transferable, and missing skills with an overall score (0–100%).
- [ ] Tailoring filters out items marked `isHidden: true` in the user's Master Profile.
- [ ] Bullets are optimized into Google XYZ format (`Accomplished [X] as measured by [Y] by doing [Z]`).
- [ ] Status transitions validate allowed states (`draft` ➔ `sent` ➔ `interview` ➔ `job_offer` ➔ `rejected`).
- [ ] `npm run check` passes with 0 lint, type, or test errors.
- [ ] Commit message: `feat(tailor): implement bedrock fit engine and ats scoring`
