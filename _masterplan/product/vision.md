# Vision: Fitme

## What It Is

**Fitme** is an AI-powered Resume Tailoring Engine & Job Application Pipeline.

Instead of treating job hunting as repetitive copy-pasting across static Word documents and spreadsheets, Fitme connects the entire workflow:

1. **Master Experience Vault:** A single source of truth containing a candidate's complete history of projects, achievements, roles, and skills, with granular visibility toggles to hide/show items.
2. **AI Fit Engine:** Powered by Amazon Bedrock (Claude 3.5 Haiku). It ingests any Job Description (raw text or URL), extracts critical requirements, calculates a real-time ATS Fit Score with a keyword match checklist, and rewrites bullets into metric-driven Google XYZ format.
3. **Application & Version Tracker:** Pairs every job opportunity with the exact tailored resume version sent, tracking progress from `draft` ➔ `sent` ➔ `interview` ➔ `job_offer` ➔ `rejected`.
4. **Desktop & Mobile First:** Seamlessly responsive whether sitting at a multi-monitor desk or applying via mobile phone on the go.
5. **Agentic Ready (MCP):** Features an MCP server at `/api/mcp` allowing external agents (Claude Desktop, Cursor, Antigravity) to import resumes and tailor applications on command.

## Core Pillars

1. **No Hallucinations / Truthful Tailoring:** The AI tailors phrasing, highlights relevant keywords, and re-orders points, but *never* fabricates jobs or companies. It is grounded strictly in the Master Experience Vault.
2. **First-Class Mobile & Desktop:** Tailoring on desktop offers a split-screen diff view; tailoring on mobile offers a fluid tabbed experience with an easy-tap Quick-Fill bottom sheet.
3. **Multi-Tenant by Design:** Authenticated via Amazon Cognito, with all data partitioned by `userId` in DynamoDB. Designed for multiple users from day one.
4. **ATS Compliant:** Exports to ATS-parseable single-column PDF and Markdown, complete with typography presets (Modern Standard, Classic Ivy, Tech Minimalist).

## What "Done" Looks Like (V1 Milestone)

1. A live HTTPS app hosted on **AWS Amplify**.
2. Seamless **Amazon Cognito** sign-up/sign-in.
3. **Master Experience Vault** populated manually or via **MCP Resume Importer**.
4. **The Fit Studio**: Ingesting a JD ➔ calculating Fit Score ➔ tailoring bullets ➔ exporting ATS-clean PDF & Markdown.
5. **Quick-Fill Tray** facilitating fast application form submissions on desktop and mobile.
6. **Pipeline Dashboard** with aging follow-up alerts and optional interview cheat sheet generation.
