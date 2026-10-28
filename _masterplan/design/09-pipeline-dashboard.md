# Brief 09: Application Pipeline & Version Tracker

Build the Application Pipeline Dashboard: dynamic lifecycle metrics, follow-up aging alerts (applications in `sent` status $\ge 7$ days), interactive status cards with in-place status transitions, and direct links to Fit Studio and PDF export.

## Read First
- `GEMINI.md`
- `AGENTS.md`
- `_masterplan/product/features-v1.md` § F-08 (Application Pipeline & Version Lifecycle)
- `_masterplan/data-structures/domain-types.md`

## What to Build

1. **`src/app/(dashboard)/dashboard/pipeline-client.tsx`**:
   - Client component managing:
     - **Aging Alert Banner**: Automatically flags applications in `sent` status for $\ge 7$ days without updates, advising a follow-up note with a 1-click action.
     - **Interactive Pipeline Board / Filter**: Tab switcher across statuses (`All`, `Drafts`, `Sent`, `Interview`, `Job Offers`, `Archived`).
     - **Application Cards**: Each card displays:
       - Company name and role title.
       - ATS Fit Score badge with color coding ($\ge 85\%$ green, $70-84\%$ yellow, $<70\%$ red).
       - Version number and last updated relative date (`formatRelativeTime`).
       - Status badge dropdown allowing live lifecycle transitions (`draft` ➔ `sent` ➔ `interview` ➔ `job_offer` ➔ `rejected`).
       - Actions: "Open in Studio", "Export PDF", "Export Markdown".
     - **Empty States**: Encouraging CTA to tailor a new resume when no applications are found in a status.
2. **`src/app/(dashboard)/dashboard/page.tsx`**:
   - Server component loading real tailored resumes for the user via `getTailorRepo().listTailoredResumes(session.userId)` and their associated `JobOpportunity` details.
   - Computes live counts for each lifecycle stage.
3. **`tests/pipeline-dashboard.test.tsx`**:
   - Tests rendering of real lifecycle counts.
   - Tests detection and rendering of 7-day aging alerts for `sent` applications.
   - Tests filtering by status and updating status via the card dropdown.

## Acceptance Criteria
- [ ] Dashboard displays live counts for Drafts, Sent, Interviews, and Job Offers.
- [ ] Applications in `sent` status for $\ge 7$ days trigger an aging follow-up alert.
- [ ] Cards display company, role, ATS fit score, and status selector.
- [ ] `npm run check` passes with 0 lint, type, or test errors.
- [ ] Semantic commit message: `feat(dashboard): build application pipeline board and aging reminders`
