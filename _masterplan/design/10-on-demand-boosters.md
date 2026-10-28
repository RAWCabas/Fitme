# Brief 10: On-Demand Boosters (Cover Letter, Outreach & Cheat Sheet)

Build the on-demand application accelerators powered by Bedrock: tailored Cover Letter, punchy LinkedIn Recruiter Outreach note, Gap-Based Interview Cheat Sheet, and Follow-Up Email, strictly generated on-demand without cluttering standard workflows.

## Read First
- `GEMINI.md`
- `AGENTS.md`
- `_masterplan/product/features-v1.md` § F-09 (On-Demand Boosters)
- `_masterplan/data-structures/domain-types.md`

## What to Build

1. **`src/features/boosters/service.ts`**:
   - `BoosterService`:
     - `generateCoverLetter(userId: string, resumeId: string): Promise<string>`
       - Prompts Bedrock Claude 3.5 Haiku to write a tailored 3-paragraph cover letter strictly referencing verified facts from the Master Vault and matching job requirements.
     - `generateRecruiterOutreach(userId: string, resumeId: string): Promise<string>`
       - Generates a concise (<100 words) high-conversion LinkedIn InMail / connection note highlighting the candidate's top 2 matching strengths.
     - `generateInterviewCheatSheet(userId: string, resumeId: string): Promise<InterviewCheatSheet>`
       - Analyzes missing and transferable ATS skills to generate STAR-method talking points for addressing gaps, predicted technical/behavioral interview questions, and questions to ask the interviewer.
     - `generateFollowUpEmail(userId: string, resumeId: string): Promise<string>`
       - Generates a polite, professional follow-up email for applications pending response for 7+ days.
2. **API Routes**:
   - `src/app/api/boosters/cover-letter/route.ts`
   - `src/app/api/boosters/outreach/route.ts`
   - `src/app/api/boosters/cheat-sheet/route.ts`
   - `src/app/api/boosters/follow-up/route.ts`
3. **Studio UI Integration**:
   - In `src/app/(dashboard)/studio/studio-client.tsx`:
     - Add an "AI Application Boosters" drawer/panel containing cards to generate:
       - Cover Letter (with Copy / Download)
       - Recruiter Outreach Note (with Copy)
       - Interview Cheat Sheet (with predicted questions & gap strategies)
4. **`tests/boosters.test.ts`**:
   - Unit tests verifying Bedrock prompt structure, JSON schema compliance, and truthful fallback outputs.
   - API integration tests testing all 4 authenticated booster endpoints.

## Acceptance Criteria
- [ ] Cover Letter adheres to verified Master Vault facts and target job requirements.
- [ ] Recruiter note is concise (<120 words) and personalized.
- [ ] Interview cheat sheet directly targets missing/transferable keywords from the ATS Fit Score.
- [ ] API routes enforce user authentication and handle errors cleanly with `AppError`.
- [ ] `npm run check` passes with 0 lint, type, or test errors.
- [ ] Semantic commit message: `feat(boosters): add on-demand cover letter and interview cheat sheet generators`
