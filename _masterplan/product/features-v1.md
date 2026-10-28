# V1 Features Specification

The features for Fitme V1, prioritized by **P0** (critical core) and **P1** (high-polish & portfolio enhancers).

---

### F-01 · App Shell & Multi-Tenant Auth (Amazon Cognito) — P0

- [ ] Next.js 15 App Router scaffold with Tailwind CSS and shadcn/ui.
- [ ] Amazon Cognito Hosted UI / custom login flow (Sign Up, Sign In, Sign Out, Token Refresh).
- [ ] Tenant context extracted in Next.js middleware / server components (`userId = session.sub`).
- [ ] Responsive navigation:
  - **Desktop**: Sticky top header / sidebar (`Dashboard`, `Fit Studio`, `Experience Vault`, `Profile`).
  - **Mobile**: Thumb-friendly bottom navigation bar + drawer.
- [ ] Health check endpoint: `GET /api/health` returning version, auth status, and database connectivity.

### F-02 · Master Experience Vault & Granular Item Visibility — P0

- [ ] Centralized profile management for:
  - Personal & Contact Information (Name, Title, Email, Phone, Location, Links).
  - Work Experience (Company, Role, Dates, Location, Bullet Points).
  - Projects (Name, Description, Tech Stack, URLs, Bullet Points).
  - Skills (Categorized: Languages, Frameworks, Cloud/DevOps, Tools, Soft Skills).
  - Education & Certifications.
- [ ] **Granular Hide/Show Toggles:** Eye icon toggle on every project, job, bullet point, or skill.
  - Hidden items remain in the vault but are omitted from generated tailored resumes.
- [ ] **"Weak Bullet" Metric Booster:**
  - Automated scan for passive bullet points lacking quantifiable results.
  - "Boost Bullet" action opens a quick prompt to supply rough numbers/metrics, rewritten by Bedrock into Google XYZ format (`"Accomplished [X] as measured by [Y] by doing [Z]"`).

### F-03 · MCP Resume Importer (`/api/mcp`) — P1

- [ ] App-level MCP server hosted at `/api/mcp`.
- [ ] Tool `fitme_import_resume`: Accepts raw text or PDF path, invokes Amazon Bedrock (Claude 3.5 Haiku) with strict JSON schema to parse experiences, projects, and skills directly into the user's Master Vault.
- [ ] Tool `fitme_tailor_resume`: Accepts job description, triggers tailoring, and returns Fit Score.
- [ ] Tool `fitme_get_quick_fill`: Retrieves tailored snippets for form filling.

### F-04 · Job Description Parser & URL Fetcher — P0

- [ ] Ingest job descriptions via two methods:
  - Direct text paste.
  - One-click URL scraper (Greenhouse, Lever, LinkedIn, Indeed).
- [ ] Bedrock parser extracts: Company, Role Title, Location, Salary (if stated), Hard Requirements, Nice-to-haves, and Tech Keywords.
- [ ] Saves as a `JobOpportunity` entity linked to the user.

### F-05 · The Fit Studio (ATS Score & Bullet Tailor) — P0

- [ ] **Fit Score Calculation (0–100%):**
  - Keyword Match Breakdown: Direct Matches (Green), Transferable Skills (Yellow), Gaps (Red).
- [ ] **Targeted Bullet Rewriting:** Rewrites master bullets to emphasize JD keywords while preserving truthfulness.
- [ ] **Executive Summary Generator:** Produces a targeted 2–3 sentence opening summary.
- [ ] **Page Budget Solver:** User toggle for `1 Page` or `2 Pages`; automatically curates top 3–4 projects and optimal bullet counts to avoid page overflow.
- [ ] **Responsive Fit Studio Layout:**
  - **Desktop:** Side-by-side split screen (JD on left, Tailored Resume & Diff on right).
  - **Mobile:** Tabbed switcher (`[Job Description]` | `[Fit & Diff]` | `[Resume Preview]`).

### F-06 · ATS Exports & Typography Presets — P0

- [ ] **Formats:**
  - ATS-clean PDF export (single-column, machine-readable, generated via `@react-pdf/renderer` or clean HTML engine).
  - Raw clean Markdown export.
- [ ] **Typography Presets (1-Click Switch):**
  - *Modern Standard* (Clean Sans-Serif, bold section headers, subtle dividers).
  - *Classic Ivy* (Serif / Garamond style, executive formal).
  - *Tech Minimalist* (Monospace accents, clean tech badges).

### F-07 · Quick-Fill Clipboard Tray — P1

- [ ] Slide-out drawer on Desktop, thumb-friendly bottom sheet on Mobile.
- [ ] 1-Click copy buttons for:
  - Tailored Executive Summary.
  - Individual role bullet points.
  - Skills list (formatted as comma-separated text).
  - Portfolio, GitHub, and LinkedIn links.
- [ ] Designed to accelerate completing Workday, Taleo, and Greenhouse application portals.

### F-08 · Application Pipeline & Version Lifecycle — P0

- [ ] Tailored resumes carry a distinct lifecycle status:
  - `draft` ➔ `sent` ➔ `interview` ➔ `job_offer` ➔ `rejected`.
- [ ] Dashboard shows active applications grouped by status, with search and filter.
- [ ] **Follow-up Aging Alerts:** Visual flag on applications in `sent` status for $\ge 7$ days.
- [ ] **Version History:** View previous tailored versions linked to the same company/role.

### F-09 · Optional On-Demand Boosters — P1

- [ ] Dedicated buttons in the Fit Studio (generated only when explicitly clicked):
  - **[Generate Cover Letter]:** 150–200 word tailored letter.
  - **[Generate Recruiter Outreach]:** 300-character LinkedIn InMail message.
  - **[Generate Interview Prep Sheet]:** Gap-based questions and talking points (enabled when status is `interview`).
  - **[Draft Follow-Up Email]:** Polite check-in note for aging applications.

### F-10 · Cloud Infrastructure & Amplify Deployment — P0

- [ ] DynamoDB Single-Table Design partitioned by `USER#<userId>`.
- [ ] Amazon S3 bucket for storing exported PDFs with presigned download URLs.
- [ ] Amazon Bedrock IAM policy for Claude 3.5 Haiku invocation.
- [ ] `amplify.yml` build pipeline for automated deployment on AWS Amplify.
