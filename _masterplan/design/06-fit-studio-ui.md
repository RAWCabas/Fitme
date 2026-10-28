# Brief 06: The Fit Studio UI

Build the responsive Fit Studio user interface: side-by-side split view on desktop, adaptive tabbed switcher on mobile, ATS Fit Score gauge, live keyword match checklist, and Google XYZ bullet boosting.

## Read First
- `GEMINI.md`
- `AGENTS.md`
- `_masterplan/product/features-v1.md` § F-05 (The Fit Studio)
- `_masterplan/architecture/tech-stack.md`

## What to Build

1. **`src/app/(dashboard)/studio/page.tsx`**:
   - Server component loading initial user context and previous job opportunities.
2. **`src/app/(dashboard)/studio/studio-client.tsx`**:
   - **Interactive Studio Engine**:
     - *State 1 (Ingestion)*: Clean form to paste job description text or posting URL, with "Analyze & Tailor" button.
     - *State 2 (Interactive Studio)*:
       - **Desktop View ($\ge 1024\text{px}$)**: Side-by-side split screen (Left: Job Description & Keywords; Right: Tailored Resume & Diff).
       - **Mobile View ($< 768\text{px}$)**: Adaptive top switcher (`[Job Details]`, `[Fit Score & ATS]`, `[Tailored Preview]`).
       - **ATS Fit Score Gauge**: Visual circular/bar score (0–100%) with status badge.
       - **Keyword Match Checklist**: Color-coded badges for direct matches (green), transferable skills (yellow), and missing skills (red).
       - **Page Budget Toggle**: Switch between `1 Page` (compact curation) and `2 Pages` (expanded work history).
       - **Inline Metric Booster Modal**: Click "Boost Bullet" to supply numbers and rewrite bullets using Google XYZ format.
       - **Status Selector**: Dropdown to transition status between `draft`, `sent`, `interview`, `job_offer`, `rejected`.
3. **`tests/studio-ui.test.ts`**:
   - Component and integration tests verifying responsive tabs, Fit Score display, and tailoring actions.

## Files to Create / Touch
- `_masterplan/design/06-fit-studio-ui.md`
- `src/app/(dashboard)/studio/page.tsx`
- `src/app/(dashboard)/studio/studio-client.tsx`
- `tests/studio-ui.test.ts`

## Acceptance Criteria
- [ ] Fit Studio is fully responsive on desktop (split view) and mobile (tabbed navigation).
- [ ] ATS Fit Score, keyword checklist, and summary evaluation are rendered clearly.
- [ ] Users can toggle between 1-page and 2-page budgets.
- [ ] Status selector allows updating resume lifecycle status.
- [ ] `npm run check` passes with 0 lint, type, or test errors.
- [ ] Commit message: `feat(studio): build responsive fit studio with desktop split view and mobile tabs`
