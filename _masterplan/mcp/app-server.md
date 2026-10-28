# Fitme MCP Server Specification

Fitme provides an internal Model Context Protocol (MCP) server at `/api/mcp`. This allows AI assistants (Claude Desktop, Antigravity, Cursor, or CLI agents) to interact directly with the user's Fitme vault and tailoring engine.

---

## Endpoint & Authentication

- **URL:** `POST /api/mcp`
- **Protocol:** JSON-RPC 2.0 / MCP Stream over HTTP
- **Authentication:** `Authorization: Bearer <MCP_AUTH_SECRET>` or user Cognito bearer token.

---

## Exposed MCP Tools

### 1. `fitme_import_resume`

Imports raw resume text or PDF content and uses Bedrock to extract structured experiences, projects, and skills into the user's Master Profile.

- **Input:**

  ```json
  {
    "rawText": "string (optional if filePath provided)",
    "filePath": "string (optional path to local resume file)"
  }
  ```

- **Output:**

  ```json
  {
    "success": true,
    "importedRoles": 3,
    "importedProjects": 4,
    "importedSkills": 22,
    "profileSummary": "Senior Full-Stack Engineer with 5+ years experience in React, Node, and AWS..."
  }
  ```

### 2. `fitme_tailor_resume`

Tailors the user's master profile against a provided job description text or job URL.

- **Input:**

  ```json
  {
    "jobDescription": "string (raw JD text)",
    "sourceUrl": "string (optional URL)",
    "company": "string (optional, auto-detected if empty)",
    "role": "string (optional, auto-detected if empty)",
    "pageBudget": "1_page" | "2_pages"
  }
  ```

- **Output:**

  ```json
  {
    "tailoredResumeId": "uuid",
    "fitScore": 88,
    "matchedKeywords": ["React", "TypeScript", "AWS CDK"],
    "missingKeywords": ["GraphQL"],
    "tailoredSummary": "Full-stack builder specialized in...",
    "pdfUrl": "https://fitme-resumes...s3.amazonaws.com/..."
  }
  ```

### 3. `fitme_update_status`

Updates the lifecycle status of a tailored resume.

- **Input:**

  ```json
  {
    "tailoredResumeId": "uuid",
    "status": "draft" | "sent" | "interview" | "job_offer" | "rejected"
  }
  ```

### 4. `fitme_get_quick_fill`

Retrieves quick copy-paste snippets for completing an external application portal.

- **Input:**

  ```json
  {
    "tailoredResumeId": "uuid"
  }
  ```

- **Output:**

  ```json
  {
    "summary": "...",
    "topBulletPoints": ["...", "..."],
    "skillsCommaSeparated": "TypeScript, React, Node.js, AWS DynamoDB, Docker",
    "links": {
      "portfolio": "https://...",
      "github": "https://github.com/...",
      "linkedin": "https://linkedin.com/in/..."
    }
  }
  ```
